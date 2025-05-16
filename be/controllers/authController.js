const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/email');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');
const crypto = require('crypto');
const Joi = require('joi');
const { verifyRecaptcha } = require('../config/recaptcha');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().required(),
  phone: Joi.string().required(),
  birthday: Joi.date().required(),
  recaptchaToken: Joi.string().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  recaptchaToken: Joi.string().required(),
});

exports.register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { email, password, name, phone, birthday, recaptchaToken } = value;

    // Verify reCAPTCHA
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      throw new AppError('Vui lòng xác thực lại reCAPCHA', 400);
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone }],
      },
    });
    if (existingUser) {
      throw new AppError('Email hoặc Số điện thoại đã tồn tại', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      birthday,
      verificationToken,
      verificationTokenExpiry,
    });

    const verificationLink = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || '3456'}`}/api/auth/verify-email?token=${verificationToken}`;
    try {
      await sendVerificationEmail(email, verificationLink);
    } catch (emailError) {
      console.error('Lỗi gửi email xác minh:', emailError);
      throw new AppError('Đăng ký thành công, nhưng không thể gửi email xác minh. Vui lòng liên hệ hỗ trợ.', 500);
    }

    res.status(201).json({
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác minh.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        birthday: user.birthday,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { email, password, recaptchaToken } = value;

    // Verify reCAPTCHA
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      throw new AppError('Vui lòng xác thực lại reCAPTCHA', 400);
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401); // Cải thiện thông điệp lỗi
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    if (!user.isVerified) {
      throw new AppError('Email chưa được xác minh', 403);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Tăng thời gian từ 1h lên 24h
    );

    res.status(200).json({
      message: 'Đăng nhập thành công.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await TokenBlacklist.create({ token: req.token,
     });
    res.json({ message: 'Đăng xuất thành công.' });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      throw new AppError('Token không hợp lệ.', 400);
    }

    const user = await User.findOne({
      where: {
        verificationToken: token,
        verificationTokenExpiry: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      // Chuyển hướng đến trang frontend với thông báo lỗi
      return res.redirect(`${process.env.FE_URL}/verify-email?status=error&message=Token không hợp lệ hoặc đã hết hạn`);
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    // Chuyển hướng đến trang frontend với thông báo thành công
    res.redirect(`${process.env.FE_URL}/verify-email?status=success&message=Email đã được xác minh thành công`);
  } catch (err) {
    console.error('Lỗi xác minh email:', err);
    res.redirect(`${process.env.FE_URL}/verify-email?status=error&message=Có lỗi xảy ra khi xác minh email`);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email là bắt buộc.', 400);
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Email không tồn tại', 404);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // Hết hạn sau 1 giờ

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const resetLink = `${process.env.FE_URL}/reset-password?token=${resetToken}`;
    await sendResetPasswordEmail(email, resetLink);

    res.json({ message: 'Liên kết đặt lại mật khẩu đã được gửi qua email.' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      throw new AppError('Token và mật khẩu mới là bắt buộc.', 400);
    }

    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      throw new AppError('Token không hợp lệ hoặc đã hết hạn.', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Mật khẩu đã được đặt lại thành công.' });
  } catch (err) {
    next(err);
  }
};

exports.resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email là bắt buộc.', 400);
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Email không tồn tại', 404);
    }

    if (user.isVerified) {
      throw new AppError('Email đã được xác minh.', 400);
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    // Sử dụng biến môi trường cho API endpoint
    const verificationLink = `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || '3456'}`}/api/auth/verify-email?token=${verificationToken}`;
    try {
      await sendVerificationEmail(email, verificationLink);
    } catch (emailError) {
      console.error('Lỗi gửi email xác minh:', emailError);
      throw new AppError('Không thể gửi email xác minh. Vui lòng liên hệ hỗ trợ.', 500);
    }

    res.json({ message: 'Email xác minh đã được gửi lại.' });
  } catch (err) {
    next(err);
  }
};
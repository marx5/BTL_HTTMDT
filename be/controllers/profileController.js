const { User } = require('../models');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');
const Joi = require('joi');
const { sequelize } = require('../config/database');

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).allow(null),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).allow(null),
  birthday: Joi.date()
    .less('now')
    .min('1900-01-01')
    .allow(null)
    .messages({
      'date.less': 'Ngày sinh không được trong tương lai.',
      'date.min': 'Ngày sinh không hợp lệ (quá xa trong quá khứ).',
    }),
});

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'role', 'name', 'phone', 'birthday', 'createdAt'],
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { name, phone, birthday } = value;
    const user = await User.findByPk(req.user.id, { transaction });

    if (!user) {
      throw new AppError('user_not_found', 404);
    }

    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({ where: { phone }, transaction });
      if (existingUser) {
        throw new AppError('phone_already_exists', 400);
      }
    }

    await user.update(
      {
        name: name || user.name,
        phone: phone || user.phone,
        birthday: birthday || user.birthday,
      },
      { transaction }
    );

    await transaction.commit();

    res.json({ message: 'Cập nhật thông tin thành công', user });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/TokenBlacklist');
const User = require('../models/User');
const AppError = require('../utils/appError');

// Hàm helper để in log màu sắc
const colorLog = {
  info: (message) => console.log('\x1b[36m%s\x1b[0m', `[Auth] ${message}`), // Cyan
  warning: (message) => console.log('\x1b[33m%s\x1b[0m', `[Auth] ${message}`), // Yellow
  error: (message) => console.log('\x1b[31m%s\x1b[0m', `[Auth] ${message}`), // Red
  debug: (message) => process.env.NODE_ENV === 'development' && console.log('\x1b[90m%s\x1b[0m', `[Auth Debug] ${message}`), // Gray, only in dev
};

const auth = async (req, res, next) => {
  try {
    // Debug logging chỉ hiển thị trong chế độ development
    colorLog.debug('Xử lý yêu cầu xác thực');
    
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      colorLog.warning('Không tìm thấy Authorization header');
      throw new AppError('no_token_provided', 401);
    }

    // Check Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      colorLog.warning('Định dạng token không hợp lệ');
      throw new AppError('invalid_token_format', 401);
    }

    const token = parts[1];
    colorLog.debug('Token được xác định');
    
    // Check if token is blacklisted
    const blacklisted = await TokenBlacklist.findOne({ where: { token } });
    if (blacklisted) {
      colorLog.warning('Token đã bị đưa vào blacklist');
      throw new AppError('token_blacklisted', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    colorLog.debug(`Token đã xác minh cho user ID: ${decoded.id}`);
    
    // Get user with role
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'role']
    });
    
    if (!user) {
      colorLog.error('Không tìm thấy người dùng cho token này');
      throw new AppError('user_not_found', 401);
    }

    // Attach user and token to request
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    colorLog.error(`Lỗi xác thực: ${err.message}`);
    if (err instanceof jwt.JsonWebTokenError) {
      next(new AppError('invalid_token', 401));
    } else {
      next(err);
    }
  }
};

const adminAuth = async (req, res, next) => {
  try {
    console.log('Checking admin role for user:', req.user)
    if (!req.user || req.user.role !== 'admin') {
      console.log('User is not admin:', req.user?.role);
      throw new AppError('admin_access_required', 403);
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { auth, adminAuth };
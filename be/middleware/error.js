const { logger, consoleLog } = require('../utils/logger');

const errorMessages = {
  // Auth errors
  email_already_exists: 'Email này đã được đăng ký.',
  phone_already_exists: 'Số điện thoại này đã được đăng ký.',
  invalid_credentials: 'Email hoặc mật khẩu không chính xác.',
  email_not_verified: 'Email chưa được xác minh. Vui lòng kiểm tra email để xác minh.',
  token_expired: 'Token đã hết hạn. Vui lòng thử lại.',
  invalid_token: 'Token không hợp lệ.',
  token_blacklisted: 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.',
  no_token_provided: 'Không có token xác thực. Vui lòng đăng nhập.',
  user_not_found: 'Không tìm thấy người dùng.',
  admin_access_required: 'Bạn không có quyền truy cập vào tài nguyên này.',

  // Resource errors
  product_not_found: 'Không tìm thấy sản phẩm.',
  category_not_found: 'Không tìm thấy danh mục.',
  order_not_found: 'Không tìm thấy đơn hàng.',
  cart_not_found: 'Không tìm thấy giỏ hàng.',
  address_not_found: 'Không tìm thấy địa chỉ.',
  favorite_not_found: 'Không tìm thấy sản phẩm yêu thích.',
  review_not_found: 'Không tìm thấy đánh giá.',
  
  // Validation errors
  invalid_product_data: 'Dữ liệu sản phẩm không hợp lệ.',
  invalid_category_data: 'Dữ liệu danh mục không hợp lệ.',
  invalid_address_data: 'Dữ liệu địa chỉ không hợp lệ.',
  invalid_order_data: 'Dữ liệu đơn hàng không hợp lệ.',
  invalid_review_data: 'Dữ liệu đánh giá không hợp lệ.',
  
  // Operation errors
  order_already_cancelled: 'Đơn hàng đã bị hủy.',
  out_of_stock: 'Sản phẩm đã hết hàng.',
  variants_already_exist: 'Biến thể sản phẩm đã tồn tại.',
};

const errorHandler = (err, req, res, next) => {
  // Log chi tiết lỗi với stack trace
  logger.error(`${err.message || 'Lỗi không xác định'}`, { 
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500
  });
  
  // Console log ngắn gọn
  consoleLog.error(`${err.statusCode || 500}: ${err.message || 'Lỗi không xác định'} (${req.method} ${req.path})`);

  // Nếu đây là lỗi Sequelize
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(e => e.message);
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors
    });
  }

  // Check xem lỗi có message key trong errorMessages không
  const errorMessage = errorMessages[err.message] || err.message || 'Đã xảy ra lỗi, vui lòng thử lại sau.';
  
  // Gửi phản hồi lỗi
  res.status(err.statusCode || 500).json({
    message: errorMessage
  });
};

module.exports = errorHandler;
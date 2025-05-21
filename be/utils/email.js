const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendVerificationEmail = async (to, verificationLink) => {
  const mailOptions = {
    from: `"Fashion Store" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Xác minh email của bạn - Fashion Store',
    html: `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #ddd;
          }
          .header img {
            max-width: 150px;
          }
          .content {
            padding: 20px 0;
            text-align: center;
          }
          .content h2 {
            color: #1D4ED8;
            margin-bottom: 10px;
          }
          .content p {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1D4ED8;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
          }
          .button:hover {
            background-color: #1E40AF;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 14px;
            color: #666;
          }
          .footer a {
            color: #1D4ED8;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://photos.app.goo.gl/9weJCuxNP4yciYBi6" alt="Fashion Store Logo">
          </div>
          <div class="content">
            <h2>Xác minh email của bạn</h2>
            <p>Xin chào,</p>
            <p>Cảm ơn bạn đã đăng ký tại Fashion Store! Vui lòng nhấp vào nút bên dưới để xác minh địa chỉ email của bạn và hoàn tất quá trình đăng ký.</p>
            <a href="${verificationLink}" class="button">Xác minh email ngay</a>
            <p>Liên kết này có hiệu lực trong 24 giờ. Nếu liên kết hết hạn, bạn có thể yêu cầu gửi lại email xác minh.</p>
          </div>
          <div class="footer">
            <p>Nếu bạn không đăng ký tại Fashion Store, vui lòng bỏ qua email này.</p>
            <p>Cần hỗ trợ? Liên hệ với chúng tôi qua <a href="mailto:support@fashionstore.com">support@fashionstore.com</a> hoặc gọi <a href="tel:0901234567">0901234567</a>.</p>
            <p>© 2025 Fashion Store. Mọi quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

exports.sendResetPasswordEmail = async (to, resetLink) => {
  const mailOptions = {
    from: `"Fashion Store" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Đặt lại mật khẩu của bạn - Fashion Store',
    html: `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #ddd;
          }
          .header img {
            max-width: 150px;
          }
          .content {
            padding: 20px 0;
            text-align: center;
          }
          .content h2 {
            color: #1D4ED8;
            margin-bottom: 10px;
          }
          .content p {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1D4ED8;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
          }
          .button:hover {
            background-color: #1E40AF;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 14px;
            color: #666;
          }
          .footer a {
            color: #1D4ED8;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://photos.app.goo.gl/9weJCuxNP4yciYBi6" alt="Fashion Store Logo">
          </div>
          <div class="content">
            <h2>Đặt lại mật khẩu</h2>
            <p>Xin chào,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Fashion Store. Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu của bạn.</p>
            <a href="${resetLink}" class="button">Đặt lại mật khẩu ngay</a>
            <p>Liên kết này có hiệu lực trong 1 giờ. Nếu liên kết hết hạn, bạn có thể yêu cầu đặt lại mật khẩu lần nữa.</p>
          </div>
          <div class="footer">
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            <p>Cần hỗ trợ? Liên hệ với chúng tôi qua <a href="mailto:support@fashionstore.com">support@fashionstore.com</a> hoặc gọi <a href="tel:0901234567">0901234567</a>.</p>
            <p>© 2025 Fashion Store. Mọi quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

exports.sendOrderConfirmationEmail = async (to, orderId, total, shippingFee, paymentMethod, items) => {
  // Chuyển đổi paymentMethod thành text dễ đọc
  const paymentMethodText = {
    'cod': 'Thanh toán khi nhận hàng (COD)',
    'vnpay': 'Thanh toán qua VNPay',
    'momo': 'Thanh toán qua MoMo'
  }[paymentMethod] || 'Thanh toán khi nhận hàng (COD)';

  // Tạo HTML cho danh sách sản phẩm
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <img src="${item.image || 'https://via.placeholder.com/50'}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover;">
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.price.toLocaleString('vi-VN')} VND</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${(item.price * item.quantity).toLocaleString('vi-VN')} VND</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"Fashion Store" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Xác nhận đơn hàng của bạn - Fashion Store',
    html: `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #ddd;
          }
          .header img {
            max-width: 150px;
          }
          .content {
            padding: 20px 0;
            text-align: center;
          }
          .content h2 {
            color: #1D4ED8;
            margin-bottom: 10px;
          }
          .content p {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .order-details {
            text-align: left;
            margin: 0 auto;
            max-width: 400px;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 5px;
          }
          .order-details p {
            margin: 5px 0;
            font-size: 16px;
          }
          .products-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .products-table th {
            background-color: #f8f9fa;
            padding: 10px;
            text-align: left;
            border-bottom: 2px solid #ddd;
          }
          .products-table td {
            padding: 10px;
            border-bottom: 1px solid #eee;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 14px;
            color: #666;
          }
          .footer a {
            color: #1D4ED8;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://photos.app.goo.gl/9weJCuxNP4yciYBi6" alt="Fashion Store Logo">
          </div>
          <div class="content">
            <h2>Xác nhận đơn hàng của bạn</h2>
            <p>Xin chào,</p>
            <p>Cảm ơn bạn đã đặt hàng tại Fashion Store! Đơn hàng của bạn đã được ghi nhận thành công. Dưới đây là thông tin chi tiết về đơn hàng của bạn:</p>
            
            <div class="order-details">
              <p><strong>ID đơn hàng:</strong> #${orderId}</p>
              <p><strong>Phương thức thanh toán:</strong> ${paymentMethodText}</p>
            </div>

            <table class="products-table">
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Tên sản phẩm</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align: right;"><strong>Phí vận chuyển:</strong></td>
                  <td>${shippingFee.toLocaleString('vi-VN')} VND</td>
                </tr>
                <tr>
                  <td colspan="4" style="text-align: right;"><strong>Tổng thanh toán:</strong></td>
                  <td><strong>${(total + shippingFee).toLocaleString('vi-VN')} VND</strong></td>
                </tr>
              </tfoot>
            </table>

            <p>Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất. Bạn có thể theo dõi trạng thái đơn hàng trong tài khoản của mình.</p>
          </div>
          <div class="footer">
            <p>Cần hỗ trợ? Liên hệ với chúng tôi qua <a href="mailto:support@fashionstore.com">support@fashionstore.com</a> hoặc gọi <a href="tel:0901234567">0901234567</a>.</p>
            <p>© 2025 Fashion Store. Mọi quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};
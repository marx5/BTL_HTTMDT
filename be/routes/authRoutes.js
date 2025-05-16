const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
// const rateLimit = require('express-rate-limit');

// Rate limiting cho đăng ký người dùng - Đã vô hiệu hóa
// const registerLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 10,
//   message: 'Quá nhiều yêu cầu đăng ký, vui lòng thử lại sau 15 phút.',
// });

// Rate limiting cho đăng nhập - Đã vô hiệu hóa
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 20,
//   message: 'Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 15 phút.',
// });

// Rate limiting cho yêu cầu đặt lại mật khẩu - Đã vô hiệu hóa
// const forgotPasswordLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: 'Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 15 phút.',
// });

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký người dùng mới
 *     tags: [Xác thực]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *               name:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               phone:
 *                 type: string
 *                 example: 0901234567
 *               birthday:
 *                 type: string
 *                 format: date
 *                 example: 2000-01-01
 *             required:
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: Người dùng đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đăng ký thành công. Vui lòng kiểm tra email để xác minh.
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Email hoặc số điện thoại đã tồn tại
 */
router.post('/register', /* registerLimiter, */ authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập người dùng
 *     tags: [Xác thực]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đăng nhập thành công.
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Thông tin đăng nhập không hợp lệ
 *       403:
 *         description: Email chưa được xác minh
 */
router.post('/login', /* loginLimiter, */ authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất người dùng
 *     tags: [Xác thực]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đăng xuất thành công.
 *       401:
 *         description: Không được phép truy cập
 */
router.post('/logout', auth, authController.logout);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Xác minh email của người dùng
 *     tags: [Xác thực]
 *     parameters:
 *       - name: token
 *         in: query
 *         required: true
 *         description: Token xác minh email
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email đã được xác minh
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email đã được xác minh thành công.
 *       400:
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
router.get('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Yêu cầu đặt lại mật khẩu
 *     tags: [Xác thực]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Liên kết đặt lại mật khẩu đã được gửi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Liên kết đặt lại mật khẩu đã được gửi qua email.
 *       404:
 *         description: Email không tồn tại
 */
router.post('/forgot-password', /* forgotPasswordLimiter, */ authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu
 *     tags: [Xác thực]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: reset_token
 *               newPassword:
 *                 type: string
 *                 example: NewPassword123
 *             required:
 *               - token
 *               - newPassword
 *     responses:
 *       200:
 *         description: Mật khẩu đã được đặt lại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mật khẩu đã được đặt lại thành công.
 *       400:
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
router.post('/reset-password', authController.resetPassword);

router.post('/resend-verification', authController.resendVerificationEmail);

module.exports = router;
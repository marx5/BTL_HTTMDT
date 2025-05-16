const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, adminAuth } = require('../middleware/auth');

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [Người dùng]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 role:
 *                   type: string
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.get('/me', auth, userController.getMe);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách người dùng (Chỉ admin)
 *     tags: [Người dùng]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *       403:
 *         description: Yêu cầu quyền quản trị
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Yêu cầu quyền quản trị
 */
router.get('/', auth, adminAuth, userController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy chi tiết người dùng không bao gồm mật khẩu (Chỉ admin)
 *     tags: [Người dùng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID người dùng
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *       403:
 *         description: Yêu cầu quyền quản trị
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Yêu cầu quyền quản trị
 */
router.get('/:id', auth, adminAuth, userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Xóa người dùng (Chỉ admin)
 *     tags: [Người dùng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID người dùng
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Người dùng đã được xóa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Người dùng đã được xóa
 *       403:
 *         description: Yêu cầu quyền quản trị
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Yêu cầu quyền quản trị
 */
router.delete('/:id', auth, adminAuth, userController.deleteUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng (Chỉ admin)
 *     tags: [Người dùng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID người dùng
 *         schema:
 *           type: integer
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
 *                 description: Địa chỉ email mới
 *               role:
 *                 type: string
 *                 enum: [admin, customer]
 *                 description: Vai trò người dùng
 *     responses:
 *       200:
 *         description: Thông tin người dùng đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Thông tin người dùng đã được cập nhật
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       403:
 *         description: Yêu cầu quyền quản trị
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Yêu cầu quyền quản trị
 */

router.put('/me', auth, userController.updateMe);

router.put('/:id', auth, adminAuth, userController.updateUser);

/**
 * @swagger
 * /api/users/{id}/orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng của người dùng (Chỉ admin)
 *     tags: [Người dùng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID người dùng
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng của người dùng
 *       403:
 *         description: Yêu cầu quyền quản trị
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Yêu cầu quyền quản trị
 */
router.get('/:id/orders', auth, adminAuth, userController.getUserOrders);

module.exports = router;
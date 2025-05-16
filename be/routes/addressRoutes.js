const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Thêm địa chỉ mới
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Họ và tên
 *               phone:
 *                 type: string
 *                 description: Số điện thoại
 *               addressLine:
 *                 type: string
 *                 description: Địa chỉ chi tiết
 *               city:
 *                 type: string
 *                 description: Thành phố
 *               state:
 *                 type: string
 *                 description: Bang/Tỉnh
 *               country:
 *                 type: string
 *                 description: Quốc gia
 *               isDefault:
 *                 type: boolean
 *                 description: Đặt làm địa chỉ mặc định
 *             required:
 *               - fullName
 *               - phone
 *               - addressLine
 *               - city
 *               - state
 *               - country
 *     responses:
 *       201:
 *         description: Địa chỉ đã được thêm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Địa chỉ đã được thêm
 *                 address:
 *                   type: object
 *       401:
 *         description: Không được phép truy cập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Không được phép truy cập
 */
router.post('/', auth, addressController.addAddress);

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: Lấy danh sách địa chỉ của người dùng
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách địa chỉ
 */
router.get('/', auth, addressController.getAddresses);

/**
 * @swagger
 * /api/addresses/{id}:
 *   put:
 *     summary: Cập nhật địa chỉ
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID địa chỉ
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Họ và tên
 *               phone:
 *                 type: string
 *                 description: Số điện thoại
 *               addressLine:
 *                 type: string
 *                 description: Địa chỉ chi tiết
 *               city:
 *                 type: string
 *                 description: Thành phố
 *               state:
 *                 type: string
 *                 description: Bang/Tỉnh
 *               country:
 *                 type: string
 *                 description: Quốc gia
 *               isDefault:
 *                 type: boolean
 *                 description: Đặt làm địa chỉ mặc định
 *     responses:
 *       200:
 *         description: Địa chỉ đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Địa chỉ đã được cập nhật
 *                 address:
 *                   type: object
 *       401:
 *         description: Không được phép truy cập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Không được phép truy cập
 */
router.put('/:id', auth, addressController.updateAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 *   delete:
 *     summary: Xóa địa chỉ
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID địa chỉ
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Địa chỉ đã được xóa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Địa chỉ đã được xóa
 *       401:
 *         description: Không được phép truy cập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Không được phép truy cập
 */
router.delete('/:id', auth, addressController.deleteAddress);

/**
 * @swagger
 * /api/addresses/{id}/default:
 *   put:
 *     summary: Đặt địa chỉ làm mặc định
 *     tags: [Địa chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID địa chỉ
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Địa chỉ đã được đặt làm mặc định
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Địa chỉ đã được đặt làm mặc định
 *                 address:
 *                   type: object
 *       401:
 *         description: Không được phép truy cập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Không được phép truy cập
 */
router.put('/:id/default', auth, addressController.setDefaultAddress);

module.exports = router;
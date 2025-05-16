const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { auth, adminAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

/**
 * @swagger
 * tags:
 *   name: Banner
 *   description: Quản lý banner sản phẩm
 */

/**
 * @swagger
 * /api/banners/active:
 *   get:
 *     summary: Lấy danh sách banner đang hiển thị
 *     tags: [Banner]
 *     responses:
 *       200:
 *         description: Danh sách banner đang hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       imageUrl: { type: string }
 *                       isActive: { type: boolean }
 *                       productId: { type: integer }
 *                       Product:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           name: { type: string }
 */
router.get('/active', bannerController.getActiveBanners);

/**
 * @swagger
 * /api/banners:
 *   get:
 *     summary: Lấy tất cả banner (Chỉ admin)
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tất cả banner
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       imageUrl: { type: string }
 *                       isActive: { type: boolean }
 *                       productId: { type: integer }
 *                       Product:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           name: { type: string }
 *       401:
 *         description: Không được phép truy cập
 *       403:
 *         description: Yêu cầu quyền admin
 */
router.get('/', auth, adminAuth, bannerController.getAllBanners);

/**
 * @swagger
 * /api/banners:
 *   post:
 *     summary: Tạo banner mới (Chỉ admin)
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               productId:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *             required:
 *               - image
 *               - productId
 *     responses:
 *       201:
 *         description: Banner đã được tạo
 *       401:
 *         description: Không được phép truy cập
 *       403:
 *         description: Yêu cầu quyền admin
 */
router.post('/', auth, adminAuth, upload.single('image'), handleUploadError, bannerController.createBanner);

/**
 * @swagger
 * /api/banners/{id}:
 *   put:
 *     summary: Cập nhật banner (Chỉ admin)
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               productId:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Banner đã được cập nhật
 *       401:
 *         description: Không được phép truy cập
 *       403:
 *         description: Yêu cầu quyền admin
 */
router.put('/:id', auth, adminAuth, upload.single('image'), handleUploadError, bannerController.updateBanner);

/**
 * @swagger
 * /api/banners/{id}:
 *   delete:
 *     summary: Xóa banner (Chỉ admin)
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Banner đã được xóa
 *       401:
 *         description: Không được phép truy cập
 *       403:
 *         description: Yêu cầu quyền admin
 */
router.delete('/:id', auth, adminAuth, bannerController.deleteBanner);

module.exports = router;

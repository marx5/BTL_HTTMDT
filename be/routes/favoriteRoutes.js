const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: Thêm sản phẩm vào danh sách yêu thích
 *     tags: [Yêu thích]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: ID sản phẩm
 *             required:
 *               - productId
 *     responses:
 *       201:
 *         description: Sản phẩm đã được thêm vào yêu thích
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sản phẩm đã được thêm vào yêu thích
 *                 favorite:
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
router.post('/', auth, favoriteController.addFavorite);

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Lấy danh sách sản phẩm yêu thích của người dùng
 *     tags: [Yêu thích]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm yêu thích
 */
router.get('/', auth, favoriteController.getFavorites);

/**
 * @swagger
 * /api/favorites/{productId}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi danh sách yêu thích
 *     tags: [Yêu thích]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         description: ID sản phẩm
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sản phẩm đã được xóa khỏi yêu thích
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sản phẩm đã được xóa khỏi yêu thích
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
router.delete('/:productId', auth, favoriteController.removeFavorite);

module.exports = router;
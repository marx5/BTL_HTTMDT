const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   post:
 *     summary: Thêm đánh giá cho sản phẩm
 *     tags: [Đánh giá]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID sản phẩm
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Điểm đánh giá (1-5)
 *               comment:
 *                 type: string
 *                 description: Bình luận
 *             required:
 *               - rating
 *     responses:
 *       201:
 *         description: Đánh giá đã được thêm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đánh giá đã được thêm
 *                 review:
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
router.post('/:id/reviews', auth, reviewController.addReview);

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   get:
 *     summary: Lấy danh sách đánh giá của sản phẩm
 *     tags: [Đánh giá]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID sản phẩm
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách đánh giá
 */
router.get('/:id/reviews', reviewController.getReviews);

module.exports = router;
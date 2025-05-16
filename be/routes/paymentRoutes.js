const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');


/**
 * @swagger
 * /api/payments/{orderId}:
 *   get:
 *     summary: Lấy trạng thái thanh toán của đơn hàng
 *     tags: [Thanh toán]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         description: ID đơn hàng
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết thanh toán
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
router.get('/:orderId', auth, paymentController.getPayment);

// Thanh toán COD
router.post('/cod', auth, paymentController.createCodPayment);


module.exports = router;
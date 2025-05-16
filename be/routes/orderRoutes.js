const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, adminAuth } = require('../middleware/auth');

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Tạo đơn hàng từ giỏ hàng với địa chỉ
 *     tags: [Đơn hàng]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addressId:
 *                 type: integer
 *                 example: 1
 *                 description: ID địa chỉ giao hàng
 *               paymentMethod:
 *                 type: string
 *                 enum: [paypal, cod]
 *                 example: cod
 *                 description: Phương thức thanh toán (PayPal hoặc COD)
 *             required:
 *               - addressId
 *     responses:
 *       201:
 *         description: Đơn hàng đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đơn hàng đã được tạo thành công.
 *                 order:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     total:
 *                       type: number
 *                     shippingFee:
 *                       type: number
 *                     paymentMethod:
 *                       type: string
 *                     status:
 *                       type: string
 *                     address:
 *                       type: object
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Giỏ hàng trống hoặc địa chỉ không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: cart_empty | invalid_address
 *       401:
 *         description: Không được phép truy cập
 */
router.post('/', auth, orderController.createOrder);

/**
 * @swagger
 * /api/orders/buy-now:
 *   post:
 *     summary: Thanh toán ngay sản phẩm đang xem
 *     tags: [Đơn hàng]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ProductVariantId:
 *                 type: integer
 *                 example: 1
 *                 description: ID biến thể sản phẩm (size, màu)
 *               quantity:
 *                 type: integer
 *                 example: 1
 *                 description: Số lượng sản phẩm
 *               addressId:
 *                 type: integer
 *                 example: 1
 *                 description: ID địa chỉ giao hàng
 *               paymentMethod:
 *                 type: string
 *                 enum: [paypal, cod]
 *                 example: cod
 *                 description: Phương thức thanh toán (PayPal hoặc COD)
 *             required:
 *               - ProductVariantId
 *               - quantity
 *               - addressId
 *     responses:
 *       201:
 *         description: Đơn hàng đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đơn hàng đã được tạo thành công.
 *                 order:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     total:
 *                       type: number
 *                     shippingFee:
 *                       type: number
 *                     paymentMethod:
 *                       type: string
 *                     status:
 *                       type: string
 *                     address:
 *                       type: object
 *                       properties:
 *                         fullName:
 *                           type: string
 *                         addressLine:
 *                           type: string
 *                         city:
 *                           type: string
 *                         state:
 *                           type: string
 *                         country:
 *                           type: string
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           quantity:
 *                             type: integer
 *                           price:
 *                             type: number
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc tồn kho không đủ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: variant_not_found | Số lượng vượt quá tồn kho | invalid_address
 *       401:
 *         description: Không được phép truy cập
 */
router.post('/buy-now', auth, orderController.buyNow);

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng của người dùng
 *     tags: [Đơn hàng]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng của người dùng
 *       401:
 *         description: Không được phép truy cập
 */
router.get('/my-orders', auth, orderController.getUserOrders);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Lấy tất cả đơn hàng (Chỉ admin)
 *     tags: [Đơn hàng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Số trang
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Số mục trên mỗi trang
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: status
 *         in: query
 *         description: Lọc theo trạng thái đơn hàng
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *       - name: dateFrom
 *         in: query
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: dateTo
 *         in: query
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: userId
 *         in: query
 *         description: Lọc theo ID người dùng
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách tất cả đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       total:
 *                         type: number
 *                       shippingFee:
 *                         type: number
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       User:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           email:
 *                             type: string
 *                           name:
 *                             type: string
 *                       Address:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           fullName:
 *                             type: string
 *                           addressLine:
 *                             type: string
 *                           city:
 *                             type: string
 *                           state:
 *                             type: string
 *                           country:
 *                             type: string
 *                       Payment:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             productId:
 *                               type: integer
 *                             name:
 *                               type: string
 *                             quantity:
 *                               type: integer
 *                             price:
 *                               type: number
 *                             image:
 *                               type: string
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalOrders:
 *                   type: integer
 *       403:
 *         description: Yêu cầu quyền quản trị
 */
router.get('/', auth, adminAuth, orderController.getAllOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Cập nhật trạng thái đơn hàng (Chỉ admin)
 *     tags: [Đơn hàng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID đơn hàng
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled]
 *                 description: Trạng thái đơn hàng
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Trạng thái đơn hàng đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Trạng thái đơn hàng đã được cập nhật thành công.
 *                 order:
 *                   type: object
 *       403:
 *         description: Yêu cầu quyền quản trị
 */
router.put('/:id', auth, adminAuth, orderController.updateOrderStatus);

/**
 * @swagger
 * /api/orders/my-orders/history:
 *   get:
 *     summary: Lấy lịch sử đơn hàng chi tiết
 *     tags: [Đơn hàng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Số trang
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Số mục trên mỗi trang
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lịch sử đơn hàng
 */
router.get('/my-orders/history', auth, orderController.getOrderHistory);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Hủy đơn hàng đang chờ xử lý
 *     tags: [Đơn hàng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID đơn hàng
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Đơn hàng đã được hủy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đơn hàng đã được hủy thành công.
 *                 order:
 *                   type: object
 *       400:
 *         description: Đơn hàng không thể hủy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: order_cannot_be_cancelled
 *       401:
 *         description: Không được phép truy cập
 */
router.put('/:id/cancel', auth, orderController.cancelOrder);

/**
 * @swagger
 * /api/orders/user/{userId}:
 *   get:
 *     summary: Lấy danh sách đơn hàng của một user cụ thể (Chỉ admin)
 *     tags: [Đơn hàng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng đơn hàng trên mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng của user
 *       401:
 *         description: Không được phép truy cập
 *       403:
 *         description: Không có quyền admin
 */
router.get('/user/:userId', auth, adminAuth, orderController.getUserOrdersAdmin);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng
 *     tags: [Đơn hàng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID đơn hàng
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 total:
 *                   type: number
 *                 shippingFee:
 *                   type: number
 *                 status:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 User:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                 Address:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     fullName:
 *                       type: string
 *                     addressLine:
 *                       type: string
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                     country:
 *                       type: string
 *                 Payment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       quantity:
 *                         type: integer
 *                       price:
 *                         type: number
 *                       image:
 *                         type: string
 *       404:
 *         description: Đơn hàng không tồn tại
 *       401:
 *         description: Không được phép truy cập
 */
router.get('/:id', auth, orderController.getOrderById);

module.exports = router;
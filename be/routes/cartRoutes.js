const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { auth, adminAuth } = require('../middleware/auth');

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Lấy giỏ hàng của người dùng
 *     tags: [Giỏ hàng]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Giỏ hàng của người dùng
 *       401:
 *         description: Không được phép truy cập
 */
router.get('/', auth, cartController.getCart);

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Giỏ hàng]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               variantId:
 *                 type: integer
 *                 description: ID biến thể sản phẩm
 *               quantity:
 *                 type: integer
 *                 description: Số lượng
 *             required:
 *               - variantId
 *     responses:
 *       200:
 *         description: Thêm sản phẩm thành công
 *       401:
 *         description: Không được phép truy cập
 */
router.post('/', auth, cartController.addToCart);

/**
 * @swagger
 * /api/cart/{id}:
 *   put:
 *     summary: Cập nhật số lượng sản phẩm trong giỏ hàng
 *     tags: [Giỏ hàng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID sản phẩm trong giỏ hàng
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: Số lượng mới
 *             required:
 *               - quantity
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Không được phép truy cập
 */
router.put('/:id', auth, cartController.updateCartItem);

/**
 * @swagger
 * /api/cart/{id}/selected:
 *   put:
 *     summary: Cập nhật trạng thái chọn sản phẩm
 *     tags: [Giỏ hàng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID sản phẩm trong giỏ hàng
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Không được phép truy cập
 */
router.put('/:id/selected', auth, cartController.updateCartItemSelected);

/**
 * @swagger
 * /api/cart/{id}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     tags: [Giỏ hàng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID sản phẩm trong giỏ hàng
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Không được phép truy cập
 */
router.delete('/:id', auth, cartController.deleteCartItem);

/**
 * @swagger
 * /api/cart/admin/{userId}:
 *   get:
 *     summary: Lấy giỏ hàng của người dùng (Chỉ admin)
 *     tags: [Giỏ hàng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: Thông tin giỏ hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 UserId:
 *                   type: integer
 *                 CartItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       quantity:
 *                         type: integer
 *                       ProductVariant:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           size:
 *                             type: string
 *                           color:
 *                             type: string
 *                           Product:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                               price:
 *                                 type: number
 *                               ProductImages:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     id:
 *                                       type: integer
 *                                     url:
 *                                       type: string
 */
router.get('/admin/:userId', auth, adminAuth, cartController.getUserCart);

module.exports = router;
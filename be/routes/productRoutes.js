const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth, adminAuth } = require('../middleware/auth');

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     tags: [Sản phẩm]
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
 *       - name: categoryId
 *         in: query
 *         description: ID danh mục
 *         schema:
 *           type: integer
 *       - name: search
 *         in: query
 *         description: Từ khóa tìm kiếm
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalPages:
 *                   type: integer
 */
router.get('/', productController.getAllProducts);


/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Tìm kiếm sản phẩm nâng cao
 *     tags: [Sản phẩm]
 *     parameters:
 *       - name: q
 *         in: query
 *         description: Tìm kiếm theo tên
 *         schema:
 *           type: string
 *       - name: categoryId
 *         in: query
 *         description: Lọc theo danh mục
 *         schema:
 *           type: integer
 *       - name: size
 *         in: query
 *         description: Lọc theo kích cỡ
 *         schema:
 *           type: string
 *       - name: color
 *         in: query
 *         description: Lọc theo màu sắc
 *         schema:
 *           type: string
 *       - name: minPrice
 *         in: query
 *         description: Giá tối thiểu
 *         schema:
 *           type: number
 *       - name: maxPrice
 *         in: query
 *         description: Giá tối đa
 *         schema:
 *           type: number
 *       - name: inStock
 *         in: query
 *         description: Lọc theo tình trạng còn hàng
 *         schema:
 *           type: boolean
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
 *         description: Danh sách sản phẩm
 */
router.get('/search', productController.searchProducts);


/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Tạo sản phẩm mới với tải hình ảnh (Chỉ admin)
 *     tags: [Sản phẩm]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên sản phẩm
 *               description:
 *                 type: string
 *                 description: Mô tả sản phẩm
 *               price:
 *                 type: number
 *                 description: Giá sản phẩm
 *               categoryId:
 *                 type: integer
 *                 description: ID danh mục
 *               variants:
 *                 type: string
 *                 description: Chuỗi JSON của biến thể (e.g., [{"size":"M","color":"Red","stock":50}])
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Hình ảnh sản phẩm
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *     responses:
 *       201:
 *         description: Sản phẩm đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sản phẩm đã được tạo
 *                 product:
 *                   type: object
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
router.post('/', auth, adminAuth, productController.uploadImages, productController.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Cập nhật sản phẩm với tải hình ảnh (Chỉ admin)
 *     tags: [Sản phẩm]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên sản phẩm
 *               description:
 *                 type: string
 *                 description: Mô tả sản phẩm
 *               price:
 *                 type: number
 *                 description: Giá sản phẩm
 *               categoryId:
 *                 type: integer
 *                 description: ID danh mục
 *               variants:
 *                 type: string
 *                 description: Chuỗi JSON của biến thể (e.g., [{"size":"M","color":"Red","stock":50}])
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Hình ảnh sản phẩm
 *     responses:
 *       200:
 *         description: Sản phẩm đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sản phẩm đã được cập nhật
 *                 product:
 *                   type: object
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
router.put('/:id', auth, adminAuth, productController.uploadImages, productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Xóa sản phẩm (Chỉ admin)
 *     tags: [Sản phẩm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID sản phẩm
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sản phẩm đã được xóa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sản phẩm đã được xóa
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
router.delete('/:id', auth, adminAuth, productController.deleteProduct);


/**
 * @swagger
 * /api/products/{id}/images/{imageId}:
 *   delete:
 *     summary: Xóa hình ảnh sản phẩm cụ thể (Chỉ admin)
 *     tags: [Sản phẩm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID sản phẩm
 *         schema:
 *           type: integer
 *       - name: imageId
 *         in: path
 *         required: true
 *         description: ID hình ảnh
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hình ảnh đã được xóa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hình ảnh đã được xóa
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
 *       404:
 *         description: Hình ảnh hoặc sản phẩm không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hình ảnh không tồn tại
 */
router.delete('/:id/images/:imageId', auth, adminAuth, productController.deleteProductImage);

/**
 * @swagger
 * /api/products/inventory:
 *   get:
 *     summary: Lấy báo cáo tồn kho (Chỉ admin)
 *     tags: [Sản phẩm]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Báo cáo tồn kho
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Báo cáo tồn kho thành công
 *                 inventory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       variants:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             variantId:
 *                               type: integer
 *                             size:
 *                               type: string
 *                             color:
 *                               type: string
 *                             stock:
 *                               type: integer
 *                       totalStock:
 *                         type: integer
 */
router.get('/inventory', auth, adminAuth, productController.getInventoryReport);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm theo ID
 *     tags: [Sản phẩm]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID sản phẩm
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết sản phẩm
 *       404:
 *         description: Sản phẩm không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sản phẩm không tồn tại
 */
router.get('/:id', productController.getProductById);

// Route xử lý biến thể sản phẩm
router.post('/:productId/variants', auth, adminAuth, productController.addProductVariants);
router.put('/:productId/variants/:variantId', auth, adminAuth, productController.updateProductVariant);
router.delete('/:productId/variants/:variantId', auth, adminAuth, productController.deleteProductVariant);

/**
 * @swagger
 * /api/products/category/{categoryId}:
 *   get:
 *     summary: Lấy sản phẩm theo danh mục (bao gồm cả danh mục con)
 *     tags: [Sản phẩm]
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         description: ID danh mục
 *         schema:
 *           type: integer
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
 *         description: Danh sách sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalPages:
 *                   type: integer
 */
router.get('/category/:categoryId', productController.getProductsByCategory);

module.exports = router;
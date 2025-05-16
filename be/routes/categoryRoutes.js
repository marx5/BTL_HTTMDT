const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { auth, adminAuth } = require('../middleware/auth');

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lấy danh sách danh mục
 *     tags: [Danh mục]
 *     responses:
 *       200:
 *         description: Danh sách danh mục với quan hệ cha-con
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   parentId:
 *                     type: integer
 *                     nullable: true
 *                   Parent:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                   Children:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         parentId:
 *                           type: integer
 *       500:
 *         description: Lỗi server
 */
router.get('/', categoryController.getAllCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Tạo danh mục mới (Chỉ admin)
 *     tags: [Danh mục]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên danh mục
 *               parentId:
 *                 type: integer
 *                 description: ID danh mục cha (có thể null)
 *                 nullable: true
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Danh mục đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Danh mục đã được tạo
 *                 category:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     parentId:
 *                       type: integer
 *                       nullable: true
 *       403:
 *         description: Yêu cầu quyền quản trị
 *       400:
 *         description: Thiếu tên danh mục
 */
router.post('/', auth, adminAuth, categoryController.createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục (Chỉ admin)
 *     tags: [Danh mục]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID danh mục
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên danh mục
 *               parentId:
 *                 type: integer
 *                 description: ID danh mục cha (có thể null)
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Danh mục đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Danh mục đã được cập nhật
 *                 category:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     parentId:
 *                       type: integer
 *                       nullable: true
 *       403:
 *         description: Yêu cầu quyền quản trị
 *       404:
 *         description: Danh mục không tồn tại
 */
router.put('/:id', auth, adminAuth, categoryController.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Xóa danh mục (Chỉ admin)
 *     tags: [Danh mục]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID danh mục
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh mục đã được xóa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Danh mục đã được xóa
 *       403:
 *         description: Yêu cầu quyền quản trị
 *       404:
 *         description: Danh mục không tồn tại
 */
router.delete('/:id', auth, adminAuth, categoryController.deleteCategory);

module.exports = router;
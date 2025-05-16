const { Op } = require('sequelize');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const ProductImage = require('../models/ProductImage');
const Category = require('../models/Category');
const multer = require('multer');
const path = require('path');
const AppError = require('../utils/appError');
const Joi = require('joi');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('only_images_allowed'));
  },
}).array('images', 5);

exports.uploadImages = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
};

const getAllProductsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  categoryId: Joi.number().integer().optional(),
  search: Joi.string().optional(),
});
exports.getAllProducts = async (req, res, next) => {
  try {
    const { error, value } = getAllProductsSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { page, limit, categoryId, search } = value;
    const offset = (page - 1) * limit;

    const where = { isActive: true };
    if (categoryId) {
      where.CategoryId = categoryId;
    }
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const products = await Product.findAndCountAll({
      where,
      include: [
        { model: ProductImage, as: 'ProductImages' },
        { model: ProductVariant, as: 'ProductVariants' },
        { model: Category, as: 'Category' },
      ],
      limit,
      offset,
    });

    res.json({
      products: products.rows,
      totalPages: Math.ceil(products.count / limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: ProductVariant, as: 'ProductVariants', required: false },
        { model: ProductImage, as: 'ProductImages', required: false },
        { model: Category, as: 'Category', required: false },
      ],
    });
    if (!product) {
      throw new Error('product_not_found');
    }
    res.json(product);
  } catch (err) {
    console.error('Error in getProductById:', err);
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, categoryId, variants, mainImageId } = req.body;
    const product = await Product.create({ name, description, price, CategoryId: categoryId });

    if (variants) {
      const parsedVariants = JSON.parse(variants);
      for (const variant of parsedVariants) {
        await ProductVariant.create({
          ProductId: product.id,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
        });
      }
    }

    // Đầu tiên tạo tất cả ảnh với isMain = false
    if (req.files) {
      for (const file of req.files) {
        await ProductImage.create({
          ProductId: product.id,
          url: `/uploads/${file.filename}`,
          isMain: false,
        });
      }
    }

    // Sau đó cập nhật ảnh chính nếu có
    if (mainImageId) {
      await ProductImage.update(
        { isMain: true },
        { where: { id: mainImageId, ProductId: product.id } }
      );
    } else if (req.files && req.files.length > 0) {
      // Nếu không chọn ảnh chính, lấy ảnh đầu tiên làm ảnh chính
      const firstImage = await ProductImage.findOne({
        where: { ProductId: product.id },
        order: [['id', 'ASC']]
      });
      if (firstImage) {
        await firstImage.update({ isMain: true });
      }
    }

    res.status(201).json({
      message: 'Sản phẩm đã được tạo thành công.',
      product,
    });
  } catch (err) {
    console.error('Error in createProduct:', err);
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, mainImageId } = req.body;
    const files = req.files;

    const product = await Product.findByPk(id, {
      include: [
        { model: ProductImage, as: 'ProductImages' },
        { model: ProductVariant, as: 'ProductVariants' },
      ],
    });

    if (!product) {
      throw new AppError('product_not_found', 404);
    }

    // Cập nhật thông tin cơ bản
    await product.update({
      name,
      description,
      price,
      CategoryId: categoryId,
    });

    // Xử lý ảnh
    if (files && files.length > 0) {
      // Thêm ảnh mới
      const newImages = files.map((file) => ({
        url: file.filename,
        isMain: false, // Mặc định ảnh mới không phải ảnh chính
        ProductId: product.id,
      }));

      await ProductImage.bulkCreate(newImages);
    }

    // Cập nhật ảnh chính nếu có thay đổi
    if (mainImageId !== undefined) {
      await ProductImage.update(
        { isMain: false },
        { where: { ProductId: product.id } }
      );
      await ProductImage.update(
        { isMain: true },
        { where: { ProductId: product.id, id: mainImageId } }
      );
    }

    // Lấy lại sản phẩm với thông tin đầy đủ
    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: ProductImage, as: 'ProductImages' },
        { model: ProductVariant, as: 'ProductVariants' },
        { model: Category, as: 'Category' },
      ],
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error in updateProduct:', err);
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      throw new Error('product_not_found');
    }
    await product.destroy();
    res.json({ message: 'Sản phẩm đã được xóa thành công.' });
  } catch (err) {
    console.error('Error in deleteProduct:', err);
    next(err);
  }
};

exports.deleteProductImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error('product_not_found');
    }
    const image = await ProductImage.findByPk(imageId);
    if (!image || image.ProductId !== product.id) {
      throw new Error('image_not_found');
    }
    await image.destroy();
    res.json({ message: 'Hình ảnh sản phẩm đã được xóa thành công.' });
  } catch (err) {
    console.error('Error in deleteProductImage:', err);
    next(err);
  }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // console.log('Search parameters by name or description:', { q, pageNum, limitNum });

    const where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }

    const products = await Product.findAndCountAll({
      where,
      include: [
        { model: ProductVariant, as: 'ProductVariants', required: false },
        { model: ProductImage, as: 'ProductImages', required: false },
        { model: Category, as: 'Category', required: false },
      ],
      limit: limitNum,
      offset,
    });

    res.json({
      products: products.rows,
      totalPages: Math.ceil(products.count / limitNum),
    });
  } catch (err) {
    console.error('Error in searchProductsByName:', err);
    next(err);
  }
};

exports.filterProducts = async (req, res, next) => {
  try {
    const { categoryId, size, color, minPrice, maxPrice, inStock, page = 1, limit = 10 } = req.query;
    // console.log('Filter parameters:', { categoryId, size, color, minPrice, maxPrice, inStock, page, limit });
    
    // Xây dựng điều kiện bộ lọc
    const where = {};
    const variantWhere = {};
    
    if (categoryId) where.CategoryId = categoryId;
    if (minPrice) where.price = { [Op.gte]: minPrice };
    if (maxPrice) where.price = { ...where.price, [Op.lte]: maxPrice };
    if (size) variantWhere.size = size;
    if (color) variantWhere.color = color;
    if (inStock) variantWhere.stock = { [Op.gt]: 0 };

    // console.log('Where conditions:', where);
    // console.log('Variant where conditions:', variantWhere);

    const products = await Product.findAndCountAll({
      where,
      include: [
        { model: ProductVariant, as: 'ProductVariants', where: variantWhere, required: false },
        { model: ProductImage, as: 'ProductImages', required: false },
        { model: Category, as: 'Category', required: false },
      ],
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
      products: products.rows,
      totalPages: Math.ceil(products.count / limit),
    });
  } catch (err) {
    console.error('Error in filterProducts:', err);
    next(err);
  }
};

exports.getInventoryReport = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: ProductVariant,
          as: 'ProductVariants',
          attributes: ['id', 'size', 'color', 'stock'],
          required: false,
        },
      ],
    });
    const inventory = products.map((product) => ({
      id: product.id,
      name: product.name,
      variants: product.ProductVariants.map((variant) => ({
        variantId: variant.id,
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
      })),
      totalStock: product.ProductVariants.reduce((sum, variant) => sum + variant.stock, 0),
    }));
    res.json({
      message: 'Sản phẩm đã được tạo thành công.',
      inventory,
    });
  } catch (err) {
    console.error('Error in getInventoryReport:', err);
    next(err);
  }
};

exports.addProductVariants = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const variants = req.body;

    // Validate input
    if (!Array.isArray(variants)) {
      throw new AppError('variants_must_be_array', 400);
    }

    // Validate each variant
    for (const variant of variants) {
      if (!variant.size || !variant.color || typeof variant.stock !== 'number') {
        throw new AppError('invalid_variant_data', 400);
      }
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      throw new AppError('product_not_found', 404);
    }

    // Check for existing variants
    const existingVariants = await ProductVariant.findAll({
      where: {
        ProductId: productId,
        [Op.or]: variants.map(v => ({
          size: v.size,
          color: v.color
        }))
      }
    });

    if (existingVariants.length > 0) {
      throw new AppError('variants_already_exist', 400);
    }

    const newVariants = variants.map(variant => ({
      ProductId: productId,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
    }));

    await ProductVariant.bulkCreate(newVariants);

    const updatedProduct = await Product.findByPk(productId, {
      include: [
        { model: ProductVariant, as: 'ProductVariants' },
        { model: ProductImage, as: 'ProductImages' },
        { model: Category, as: 'Category' },
      ],
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error in addProductVariants:', err);
    next(err);
  }
};

exports.updateProductVariant = async (req, res, next) => {
  try {
    const { productId, variantId } = req.params;
    const { stock } = req.body;

    const variant = await ProductVariant.findOne({
      where: {
        id: variantId,
        ProductId: productId,
      },
    });

    if (!variant) {
      throw new AppError('variant_not_found', 404);
    }

    await variant.update({ stock });

    const updatedProduct = await Product.findByPk(productId, {
      include: [
        { model: ProductVariant, as: 'ProductVariants' },
      ],
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error in updateProductVariant:', err);
    next(err);
  }
};

exports.deleteProductVariant = async (req, res, next) => {
  try {
    const { productId, variantId } = req.params;

    const variant = await ProductVariant.findOne({
      where: {
        id: variantId,
        ProductId: productId,
      },
    });

    if (!variant) {
      throw new AppError('variant_not_found', 404);
    }

    await variant.destroy();

    const updatedProduct = await Product.findByPk(productId, {
      include: [
        { model: ProductVariant, as: 'ProductVariants' },
      ],
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error in deleteProductVariant:', err);
    next(err);
  }
};

exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Lấy danh mục cha và tất cả danh mục con
    const category = await Category.findByPk(categoryId, {
      include: [{
        model: Category,
        as: 'Children',
        attributes: ['id'],
      }],
    });

    if (!category) {
      throw new AppError('category_not_found', 404);
    }

    // Tạo mảng chứa tất cả ID danh mục cần tìm
    const categoryIds = [
      category.id,
      ...category.Children.map(child => child.id)
    ];

    const products = await Product.findAndCountAll({
      where: {
        CategoryId: categoryIds,
        isActive: true
      },
      include: [
        { model: ProductImage, as: 'ProductImages' },
        { model: ProductVariant, as: 'ProductVariants' },
        { model: Category, as: 'Category' },
      ],
      limit,
      offset,
    });

    res.json({
      products: products.rows,
      totalPages: Math.ceil(products.count / limit),
    });
  } catch (err) {
    next(err);
  }
};
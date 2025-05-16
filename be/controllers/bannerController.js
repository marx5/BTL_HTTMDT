const Banner = require('../models/Banner');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');
const AppError = require('../utils/appError');
const Joi = require('joi');
const { sequelize } = require('../config/database');
const multer = require('multer');

// Validation Schema
const bannerSchema = Joi.object({
  isActive: Joi.boolean().default(true),
  productId: Joi.number().integer().required()
});

// File Upload Configuration
const storage = multer.diskStorage({
  destination: './uploads/banners/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new AppError('invalid_file_type', 400));
  }
}).single('image');

// Helper function to convert form-data string to boolean
const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
};

// Helper function to delete file
const deleteFile = (filePath) => {
  if (filePath) {
    const fullPath = path.resolve(filePath);
    fs.unlink(fullPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error("Error deleting file:", err);
      }
    });
  }
};

exports.getActiveBanners = async (req, res, next) => {
  try {
    const banners = await Banner.findAll({
      where: { isActive: true },
      include: [{
        model: Product,
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      message: 'Lấy danh sách banner đang hoạt động thành công',
      data: banners
    });
  } catch (error) {
    next(new AppError('banner_fetch_error', 500));
  }
};

exports.getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.findAll({
      include: [{
        model: Product,
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      message: 'Lấy danh sách tất cả banner thành công',
      data: banners
    });
  } catch (error) {
    next(new AppError('banner_fetch_error', 500));
  }
};

exports.createBanner = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    // Kiểm tra file trước
    if (!req.file) {
      throw new AppError('image_required', 400);
    }

    // Parse form data
    const formData = {
      isActive: parseBoolean(req.body.isActive),
      productId: parseInt(req.body.productId)
    };

    // Validate request body
    const { error, value } = bannerSchema.validate(formData);
    if (error) {
      deleteFile(req.file.path);
      throw new AppError(error.details[0].message, 400);
    }

    // Kiểm tra product
    const product = await Product.findByPk(value.productId, { transaction });
    if (!product) {
      deleteFile(req.file.path);
      throw new AppError('product_not_found', 404);
    }

    // Tạo banner
    const banner = await Banner.create({
      ...value,
      imageUrl: req.file.path
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      message: 'Tạo banner thành công',
      data: banner
    });
  } catch (error) {
    await transaction.rollback();
    if (req.file?.path) {
      deleteFile(req.file.path);
    }
    next(error);
  }
};

exports.updateBanner = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id, { transaction });
    if (!banner) {
      throw new AppError('banner_not_found', 404);
    }

    // Parse form data
    const formData = {
      isActive: parseBoolean(req.body.isActive),
      productId: req.body.productId ? parseInt(req.body.productId) : banner.productId
    };

    // Validate request body
    const { error, value } = bannerSchema.validate(formData);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Kiểm tra product nếu có thay đổi
    if (value.productId !== banner.productId) {
      const product = await Product.findByPk(value.productId, { transaction });
      if (!product) {
        if (req.file?.path) {
          deleteFile(req.file.path);
        }
        throw new AppError('product_not_found', 404);
      }
    }

    // Cập nhật banner
    const oldImagePath = banner.imageUrl;
    const updateData = {
      ...value,
      imageUrl: req.file ? req.file.path : banner.imageUrl
    };

    await banner.update(updateData, { transaction });

    // Xóa ảnh cũ nếu có ảnh mới
    if (req.file && oldImagePath) {
      deleteFile(oldImagePath);
    }

    await transaction.commit();

    res.json({
      message: 'Cập nhật banner thành công',
      data: banner
    });
  } catch (error) {
    await transaction.rollback();
    if (req.file?.path) {
      deleteFile(req.file.path);
    }
    next(error);
  }
};

exports.deleteBanner = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const banner = await Banner.findByPk(id, { transaction });
    if (!banner) {
      throw new AppError('banner_not_found', 404);
    }

    const imagePath = banner.imageUrl;
    await banner.destroy({ transaction });
    await transaction.commit();

    deleteFile(imagePath);

    res.json({
      message: 'Xóa banner thành công'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

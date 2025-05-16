const Category = require('../models/Category');
const AppError = require('../utils/appError');
const { sequelize } = require('../config/database');
const Joi = require('joi');

const categorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  parentId: Joi.number().integer().allow(null),
});

const getCategoriesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

async function checkCategoryLoop(categoryId, parentId, transaction) {
  if (categoryId === parentId) {
    throw new AppError('category_loop_detected', 400);
  }

  let currentId = parentId;
  while (currentId) {
    const category = await Category.findByPk(currentId, { transaction });
    if (!category) {
      throw new AppError('parent_category_not_found', 404);
    }
    if (category.id === categoryId) {
      throw new AppError('category_loop_detected', 400);
    }
    currentId = category.parentId;
  }
}

exports.getAllCategories = async (req, res, next) => {
  try {
    const { error, value } = getCategoriesSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { page, limit } = value;
    const offset = (page - 1) * limit;

    const { count, rows } = await Category.findAndCountAll({
      attributes: ['id', 'name', 'parentId','createdAt'],
      include: [
        {
          model: Category,
          as: 'Parent',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: Category,
          as: 'Children',
          attributes: ['id', 'name', 'parentId'],
          required: false,
        },
      ],
      limit,
      offset,
    });

    res.json({
      categories: rows,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { error, value } = categorySchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { name, parentId } = value;

    if (parentId) {
      const parentCategory = await Category.findByPk(parentId, { transaction });
      if (!parentCategory) {
        throw new AppError('parent_category_not_found', 404);
      }
    }

    const category = await Category.create(
      { name, parentId: parentId || null },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      message: 'Danh mục đã được tạo thành công.',
      category,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { error, value } = categorySchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { name, parentId } = value;

    const category = await Category.findByPk(id, { transaction });
    if (!category) {
      throw new AppError('category_not_found', 404);
    }

    if (parentId) {
      await checkCategoryLoop(id, parentId, transaction);
    }

    category.name = name || category.name;
    category.parentId = parentId !== undefined ? parentId : category.parentId;
    await category.save({ transaction });

    await transaction.commit();

    res.json({
      message: 'Danh mục đã được cập nhật thành công.',
      category,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id, { transaction });
    if (!category) {
      throw new AppError('category_not_found', 404);
    }
    await category.destroy({ transaction });
    await transaction.commit();
    res.json({ message: 'Danh mục đã được xóa thành công.' });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
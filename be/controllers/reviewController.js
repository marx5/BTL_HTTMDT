const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ProductVariant = require('../models/ProductVariant');
const AppError = require('../utils/appError');
const { sequelize } = require('../config/database');
const Joi = require('joi');

const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(500).allow(null),
});

exports.addReview = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { error, value } = reviewSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { rating, comment } = value;

    const product = await Product.findByPk(id, { transaction });
    if (!product) {
      throw new AppError('product_not_found', 404);
    }

    const order = await Order.findOne({
      where: { UserId: req.user.id, status: 'completed' },
      include: [
        {
          model: ProductVariant,
          as: 'ProductVariants',
          where: { ProductId: id },
        },
      ],
      transaction,
    });
    if (!order) {
      throw new AppError('purchase_required_for_review', 400);
    }

    const existingReview = await Review.findOne({
      where: { UserId: req.user.id, ProductId: id },
      transaction,
    });
    if (existingReview) {
      throw new AppError('review_already_exists', 400);
    }

    const review = await Review.create(
      {
        UserId: req.user.id,
        ProductId: id,
        rating,
        comment,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      message: 'Đánh giá đã được thêm thành công.',
      review,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reviews = await Review.findAll({
      where: { ProductId: id },
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};
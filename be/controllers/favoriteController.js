const { Favorite, Product, ProductImage } = require('../models');
const AppError = require('../utils/appError');
const Joi = require('joi');

const addFavoriteSchema = Joi.object({
  productId: Joi.number().integer().required(),
});

exports.addFavorite = async (req, res, next) => {
  try {
    const { error, value } = addFavoriteSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const userId = req.user.id;
    const { productId } = value;

    const product = await Product.findOne({
      where: { 
        id: productId,
        isActive: true 
      },
      include: [{ 
        model: ProductImage, 
        as: 'ProductImages',
        attributes: ['id', 'url', 'isMain']
      }],
    });

    if (!product) {
      throw new AppError('Sản phẩm không tồn tại hoặc đã bị vô hiệu hóa', 404);
    }

    const existingFavorite = await Favorite.findOne({
      where: { 
        UserId: userId, 
        ProductId: productId 
      }
    });

    if (existingFavorite) {
      throw new AppError('Sản phẩm đã có trong danh sách yêu thích', 400);
    }

    const favorite = await Favorite.create({ 
      UserId: userId, 
      ProductId: productId 
    });

    res.status(201).json({
      message: 'Sản phẩm đã được thêm vào danh sách yêu thích thành công.',
      favorite: {
        id: favorite.id,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.ProductImages?.find(img => img.isMain)?.url || '/assets/images/no-image.png'
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.findAll({
      where: { UserId: req.user.id },
      include: [
        {
          model: Product,
          as: 'Product',
          where: { isActive: true },
          include: [
            {
              model: ProductImage,
              as: 'ProductImages',
              attributes: ['id', 'url', 'isMain'],
            },
          ],
        },
      ],
    });

    res.json(
      favorites.map((f) => ({
        id: f.id,
        product: {
          id: f.Product.id,
          name: f.Product.name,
          price: f.Product.price,
          image: f.Product.ProductImages?.find(img => img.isMain)?.url || '/assets/images/no-image.png'
        },
      }))
    );
  } catch (err) {
    next(err);
  }
};

exports.removeFavorite = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const favorite = await Favorite.findOne({
      where: { UserId: req.user.id, ProductId: productId },
    });
    if (!favorite) {
      throw new AppError('Sản phẩm không có trong danh sách yêu thích', 404);
    }
    await favorite.destroy();
    res.json({
      message: 'Sản phẩm đã được xóa khỏi danh sách yêu thích thành công.',
    });
  } catch (err) {
    next(err);
  }
};
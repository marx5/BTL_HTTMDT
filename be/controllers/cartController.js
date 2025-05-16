const { sequelize } = require('../config/database');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const AppError = require('../utils/appError');
const Joi = require('joi');
const { rateLimit } = require('express-rate-limit');
const User = require('../models/User');

// Validation Schemas
const addToCartSchema = Joi.object({
  variantId: Joi.number().integer().required(),
  quantity: Joi.number().integer().min(1).default(1),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});

const selectCartItemsSchema = Joi.object({
  cartItemIds: Joi.array().items(Joi.number().integer()).required(),
  isSelected: Joi.boolean().required(),
});

// Rate Limiting
const cartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Helper function to validate cart ownership
const validateCartOwnership = async (cartId, userId, transaction) => {
  const cart = await Cart.findOne({
    where: { id: cartId, UserId: userId },
    transaction
  });
  if (!cart) {
    throw new AppError('cart_not_found', 404);
  }
  return cart;
};

// Helper function to get or create cart
const getOrCreateCart = async (userId, transaction) => {
  let cart = await Cart.findOne({
    where: { UserId: userId },
    transaction
  });

  if (!cart) {
    cart = await Cart.create({ UserId: userId }, { transaction });
  }

  return cart;
};

// Get cart with items
exports.getCart = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const cart = await getOrCreateCart(req.user.id, transaction);
    
    const cartItems = await CartItem.findAll({
      where: { CartId: cart.id },
      include: [
        {
          model: ProductVariant,
          as: 'ProductVariant',
          include: [
            {
              model: Product,
              as: 'Product',
              attributes: ['id', 'name', 'price'],
              include: [
                {
                  model: ProductImage,
                  as: 'ProductImages',
                  attributes: ['id', 'url'],
                  limit: 1,
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      transaction
    });

    await transaction.commit();

    // Tính tổng tiền chỉ cho các sản phẩm được chọn
    const total = cartItems.reduce(
      (sum, item) => sum + (item.selected ? item.ProductVariant.Product.price * item.quantity : 0),
      0
    );

    // Tính phí ship (free ship khi tổng tiền >= 1,000,000đ)
    const shippingFee = total < 1000000 ? 30000 : 0;

    res.json({
      id: cart.id,
      total,
      shippingFee,
      items: cartItems.map(item => ({
        id: item.id,
        variantId: item.ProductVariantId,
        quantity: item.quantity,
        selected: item.selected,
        product: {
          id: item.ProductVariant.Product.id,
          name: item.ProductVariant.Product.name,
          price: item.ProductVariant.Product.price,
          image: item.ProductVariant.Product.ProductImages?.[0]?.url || null
        },
        ProductVariant: {
          id: item.ProductVariant.id,
          size: item.ProductVariant.size,
          color: item.ProductVariant.color,
          stock: item.ProductVariant.stock,
          Product: {
            id: item.ProductVariant.Product.id,
            name: item.ProductVariant.Product.name,
            price: item.ProductVariant.Product.price
          }
        }
      }))
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// Add item to cart
exports.addToCart = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { error, value } = addToCartSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { variantId, quantity } = value;
    const cart = await getOrCreateCart(req.user.id, transaction);

    // Check if variant exists and has enough stock
    const variant = await ProductVariant.findByPk(variantId, { transaction });
    if (!variant) {
      throw new AppError('variant_not_found', 404);
    }

    if (variant.stock < quantity) {
      throw new AppError('stock_exceeded', 400);
    }

    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: { CartId: cart.id, ProductVariantId: variantId },
      transaction
    });

    if (cartItem) {
      cartItem.quantity += quantity;
      await cartItem.save({ transaction });
    } else {
      cartItem = await CartItem.create({
        CartId: cart.id,
        ProductVariantId: variantId,
        quantity,
        selected: false
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      message: 'Thêm sản phẩm vào giỏ hàng thành công',
      cartItem
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { error, value } = updateCartItemSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { quantity } = value;
    const { id } = req.params;

    const cartItem = await CartItem.findByPk(id, {
      include: [
        {
          model: ProductVariant,
          as: 'ProductVariant',
          include: [
            {
              model: Product,
              as: 'Product',
              attributes: ['id', 'name', 'price'],
            },
          ],
          transaction
        }
      ],
      transaction
    });

    if (!cartItem) {
      throw new AppError('cart_item_not_found', 404);
    }

    if (cartItem.ProductVariant.stock < quantity) {
      throw new AppError('stock_exceeded', 400);
    }

    cartItem.quantity = quantity;
    await cartItem.save({ transaction });

    // Lấy lại toàn bộ giỏ hàng để tính tổng
    const cart = await Cart.findOne({
      where: { id: cartItem.CartId },
      include: [
        {
          model: CartItem,
          include: [
            {
              model: ProductVariant,
              as: 'ProductVariant',
              include: [
                {
                  model: Product,
                  as: 'Product',
                  attributes: ['id', 'name', 'price'],
                },
              ],
            },
          ],
        },
      ],
      transaction
    });

    // Tính tổng tiền
    const total = cart.CartItems.reduce(
      (sum, item) => sum + item.ProductVariant.Product.price * item.quantity,
      0
    );

    // Tính phí ship
    const shippingFee = total < 1000000 ? 30000 : 0;

    await transaction.commit();

    res.json({
      message: 'Cập nhật giỏ hàng thành công',
      total,
      shippingFee,
      cartItem: {
        id: cartItem.id,
        variantId: cartItem.ProductVariantId,
        quantity: cartItem.quantity,
        product: {
          id: cartItem.ProductVariant.Product.id,
          name: cartItem.ProductVariant.Product.name,
          price: cartItem.ProductVariant.Product.price,
        },
        ProductVariant: {
          id: cartItem.ProductVariant.id,
          size: cartItem.ProductVariant.size,
          color: cartItem.ProductVariant.color,
          stock: cartItem.ProductVariant.stock,
          Product: {
            id: cartItem.ProductVariant.Product.id,
            name: cartItem.ProductVariant.Product.name,
            price: cartItem.ProductVariant.Product.price
          }
        }
      }
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// Delete cart item
exports.deleteCartItem = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const cartItem = await CartItem.findByPk(id, { transaction });
    if (!cartItem) {
      throw new AppError('cart_item_not_found', 404);
    }

    await cartItem.destroy({ transaction });
    await transaction.commit();

    res.json({
      message: 'Xóa sản phẩm khỏi giỏ hàng thành công'
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.selectCartItems = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { error, value } = selectCartItemsSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { cartItemIds, isSelected } = value;

    const cart = await Cart.findOne({
      where: { UserId: req.user.id },
      include: [
        {
          model: CartItem,
          where: { id: cartItemIds },
        },
      ],
      transaction,
    });

    if (!cart) {
      throw new AppError('cart_not_found', 404);
    }

    await CartItem.update(
      { isSelected },
      {
        where: {
          id: cartItemIds,
          CartId: cart.id,
        },
        transaction,
      }
    );

    await transaction.commit();

    res.json({
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getUserCart = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // Kiểm tra user tồn tại
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('user_not_found', 404);
    }

    // Lấy giỏ hàng của user
    const cart = await Cart.findOne({
      where: { UserId: userId },
      include: [
        {
          model: CartItem,
          include: [
            {
              model: ProductVariant,
              as: 'ProductVariant',
              attributes: ['id', 'size', 'color'],
              include: [
                {
                  model: Product,
                  as: 'Product',
                  attributes: ['id', 'name', 'price'],
                  include: [
                    {
                      model: ProductImage,
                      as: 'ProductImages',
                      attributes: ['id', 'url'],
                      limit: 1,
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!cart) {
      return res.json({
        id: null,
        UserId: userId,
        CartItems: [],
      });
    }

    // Format lại response
    const formattedCart = {
      ...cart.toJSON(),
      CartItems: cart.CartItems.map((item) => ({
        ...item.toJSON(),
        ProductVariant: {
          ...item.ProductVariant.toJSON(),
          Product: {
            ...item.ProductVariant.Product.toJSON(),
            image: item.ProductVariant.Product.ProductImages?.[0]?.url || null,
            ProductImages: undefined,
          },
        },
      })),
    };

    res.json(formattedCart);
  } catch (err) {
    next(err);
  }
};

// Update cart item selected status
exports.updateCartItemSelected = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { selected } = req.body;

    console.log('Updating cart item selected status:', { id, selected });

    // Tìm cart item và cập nhật trạng thái chọn
    const cartItem = await CartItem.findByPk(id, {
      include: [
        {
          model: ProductVariant,
          as: 'ProductVariant',
          include: [
            {
              model: Product,
              as: 'Product',
              attributes: ['id', 'name', 'price'],
              include: [
                {
                  model: ProductImage,
                  as: 'ProductImages',
                  attributes: ['id', 'url'],
                  limit: 1,
                  required: false,
                },
              ],
            },
          ],
          transaction
        }
      ],
      transaction
    });

    if (!cartItem) {
      throw new AppError('cart_item_not_found', 404);
    }

    // Cập nhật trạng thái chọn
    cartItem.selected = selected;
    await cartItem.save({ transaction });

    // Lấy lại toàn bộ giỏ hàng để tính tổng
    const cart = await Cart.findOne({
      where: { id: cartItem.CartId },
      include: [
        {
          model: CartItem,
          include: [
            {
              model: ProductVariant,
              as: 'ProductVariant',
              include: [
                {
                  model: Product,
                  as: 'Product',
                  attributes: ['id', 'name', 'price'],
                  include: [
                    {
                      model: ProductImage,
                      as: 'ProductImages',
                      attributes: ['id', 'url'],
                      limit: 1,
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      transaction
    });

    // Log để debug
    console.log('Cart items after update:', cart.CartItems.map(item => ({
      id: item.id,
      selected: item.selected,
      price: item.ProductVariant.Product.price,
      quantity: item.quantity
    })));

    // Tính tổng tiền chỉ cho các sản phẩm được chọn
    const total = cart.CartItems.reduce(
      (sum, item) => {
        const itemTotal = item.selected ? item.ProductVariant.Product.price * item.quantity : 0;
        console.log(`Item ${item.id}: selected=${item.selected}, price=${item.ProductVariant.Product.price}, quantity=${item.quantity}, total=${itemTotal}`);
        return sum + itemTotal;
      },
      0
    );

    console.log('Final total:', total);

    // Tính phí ship
    const shippingFee = total < 1000000 ? 30000 : 0;

    await transaction.commit();

    // Format lại response để phù hợp với FE
    const formattedResponse = {
      id: cart.id,
      total,
      shippingFee,
      items: cart.CartItems.map(item => ({
        id: item.id,
        variantId: item.ProductVariantId,
        quantity: item.quantity,
        selected: item.selected,
        product: {
          id: item.ProductVariant.Product.id,
          name: item.ProductVariant.Product.name,
          price: item.ProductVariant.Product.price,
          image: item.ProductVariant.Product.ProductImages?.[0]?.url || null
        },
        ProductVariant: {
          id: item.ProductVariant.id,
          size: item.ProductVariant.size,
          color: item.ProductVariant.color,
          stock: item.ProductVariant.stock,
          Product: {
            id: item.ProductVariant.Product.id,
            name: item.ProductVariant.Product.name,
            price: item.ProductVariant.Product.price
          }
        }
      }))
    };

    res.json(formattedResponse);
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
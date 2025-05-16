const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Address = require('../models/Address');
const Favorite = require('../models/Favorite');
const Payment = require('../models/Payment');
const ProductVariant = require('../models/ProductVariant');
const AppError = require('../utils/appError');
const Joi = require('joi');
const { Op } = require('sequelize');
const OrderProduct = require('../models/OrderProduct');
const ProductImage = require('../models/ProductImage');

const getUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional(),
});

exports.getAllUsers = async (req, res, next) => {
  try {
    console.log('Getting all users with query:', req.query);
    
    const { error, value } = getUsersSchema.validate(req.query);
    if (error) {
      console.error('Validation error:', error);
      throw new AppError(error.details[0].message, 400);
    }

    const { page, limit, search } = value;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
      ];
    }

    console.log('Query conditions:', { where, limit, offset });

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'email', 'name', 'role', 'createdAt'],
      limit,
      offset,
    });

    console.log('Found users:', { count, rows });

    res.json({
      users: rows,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw new Error('user_not_found');
    }
    if (user.role === 'admin') {
      throw new Error('admin_required');
    }
    await user.destroy();
    res.json({ message: req.__('success.user_deleted') });
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const userId = req.user.id; // Lấy ID người dùng từ token
    const { name, phone, birthday } = req.body;
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new AppError('user_not_found', 404);
    }
    
    // Cập nhật thông tin cá nhân
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (birthday) user.birthday = birthday;
    
    await user.save();
    
    res.json({
      message: 'Thông tin cá nhân đã được cập nhật',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        birthday: user.birthday
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('user_not_found');
    }
    if (email) user.email = email;
    if (role) user.role = role;
    await user.save();
    res.json({
      message: req.__('success.user_updated'),
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { UserId: id },
      include: [
        {
          model: ProductVariant,
          as: 'ProductVariants',
          include: [
            {
              model: Product,
              as: 'Product',
              attributes: ['id', 'name', 'price'],
            },
          ],
        },
        { model: Address },
        { 
          model: Payment,
          as: 'Payment',
          attributes: ['id', 'status', 'createdAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'name', 'phone', 'birthday', 'role', 'createdAt'],
      include: [
        {
          model: Order,
          as: 'Orders',
          include: [
            {
              model: OrderProduct,
              as: 'OrderProducts',
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
            {
              model: Payment,
              as: 'Payment',
              attributes: ['id', 'status', 'createdAt'],
              required: false,
            },
          ],
          order: [['createdAt', 'DESC']],
        },
      ],
    });
    if (!user) {
      throw new Error('user_not_found');
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    // Lấy user ID từ req.user (đã được set bởi middleware auth)
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'name', 'phone', 'birthday', 'role', 'createdAt'],
      include: [
        {
          model: Address,
          attributes: ['id', 'fullName', 'phone', 'addressLine', 'city', 'country'],
        },
        { model: Favorite, include: [Product] },
      ],
    });

    if (!user) {
      throw new AppError('user_not_found', 404);
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};
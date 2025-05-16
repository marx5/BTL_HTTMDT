const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const Order = require('./Order');
const OrderProduct = require('./OrderProduct');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const ProductVariant = require('./ProductVariant');
const ProductImage = require('./ProductImage');
const Favorite = require('./Favorite');
const Address = require('./Address');
const Review = require('./Review');
const Payment = require('./Payment');
const TokenBlacklist = require('./TokenBlacklist');
const Banner = require('./Banner');

const models = {
  User,
  Product,
  Banner,
  Category,
  Order,
  OrderProduct,
  Cart,
  CartItem,
  ProductVariant,
  ProductImage,
  Favorite,
  Address,
  Review,
  Payment,
  TokenBlacklist,
};

// Thiết lập quan hệ theo thứ tự cụ thể
const setupAssociations = () => {
  // Category associations (tự tham chiếu)
  Category.associate(models);
  
  // Product associations
  Product.associate(models);

  // Banner associations
  Banner.associate(models);
  
  // ProductVariant associations
  ProductVariant.associate(models);
  
  // User associations
  User.associate(models);
  
  // Order associations
  Order.associate(models);
  
  // OrderProduct associations
  OrderProduct.associate(models);
  
  // Cart associations
  Cart.associate(models);
  
  // CartItem associations
  CartItem.associate(models);
  
  // ProductImage associations
  ProductImage.associate(models);
  
  // Favorite associations
  Favorite.associate(models);
  
  // Address associations
  Address.associate(models);
  
  // Review associations
  Review.associate(models);
  
  // Payment associations
  Payment.associate(models);
};

setupAssociations();

module.exports = models;
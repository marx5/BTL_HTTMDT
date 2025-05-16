const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  CategoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Categories',
      key: 'id',
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

Product.associate = (models) => {
  Product.belongsTo(models.Category, { foreignKey: 'CategoryId', as: 'Category' });
  Product.hasMany(models.ProductVariant, { foreignKey: 'ProductId', as: 'ProductVariants' });
  Product.hasMany(models.ProductImage, { foreignKey: 'ProductId', as: 'ProductImages' });
  Product.hasMany(models.Favorite, { foreignKey: 'ProductId', as: 'Favorites' });
  Product.hasMany(models.Review, { foreignKey: 'ProductId', as: 'Reviews' });
  Product.hasMany(models.Banner, { foreignKey: 'productId' });
};

module.exports = Product;
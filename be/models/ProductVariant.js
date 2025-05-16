const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const ProductVariant = sequelize.define('ProductVariant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ProductId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id',
    },
  },
  size: {
    type: DataTypes.STRING,
  },
  color: {
    type: DataTypes.STRING,
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

ProductVariant.associate = (models) => {
  ProductVariant.belongsTo(models.Product, { foreignKey: 'ProductId', as: 'Product' });
  ProductVariant.belongsToMany(models.Order, { through: models.OrderProduct, foreignKey: 'ProductVariantId', as: 'Orders' });
};

module.exports = ProductVariant;
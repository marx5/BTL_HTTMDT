const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const OrderProduct = sequelize.define('OrderProduct', {
  OrderId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id',
    },
  },
  ProductVariantId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'ProductVariants',
      key: 'id',
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

OrderProduct.associate = (models) => {
  OrderProduct.belongsTo(models.Order, { foreignKey: 'OrderId' });
  OrderProduct.belongsTo(models.ProductVariant, { foreignKey: 'ProductVariantId' });
};

module.exports = OrderProduct;
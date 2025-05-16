const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  CartId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Carts',
      key: 'id',
    },
  },
  ProductVariantId: {
    type: DataTypes.INTEGER,
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
  selected: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'CartItems',
  timestamps: true,
});

CartItem.associate = (models) => {
  CartItem.belongsTo(models.Cart, { foreignKey: 'CartId' });
  CartItem.belongsTo(models.ProductVariant, { foreignKey: 'ProductVariantId', as: 'ProductVariant' });
};

module.exports = CartItem;
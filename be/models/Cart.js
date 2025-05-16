const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  UserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
});

Cart.associate = (models) => {
  Cart.belongsTo(models.User, { foreignKey: 'UserId' });
  Cart.hasMany(models.CartItem, { foreignKey: 'CartId' });
};

module.exports = Cart;
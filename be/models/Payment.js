const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  OrderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id',
    },
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

Payment.associate = (models) => {
  Payment.belongsTo(models.Order, { foreignKey: 'OrderId', as: 'Order' });
};

module.exports = Payment;
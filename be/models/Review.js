const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Review = sequelize.define('Review', {
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
  ProductId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id',
    },
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  comment: {
    type: DataTypes.TEXT,
  },
});

Review.associate = (models) => {
  Review.belongsTo(models.User, { foreignKey: 'UserId' });
  Review.belongsTo(models.Product, { foreignKey: 'ProductId' });
};

module.exports = Review;
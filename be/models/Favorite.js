const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Favorite = sequelize.define('Favorite', {
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
});

Favorite.associate = (models) => {
  Favorite.belongsTo(models.User, { foreignKey: 'UserId' });
  Favorite.belongsTo(models.Product, { foreignKey: 'ProductId' });
};

module.exports = Favorite;
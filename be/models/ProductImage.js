const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const ProductImage = sequelize.define('ProductImage', {
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
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isMain: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

ProductImage.associate = (models) => {
  ProductImage.belongsTo(models.Product, { foreignKey: 'ProductId', as: 'Product' });
};

module.exports = ProductImage;
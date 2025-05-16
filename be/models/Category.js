const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Categories',
      key: 'id',
    },
  },
});

Category.associate = (models) => {
  Category.belongsTo(models.Category, { as: 'Parent', foreignKey: 'parentId' });
  Category.hasMany(models.Category, { as: 'Children', foreignKey: 'parentId' });
  Category.hasMany(models.Product, { foreignKey: 'CategoryId', as: 'Products' });
};

module.exports = Category;
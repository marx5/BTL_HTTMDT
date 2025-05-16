const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Banner = sequelize.define('Banner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'banners',
  timestamps: true
});

// Define association
Banner.associate = (models) => {
  Banner.belongsTo(models.Product, { foreignKey: 'productId' });
};

module.exports = Banner;
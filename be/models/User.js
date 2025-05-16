const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  birthday: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('admin', 'customer'),
    defaultValue: 'customer',
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  verificationToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  verificationTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

User.associate = (models) => {
  User.hasOne(models.Cart, { foreignKey: 'UserId' });
  User.hasMany(models.Order, { foreignKey: 'UserId' });
  User.hasMany(models.Favorite, { foreignKey: 'UserId' });
  User.hasMany(models.Address, { foreignKey: 'UserId' });
  User.hasMany(models.Review, { foreignKey: 'UserId' });
};

module.exports = User;
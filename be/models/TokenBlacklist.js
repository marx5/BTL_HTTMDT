const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const TokenBlacklist = sequelize.define('TokenBlacklist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  },
});

module.exports = TokenBlacklist;
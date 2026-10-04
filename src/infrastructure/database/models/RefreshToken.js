const { DataTypes } = require('sequelize');
const { baseFields, baseOptions } = require('./baseModel');

module.exports = (sequelize) => sequelize.define('RefreshToken', {
  ...baseFields(),
  tokenHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, baseOptions({
  indexes: [
    { fields: ['user_id'] },
    { fields: ['expires_at'] },
  ],
}));

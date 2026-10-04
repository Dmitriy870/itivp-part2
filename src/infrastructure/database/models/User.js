const { DataTypes } = require('sequelize');
const { baseFields, baseOptions } = require('./baseModel');
const { ROLES } = require('../../../domain/user/roles');

module.exports = (sequelize) => sequelize.define('User', {
  ...baseFields(),
  email: {
    type: DataTypes.STRING(254),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: ROLES.USER,
    validate: { isIn: [Object.values(ROLES)] },
  },
  failedAttempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, baseOptions({
  defaultScope: {
    attributes: { exclude: ['passwordHash', 'failedAttempts', 'lockUntil'] },
  },
  scopes: {
    withSecrets: {},
  },
  indexes: [{ unique: true, fields: ['email'] }],
}));

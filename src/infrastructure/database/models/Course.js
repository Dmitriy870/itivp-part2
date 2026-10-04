const { DataTypes } = require('sequelize');
const { baseFields, baseOptions } = require('./baseModel');
const { COURSE_FORMATS } = require('../../../domain/course/courseFormats');

module.exports = (sequelize) => sequelize.define('Course', {
  ...baseFields(),
  title: {
    type: DataTypes.STRING(160),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  format: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: { isIn: [COURSE_FORMATS] },
  },
  durationHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  certificateIssued: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  webinarUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  published: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, baseOptions({
  indexes: [
    { fields: ['category'] },
    { fields: ['format'] },
    { fields: ['published'] },
  ],
}));

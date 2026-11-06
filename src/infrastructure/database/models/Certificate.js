const { DataTypes } = require('sequelize');
const { baseFields, baseOptions } = require('./baseModel');

module.exports = (sequelize) => sequelize.define('Certificate', {
  ...baseFields(),
  userId: { type: DataTypes.UUID, allowNull: false },
  courseId: { type: DataTypes.UUID, allowNull: false },
  number: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  issuedAt: { type: DataTypes.DATE, allowNull: false },
}, baseOptions({
  indexes: [
    { unique: true, fields: ['user_id', 'course_id'] },
    { unique: true, fields: ['number'] },
  ],
}));

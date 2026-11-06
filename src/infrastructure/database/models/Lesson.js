const { DataTypes } = require('sequelize');
const { baseFields, baseOptions } = require('./baseModel');

module.exports = (sequelize) => sequelize.define('Lesson', {
  ...baseFields(),
  courseId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(180), allowNull: false },
  position: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  durationMinutes: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
}, baseOptions({
  indexes: [{ unique: true, fields: ['course_id', 'position'] }],
}));

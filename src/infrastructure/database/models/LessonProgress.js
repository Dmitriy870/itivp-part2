const { DataTypes } = require('sequelize');
const { baseFields, baseOptions } = require('./baseModel');

module.exports = (sequelize) => sequelize.define('LessonProgress', {
  ...baseFields(),
  userId: { type: DataTypes.UUID, allowNull: false },
  lessonId: { type: DataTypes.UUID, allowNull: false },
  completedAt: { type: DataTypes.DATE, allowNull: false },
}, baseOptions({
  indexes: [{ unique: true, fields: ['user_id', 'lesson_id'] }],
}));

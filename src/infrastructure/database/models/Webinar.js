const { DataTypes } = require('sequelize');
const { baseFields, baseOptions } = require('./baseModel');

module.exports = (sequelize) => sequelize.define('Webinar', {
  ...baseFields(),
  courseId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(180), allowNull: false },
  scheduledAt: { type: DataTypes.DATE, allowNull: false },
  durationMinutes: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 15 } },
  meetingUrl: { type: DataTypes.STRING(500), allowNull: false },
}, baseOptions({
  indexes: [{ fields: ['scheduled_at'] }, { fields: ['course_id'] }],
}));

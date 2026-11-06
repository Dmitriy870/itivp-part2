const { DataTypes } = require('sequelize');
const { baseFields, baseOptions } = require('./baseModel');

module.exports = (sequelize) => sequelize.define('Enrollment', {
  ...baseFields(),
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
    validate: { isIn: [['active', 'completed', 'cancelled']] },
  },
}, baseOptions({
  indexes: [
    { unique: true, fields: ['user_id', 'course_id'] },
    { fields: ['user_id'] },
  ],
}));

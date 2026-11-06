const sequelize = require('../sequelize');
const defineUser = require('./User');
const defineCourse = require('./Course');
const defineRefreshToken = require('./RefreshToken');
const defineEnrollment = require('./Enrollment');

const User = defineUser(sequelize);
const Course = defineCourse(sequelize);
const RefreshToken = defineRefreshToken(sequelize);
const Enrollment = defineEnrollment(sequelize);

User.hasMany(Course, { foreignKey: 'createdBy', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'createdBy', as: 'author' });

User.hasMany(RefreshToken, {
  foreignKey: 'userId',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Enrollment, { foreignKey: 'userId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

module.exports = {
  sequelize,
  User,
  Course,
  RefreshToken,
  Enrollment,
};

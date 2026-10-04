const sequelize = require('../sequelize');
const defineUser = require('./User');
const defineCourse = require('./Course');
const defineRefreshToken = require('./RefreshToken');

const User = defineUser(sequelize);
const Course = defineCourse(sequelize);
const RefreshToken = defineRefreshToken(sequelize);

User.hasMany(Course, { foreignKey: 'createdBy', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'createdBy', as: 'author' });

User.hasMany(RefreshToken, {
  foreignKey: 'userId',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Course,
  RefreshToken,
};

const sequelize = require('../sequelize');
const defineUser = require('./User');
const defineCourse = require('./Course');
const defineRefreshToken = require('./RefreshToken');
const defineEnrollment = require('./Enrollment');
const defineLesson = require('./Lesson');
const defineLessonProgress = require('./LessonProgress');
const defineCertificate = require('./Certificate');
const defineWebinar = require('./Webinar');

const User = defineUser(sequelize);
const Course = defineCourse(sequelize);
const RefreshToken = defineRefreshToken(sequelize);
const Enrollment = defineEnrollment(sequelize);
const Lesson = defineLesson(sequelize);
const LessonProgress = defineLessonProgress(sequelize);
const Certificate = defineCertificate(sequelize);
const Webinar = defineWebinar(sequelize);

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

Course.hasMany(Lesson, { foreignKey: 'courseId', as: 'lessons', onDelete: 'CASCADE' });
Lesson.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
User.hasMany(LessonProgress, { foreignKey: 'userId', as: 'lessonProgress', onDelete: 'CASCADE' });
LessonProgress.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Lesson.hasMany(LessonProgress, { foreignKey: 'lessonId', as: 'progress', onDelete: 'CASCADE' });
LessonProgress.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });
User.hasMany(Certificate, { foreignKey: 'userId', as: 'certificates', onDelete: 'CASCADE' });
Certificate.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Course.hasMany(Certificate, { foreignKey: 'courseId', as: 'certificates', onDelete: 'CASCADE' });
Certificate.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Course.hasMany(Webinar, { foreignKey: 'courseId', as: 'webinars', onDelete: 'CASCADE' });
Webinar.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

module.exports = {
  sequelize,
  User,
  Course,
  RefreshToken,
  Enrollment,
  Lesson,
  LessonProgress,
  Certificate,
  Webinar,
};

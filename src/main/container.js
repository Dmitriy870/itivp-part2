const AuthService = require('../application/services/AuthService');
const CourseService = require('../application/services/CourseService');
const UserService = require('../application/services/UserService');
const EnrollmentService = require('../application/services/EnrollmentService');
const UserRepository = require('../infrastructure/database/repositories/UserRepository');
const CourseRepository = require('../infrastructure/database/repositories/CourseRepository');
const RefreshTokenRepository = require('../infrastructure/database/repositories/RefreshTokenRepository');
const EnrollmentRepository = require('../infrastructure/database/repositories/EnrollmentRepository');
const tokenProvider = require('../infrastructure/security/tokenProvider');
const passwordHasher = require('../infrastructure/security/passwordHasher');
const { securityLog } = require('../infrastructure/logging/securityLogger');
const { sequelize } = require('../infrastructure/database/models');
const clock = require('../shared/time/clock');
const idGenerator = require('../shared/ids/idGenerator');

function createContainer() {
  const repositories = {
    user: new UserRepository(),
    course: new CourseRepository(),
    refreshToken: new RefreshTokenRepository(),
    enrollment: new EnrollmentRepository(),
  };

  const services = {
    auth: new AuthService({
      userRepository: repositories.user,
      refreshTokenRepository: repositories.refreshToken,
      passwordHasher,
      tokenProvider,
      securityLog,
      clock,
      idGenerator,
    }),
    course: new CourseService({ courseRepository: repositories.course }),
    user: new UserService({ userRepository: repositories.user }),
    enrollment: new EnrollmentService({
      enrollmentRepository: repositories.enrollment,
      courseRepository: repositories.course,
    }),
  };

  return {
    repositories,
    services,
    security: { tokenProvider, passwordHasher, securityLog },
    infrastructure: {
      async checkDatabase() {
        await sequelize.authenticate();
      },
    },
    clock,
  };
}

module.exports = { createContainer };


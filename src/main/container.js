const AuthService = require('../application/services/AuthService');
const CourseService = require('../application/services/CourseService');
const UserService = require('../application/services/UserService');
const UserRepository = require('../infrastructure/database/repositories/UserRepository');
const CourseRepository = require('../infrastructure/database/repositories/CourseRepository');
const RefreshTokenRepository = require('../infrastructure/database/repositories/RefreshTokenRepository');
const tokenProvider = require('../infrastructure/security/tokenProvider');
const passwordHasher = require('../infrastructure/security/passwordHasher');
const { securityLog } = require('../infrastructure/logging/securityLogger');
const clock = require('../shared/time/clock');
const idGenerator = require('../shared/ids/idGenerator');

function createContainer() {
  const repositories = {
    user: new UserRepository(),
    course: new CourseRepository(),
    refreshToken: new RefreshTokenRepository(),
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
  };

  return {
    repositories,
    services,
    security: { tokenProvider, passwordHasher, securityLog },
    clock,
  };
}

module.exports = { createContainer };


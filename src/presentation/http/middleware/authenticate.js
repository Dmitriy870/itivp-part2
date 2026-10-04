const AppError = require('../../../shared/errors/AppError');

function createAuthenticate({ userRepository, tokenProvider, securityLog }) {
  return async function authenticate(req, res, next) {
    const authorization = req.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return next(new AppError(401, 'AUTH_REQUIRED', 'Требуется аутентификация'));
    }

    try {
      const payload = tokenProvider.verifyAccessToken(authorization.slice(7));
      const user = await userRepository.findById(payload.sub);
      if (!user) throw new Error('User does not exist');
      req.user = user;
      return next();
    } catch (error) {
      securityLog('INVALID_ACCESS_TOKEN', {
        ip: req.ip,
        path: req.originalUrl,
        reason: error.name,
      });
      return next(new AppError(401, 'INVALID_ACCESS_TOKEN', 'Недействительный или просроченный токен'));
    }
  };
}

module.exports = createAuthenticate;

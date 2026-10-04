const AppError = require('../../../shared/errors/AppError');

function requireJson(req, res, next) {
  if (!req.is('application/json')) {
    return next(new AppError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Content-Type должен быть application/json',
    ));
  }
  return next();
}

module.exports = requireJson;

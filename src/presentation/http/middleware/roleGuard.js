const AppError = require('../../../shared/errors/AppError');
const { ROLE_LEVEL } = require('../../../domain/user/roles');

function createRoleGuard({ securityLog }) {
  return function roleGuard(requiredRole) {
    return (req, res, next) => {
      if (!req.user || ROLE_LEVEL[req.user.role] < ROLE_LEVEL[requiredRole]) {
        securityLog('FORBIDDEN_ACCESS', {
          userId: req.user?.id,
          userRole: req.user?.role,
          requiredRole,
          method: req.method,
          path: req.originalUrl,
          ip: req.ip,
        });
        return next(new AppError(403, 'FORBIDDEN', 'Недостаточно прав для выполнения операции'));
      }
      return next();
    };
  };
}

module.exports = createRoleGuard;

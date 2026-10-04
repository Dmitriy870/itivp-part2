const express = require('express');
const requireJson = require('../middleware/requireJson');
const validate = require('../middleware/validate');
const { ROLES } = require('../../../domain/user/roles');
const { userIdSchema, roleSchema } = require('../validation/userSchemas');

function createUserRoutes({
  controller,
  authenticate,
  roleGuard,
  auditAdminAction,
  perUserWriteLimiter,
}) {
  const router = express.Router();

  router.use(authenticate, roleGuard(ROLES.ADMIN), auditAdminAction);
  router.get('/', controller.list);
  router.put(
  '/:id/role',
  requireJson,
  perUserWriteLimiter,
  validate(userIdSchema, 'params'),
  validate(roleSchema),
  controller.changeRole,
  );
  router.delete(
  '/:id',
  perUserWriteLimiter,
  validate(userIdSchema, 'params'),
  controller.remove,
  );

  return router;
}

module.exports = createUserRoutes;

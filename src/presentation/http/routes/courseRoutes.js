const express = require('express');
const requireJson = require('../middleware/requireJson');
const validate = require('../middleware/validate');
const { ROLES } = require('../../../domain/user/roles');
const {
  courseBodySchema,
  courseIdSchema,
  courseQuerySchema,
} = require('../validation/courseSchemas');

function createCourseRoutes({ controller, authenticate, roleGuard, perUserWriteLimiter }) {
  const router = express.Router();

  router.get('/', validate(courseQuerySchema, 'query'), controller.list);
  router.get('/:id', validate(courseIdSchema, 'params'), controller.getById);
  router.post(
  '/',
  requireJson,
  authenticate,
  roleGuard(ROLES.MODERATOR),
  perUserWriteLimiter,
  validate(courseBodySchema),
  controller.create,
  );
  router.put(
  '/:id',
  requireJson,
  authenticate,
  roleGuard(ROLES.MODERATOR),
  perUserWriteLimiter,
  validate(courseIdSchema, 'params'),
  validate(courseBodySchema),
  controller.update,
  );
  router.delete(
  '/:id',
  authenticate,
  roleGuard(ROLES.ADMIN),
  perUserWriteLimiter,
  validate(courseIdSchema, 'params'),
  controller.remove,
  );

  return router;
}

module.exports = createCourseRoutes;

const express = require('express');
const requireJson = require('../middleware/requireJson');
const validate = require('../middleware/validate');
const { courseParamSchema } = require('../validation/learningSchemas');
const {
  webinarQuerySchema, webinarIdSchema, managedWebinarSchema, webinarBodySchema,
} = require('../validation/webinarSchemas');

function createWebinarRoutes({ controller, authenticate, perUserWriteLimiter }) {
  const router = express.Router();
  router.get('/', validate(webinarQuerySchema, 'query'), controller.list);
  router.get('/manage/:courseId', authenticate, validate(courseParamSchema, 'params'), controller.listManaged);
  router.post('/manage/:courseId', requireJson, authenticate, perUserWriteLimiter,
    validate(courseParamSchema, 'params'), validate(webinarBodySchema), controller.create);
  router.put('/manage/:courseId/:id', requireJson, authenticate, perUserWriteLimiter,
    validate(managedWebinarSchema, 'params'), validate(webinarBodySchema), controller.update);
  router.delete('/manage/:courseId/:id', authenticate, perUserWriteLimiter,
    validate(managedWebinarSchema, 'params'), controller.remove);
  router.get('/:id', validate(webinarIdSchema, 'params'), controller.getById);
  return router;
}

module.exports = createWebinarRoutes;

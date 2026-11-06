const express = require('express');
const validate = require('../middleware/validate');
const { enrollmentCourseSchema } = require('../validation/enrollmentSchemas');

function createEnrollmentRoutes({ controller, authenticate, perUserWriteLimiter }) {
  const router = express.Router();

  router.use(authenticate);
  router.get('/me', controller.listMine);
  router.post(
    '/:courseId',
    perUserWriteLimiter,
    validate(enrollmentCourseSchema, 'params'),
    controller.enroll,
  );
  router.delete(
    '/:courseId',
    perUserWriteLimiter,
    validate(enrollmentCourseSchema, 'params'),
    controller.cancel,
  );

  return router;
}

module.exports = createEnrollmentRoutes;

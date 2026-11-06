const express = require('express');
const validate = require('../middleware/validate');
const {
  courseParamSchema,
  lessonParamSchema,
  certificateParamSchema,
} = require('../validation/learningSchemas');

function createLearningRoutes({ controller, authenticate, perUserWriteLimiter }) {
  const learning = express.Router();
  learning.use(authenticate);
  learning.get('/:courseId', validate(courseParamSchema, 'params'), controller.plan);
  learning.post(
    '/:courseId/lessons/:lessonId/complete',
    perUserWriteLimiter,
    validate(lessonParamSchema, 'params'),
    controller.completeLesson,
  );

  const certificates = express.Router();
  certificates.get('/me', authenticate, controller.certificates);
  certificates.get(
    '/verify/:number',
    validate(certificateParamSchema, 'params'),
    controller.verifyCertificate,
  );

  return { learning, certificates };
}

module.exports = createLearningRoutes;

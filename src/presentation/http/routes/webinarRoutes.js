const express = require('express');
const validate = require('../middleware/validate');
const { webinarQuerySchema } = require('../validation/learningSchemas');

function createWebinarRoutes(controller) {
  const router = express.Router();
  router.get('/', validate(webinarQuerySchema, 'query'), controller.list);
  return router;
}

module.exports = createWebinarRoutes;

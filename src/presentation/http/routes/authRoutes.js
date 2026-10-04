const express = require('express');
const requireJson = require('../middleware/requireJson');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validation/authSchemas');

function createAuthRoutes({ controller, authenticate, authLimiter }) {
  const router = express.Router();

  router.post('/register', authLimiter, requireJson, validate(registerSchema), controller.register);
  router.post('/login', authLimiter, requireJson, validate(loginSchema), controller.login);
  router.post('/refresh', authLimiter, controller.refresh);
  router.post('/logout', controller.logout);
  router.get('/me', authenticate, controller.me);

  return router;
}

module.exports = createAuthRoutes;

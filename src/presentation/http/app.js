const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const createAuthRoutes = require('./routes/authRoutes');
const createCourseRoutes = require('./routes/courseRoutes');
const createUserRoutes = require('./routes/userRoutes');
const createAuthController = require('./controllers/authController');
const createCourseController = require('./controllers/courseController');
const createUserController = require('./controllers/userController');
const createAuthenticate = require('./middleware/authenticate');
const createRoleGuard = require('./middleware/roleGuard');
const createRateLimits = require('./middleware/rateLimits');
const createAuditAdminAction = require('./middleware/auditAdminAction');
const { notFound, createErrorHandler } = require('./middleware/errorHandler');

function createApp(container) {
  const app = express();
  const { repositories, services, security, clock } = container;
  const authenticate = createAuthenticate({
    userRepository: repositories.user,
    tokenProvider: security.tokenProvider,
    securityLog: security.securityLog,
  });
  const roleGuard = createRoleGuard({ securityLog: security.securityLog });
  const rateLimits = createRateLimits({ securityLog: security.securityLog });
  const auditAdminAction = createAuditAdminAction({ securityLog: security.securityLog });
  const errorHandler = createErrorHandler({ securityLog: security.securityLog });
  const controllers = {
    auth: createAuthController(services.auth),
    course: createCourseController(services.course),
    user: createUserController(services.user),
  };

  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  frameguard: { action: 'deny' },
  }));
  app.use(cors({
  origin(origin, callback) {
    const allowlist = (process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map((item) => item.trim());
    if (!origin || allowlist.includes(origin)) return callback(null, true);
    const error = new Error('Origin is not allowed by CORS');
    error.status = 403;
    error.code = 'CORS_FORBIDDEN';
    return callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }));
  app.use(rateLimits.globalLimiter);
  app.use(express.json({ limit: '100kb', type: 'application/json' }));
  app.use(cookieParser());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: clock.now().toISOString() });
  });
  app.use('/auth', createAuthRoutes({
    controller: controllers.auth,
    authenticate,
    authLimiter: rateLimits.authLimiter,
  }));
  app.use('/courses', createCourseRoutes({
    controller: controllers.course,
    authenticate,
    roleGuard,
    perUserWriteLimiter: rateLimits.perUserWriteLimiter,
  }));
  app.use('/users', createUserRoutes({
    controller: controllers.user,
    authenticate,
    roleGuard,
    auditAdminAction,
    perUserWriteLimiter: rateLimits.perUserWriteLimiter,
  }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const createAuthRoutes = require('./routes/authRoutes');
const createCourseRoutes = require('./routes/courseRoutes');
const createUserRoutes = require('./routes/userRoutes');
const createEnrollmentRoutes = require('./routes/enrollmentRoutes');
const createLearningRoutes = require('./routes/learningRoutes');
const createWebinarRoutes = require('./routes/webinarRoutes');
const createAuthController = require('./controllers/authController');
const createCourseController = require('./controllers/courseController');
const createUserController = require('./controllers/userController');
const createEnrollmentController = require('./controllers/enrollmentController');
const createLearningController = require('./controllers/learningController');
const createWebinarController = require('./controllers/webinarController');
const createAuthenticate = require('./middleware/authenticate');
const createRoleGuard = require('./middleware/roleGuard');
const createRateLimits = require('./middleware/rateLimits');
const createAuditAdminAction = require('./middleware/auditAdminAction');
const { notFound, createErrorHandler } = require('./middleware/errorHandler');
const requestLogger = require('../../infrastructure/observability/requestLogger');
const { metricsMiddleware, metricsHandler } = require('../../infrastructure/observability/metrics');

function createApp(container) {
  const app = express();
  const {
    repositories,
    services,
    security,
    infrastructure,
    clock,
  } = container;
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
    enrollment: createEnrollmentController(services.enrollment),
    learning: createLearningController(services.learning),
    webinar: createWebinarController(services.webinar),
  };

  app.disable('x-powered-by');
  app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
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
  app.use(requestLogger);
  app.use(metricsMiddleware);
  app.use(rateLimits.globalLimiter);
  app.use(express.json({ limit: '100kb', type: 'application/json' }));
  app.use(cookieParser());

  app.get('/health', async (req, res) => {
    try {
      await infrastructure.checkDatabase();
      const memory = process.memoryUsage();
      res.json({
        status: 'ok',
        timestamp: clock.now().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        memory: {
          rssBytes: memory.rss,
          heapUsedBytes: memory.heapUsed,
        },
        database: 'available',
        release: process.env.APP_RELEASE || 'development',
      });
    } catch (error) {
      req.log.error({ error }, 'Health check failed');
      res.status(503).json({
        status: 'degraded',
        timestamp: clock.now().toISOString(),
        database: 'unavailable',
      });
    }
  });
  app.get('/metrics', metricsHandler);

  if (process.env.ENABLE_TEST_ENDPOINTS === 'true') {
    app.post('/debug/error', (req, res, next) => {
      if (!process.env.DEBUG_ENDPOINT_TOKEN
        || req.get('x-debug-token') !== process.env.DEBUG_ENDPOINT_TOKEN) {
        return res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Маршрут не найден' } });
      }
      return next(new Error('Test Sentry error from training platform API'));
    });
  }
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
  app.use('/enrollments', createEnrollmentRoutes({
    controller: controllers.enrollment,
    authenticate,
    perUserWriteLimiter: rateLimits.perUserWriteLimiter,
  }));
  const learningRoutes = createLearningRoutes({
    controller: controllers.learning,
    authenticate,
    perUserWriteLimiter: rateLimits.perUserWriteLimiter,
  });
  app.use('/learning', learningRoutes.learning);
  app.use('/certificates', learningRoutes.certificates);
  app.use('/webinars', createWebinarRoutes(controllers.webinar));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;

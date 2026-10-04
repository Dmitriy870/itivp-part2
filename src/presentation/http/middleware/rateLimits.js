const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

function createRateLimits({ securityLog }) {
  function handler(req, res, next, options) {
    securityLog('RATE_LIMIT_EXCEEDED', {
      userId: req.user?.id,
      ip: req.ip,
      method: req.method,
      path: req.originalUrl,
    });
    res.status(options.statusCode).json({
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Слишком много запросов. Повторите позже' },
    });
  }

  const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler,
  });

  const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler,
  });

  const perUserWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  handler,
  });

  return { globalLimiter, authLimiter, perUserWriteLimiter };
}

module.exports = createRateLimits;

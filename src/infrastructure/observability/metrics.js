const {
  Registry,
  Counter,
  Gauge,
  Histogram,
  collectDefaultMetrics,
} = require('@prometheus-io/client');

const registry = new Registry();
registry.setDefaultLabels({ service: 'training-platform-api' });
collectDefaultMetrics({
  register: registry,
  prefix: 'training_platform_',
});

const httpRequestsTotal = new Counter({
  name: 'training_platform_http_requests_total',
  help: 'Total number of HTTP requests processed by the API',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

const httpRequestDurationSeconds = new Histogram({
  name: 'training_platform_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

const activeRequests = new Gauge({
  name: 'training_platform_http_active_requests',
  help: 'Number of HTTP requests currently being processed',
  registers: [registry],
});

function normalizeRoute(req) {
  if (req.route?.path) return `${req.baseUrl || ''}${req.route.path}`;
  if (req.baseUrl) return req.baseUrl;
  if (req.path === '/metrics') return '/metrics';
  return 'unmatched';
}

function metricsMiddleware(req, res, next) {
  const startedAt = process.hrtime.bigint();
  activeRequests.inc();

  res.once('finish', () => {
    activeRequests.dec();
    const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
    const labels = {
      method: req.method,
      route: normalizeRoute(req),
      status_code: String(res.statusCode),
    };
    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  next();
}

async function metricsHandler(req, res, next) {
  try {
    res.setHeader('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registry,
  metricsMiddleware,
  metricsHandler,
};

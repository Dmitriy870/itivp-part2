require('dotenv').config({ quiet: true });
const createApp = require('../presentation/http/app');
const { createContainer } = require('./container');
const { sequelize } = require('../infrastructure/database/models');
const { validateEnvironment } = require('../infrastructure/config/environment');
const logger = require('../infrastructure/observability/logger');
const sentry = require('../infrastructure/observability/sentry');

const port = Number(process.env.PORT || 3000);

async function start() {
  validateEnvironment();
  await sequelize.authenticate();
  await sequelize.sync();
  const app = createApp(createContainer());

  const server = app.listen(port, () => {
    logger.info({ port }, 'Secure Training Platform API started');
  });

  async function shutdown(signal) {
    logger.info({ signal }, 'Graceful shutdown started');
    server.close(async () => {
      await sequelize.close();
      await sentry.flush();
      process.exit(0);
    });
  }

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error) => {
  logger.fatal({ error }, 'Failed to start server');
  sentry.captureException(error, { phase: 'startup' });
  sentry.flush().finally(() => process.exit(1));
});

process.on('unhandledRejection', (error) => {
  logger.error({ error }, 'Unhandled promise rejection');
  sentry.captureException(error, { phase: 'unhandledRejection' });
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  sentry.captureException(error, { phase: 'uncaughtException' });
  sentry.flush().finally(() => process.exit(1));
});

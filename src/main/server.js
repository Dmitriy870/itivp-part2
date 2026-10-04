require('dotenv').config({ quiet: true });
const createApp = require('../presentation/http/app');
const { createContainer } = require('./container');
const { sequelize } = require('../infrastructure/database/models');
const { validateEnvironment } = require('../infrastructure/config/environment');

const port = Number(process.env.PORT || 3000);

async function start() {
  validateEnvironment();
  await sequelize.authenticate();
  await sequelize.sync();
  const app = createApp(createContainer());

  app.listen(port, () => {
    console.log(`Secure Training Platform API: http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Не удалось запустить сервер:', error.message);
  process.exit(1);
});

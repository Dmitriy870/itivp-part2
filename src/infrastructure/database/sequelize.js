const { Sequelize } = require('sequelize');

function createSequelize() {
  if (process.env.NODE_ENV === 'test') {
    require('moment').suppressDeprecationWarnings = true;
    const { newDb, DataType } = require('pg-mem');
    const memoryDb = newDb({ noAstCoverageCheck: true });
    memoryDb.public.registerFunction({
      name: 'current_database',
      returns: DataType.text,
      implementation: () => 'training_platform_test',
    });
    memoryDb.public.registerFunction({
      name: 'version',
      returns: DataType.text,
      implementation: () => 'PostgreSQL 16.0',
    });

    return new Sequelize('postgres://postgres:postgres@localhost:5432/training_platform_test', {
      dialect: 'postgres',
      dialectModule: memoryDb.adapters.createPg(),
      logging: false,
    });
  }

  const databaseUrl = process.env.DATABASE_URL
    || 'postgres://postgres:postgres@localhost:5432/training_platform';

  return new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: true,
    },
  });
}

module.exports = createSequelize();

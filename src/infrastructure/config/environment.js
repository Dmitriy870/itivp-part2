function validateEnvironment() {
  const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Не заданы обязательные переменные окружения: ${missing.join(', ')}`);
  }

  for (const name of required) {
    if (process.env[name].length < 32) {
      throw new Error(`${name} должен содержать не менее 32 символов`);
    }
  }

  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET и JWT_REFRESH_SECRET должны отличаться');
  }
}

module.exports = { validateEnvironment };


const { BaseError, UniqueConstraintError, ValidationError } = require('sequelize');
const AppError = require('../../../shared/errors/AppError');

function notFound(req, res, next) {
  next(new AppError(404, 'ROUTE_NOT_FOUND', 'Маршрут не найден'));
}

function createErrorHandler({ securityLog }) {
  return function errorHandler(error, req, res, next) {
  let normalized = error;

  if (error instanceof UniqueConstraintError) {
    normalized = new AppError(409, 'CONFLICT', 'Ресурс с такими данными уже существует');
  } else if (error instanceof ValidationError) {
    normalized = new AppError(400, 'DATABASE_VALIDATION_ERROR', 'Данные не прошли проверку');
  } else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    normalized = new AppError(400, 'INVALID_JSON', 'Некорректный JSON');
  } else if (error instanceof BaseError) {
    normalized = new AppError(500, 'DATABASE_ERROR', 'Ошибка при работе с базой данных');
  } else if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
    normalized = new AppError(
      error.status,
      error.code || 'REQUEST_ERROR',
      error.message || 'Ошибка запроса',
    );
  }

  const status = normalized instanceof AppError ? normalized.status : 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (status >= 500) {
    securityLog('APPLICATION_ERROR', {
      method: req.method,
      path: req.originalUrl,
      error: error.message,
      stack: isProduction ? undefined : error.stack,
    });
  }

  const body = {
    error: {
      code: status === 500 && isProduction ? 'INTERNAL_ERROR' : (normalized.code || 'INTERNAL_ERROR'),
      message: status === 500 && isProduction
        ? 'Внутренняя ошибка сервера'
        : (normalized.message || 'Внутренняя ошибка сервера'),
    },
  };
  if (normalized.details && !isProduction) body.error.details = normalized.details;

    res.status(status).json(body);
  };
}

module.exports = { notFound, createErrorHandler };

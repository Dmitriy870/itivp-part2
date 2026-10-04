const AppError = require('../../../shared/errors/AppError');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false,
      convert: true,
    });

    if (error) {
      const details = error.details.map((item) => ({
        field: item.path.join('.'),
        message: item.message,
      }));
      return next(new AppError(400, 'VALIDATION_ERROR', 'Ошибка валидации данных', details));
    }

    req.validated = { ...(req.validated || {}), [source]: value };
    return next();
  };
}

module.exports = validate;

const Joi = require('joi');

const uuid = Joi.string().guid({ version: ['uuidv4'] });

function safeText(value, helpers) {
  if (/[<>]/.test(value)) {
    return helpers.error('string.html');
  }
  return value;
}

const text = (min, max) => Joi.string()
  .trim()
  .min(min)
  .max(max)
  .custom(safeText, 'HTML tag protection')
  .messages({ 'string.html': '{{#label}} не должно содержать символы < или >' });

module.exports = { Joi, uuid, text };


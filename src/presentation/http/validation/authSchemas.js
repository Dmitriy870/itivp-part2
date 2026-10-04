const { Joi } = require('./common');

const email = Joi.string().trim().lowercase().email().max(254).required();
const password = Joi.string()
  .min(8)
  .max(72)
  .pattern(/[A-Z]/, 'заглавная буква')
  .pattern(/[a-z]/, 'строчная буква')
  .pattern(/[0-9]/, 'цифра')
  .pattern(/[^A-Za-z0-9]/, 'специальный символ')
  .required()
  .messages({
    'string.pattern.name': 'password должен содержать как минимум: {#name}',
  });

const registerSchema = Joi.object({ email, password }).required();
const loginSchema = Joi.object({ email, password: Joi.string().max(200).required() }).required();

module.exports = { registerSchema, loginSchema };


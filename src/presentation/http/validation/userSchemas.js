const { Joi, uuid } = require('./common');
const { ROLES } = require('../../../domain/user/roles');

const userIdSchema = Joi.object({ id: uuid.required() }).required();
const roleSchema = Joi.object({
  role: Joi.string().valid(...Object.values(ROLES)).required(),
}).required();

module.exports = { userIdSchema, roleSchema };

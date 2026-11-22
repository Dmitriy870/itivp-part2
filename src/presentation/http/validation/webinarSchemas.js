const { Joi, uuid, text } = require('./common');

const webinarIdSchema = Joi.object({ id: uuid.required() }).required();
const managedWebinarSchema = Joi.object({ courseId: uuid.required(), id: uuid.required() }).required();
const webinarQuerySchema = Joi.object({ courseId: uuid.optional() }).required();
const webinarBodySchema = Joi.object({
  title: text(3, 180).required(),
  scheduledAt: Joi.date().iso().required(),
  durationMinutes: Joi.number().integer().min(15).max(480).required(),
  meetingUrl: Joi.string().trim().uri({ scheme: ['https'] }).max(500).required(),
}).required();

module.exports = { webinarQuerySchema, webinarIdSchema, managedWebinarSchema, webinarBodySchema };

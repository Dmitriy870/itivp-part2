const { Joi, uuid, text } = require('./common');
const { COURSE_FORMATS } = require('../../../domain/course/courseFormats');

const courseBodySchema = Joi.object({
  title: text(3, 160).required(),
  description: text(10, 5000).required(),
  category: text(2, 80).required(),
  format: Joi.string().valid(...COURSE_FORMATS).required(),
  durationHours: Joi.number().integer().min(1).max(10000).required(),
  price: Joi.number().precision(2).min(0).max(99999999).required(),
  certificateIssued: Joi.boolean().required(),
  webinarUrl: Joi.string().uri({ scheme: ['https'] }).max(500).allow(null).default(null),
  published: Joi.boolean().default(false),
}).required();

const courseIdSchema = Joi.object({ id: uuid.required() }).required();

const courseQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  category: text(1, 80),
  format: Joi.string().valid(...COURSE_FORMATS),
  published: Joi.boolean(),
}).required();

module.exports = { courseBodySchema, courseIdSchema, courseQuerySchema };

const { Joi, uuid } = require('./common');

const courseParamSchema = Joi.object({ courseId: uuid.required() }).required();
const lessonParamSchema = Joi.object({
  courseId: uuid.required(),
  lessonId: uuid.required(),
}).required();
const certificateParamSchema = Joi.object({
  number: Joi.string().trim().uppercase().pattern(/^CERT-\d{4}-[A-F0-9]{10}$/).required(),
}).required();
const webinarQuerySchema = Joi.object({ courseId: uuid.optional() }).required();

module.exports = {
  courseParamSchema,
  lessonParamSchema,
  certificateParamSchema,
  webinarQuerySchema,
};

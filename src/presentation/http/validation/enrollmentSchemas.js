const { Joi, uuid } = require('./common');

const enrollmentCourseSchema = Joi.object({ courseId: uuid.required() }).required();

module.exports = { enrollmentCourseSchema };

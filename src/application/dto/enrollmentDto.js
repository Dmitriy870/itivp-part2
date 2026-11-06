const { toIsoDate } = require('./dateDto');
const { toCourseDto } = require('./courseDto');

function toEnrollmentDto(enrollment) {
  const value = enrollment.get ? enrollment.get({ plain: true }) : enrollment;
  return {
    id: value.id,
    status: value.status,
    courseId: value.courseId,
    enrolledAt: toIsoDate(value.createdAt),
    course: value.course ? toCourseDto(value.course) : undefined,
  };
}

module.exports = { toEnrollmentDto };

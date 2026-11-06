const { toIsoDate } = require('./dateDto');

function toCertificateDto(certificate) {
  if (!certificate) return null;
  const value = certificate.get ? certificate.get({ plain: true }) : certificate;
  return {
    id: value.id,
    number: value.number,
    issuedAt: toIsoDate(value.issuedAt),
    courseId: value.courseId,
    courseTitle: value.course?.title,
    studentEmail: value.user?.email,
  };
}

function toWebinarDto(webinar) {
  const value = webinar.get ? webinar.get({ plain: true }) : webinar;
  return {
    id: value.id,
    title: value.title,
    courseId: value.courseId,
    courseTitle: value.course?.title,
    scheduledAt: toIsoDate(value.scheduledAt),
    durationMinutes: value.durationMinutes,
    meetingUrl: value.meetingUrl,
  };
}

module.exports = { toCertificateDto, toWebinarDto };

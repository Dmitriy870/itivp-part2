const { toIsoDate } = require('./dateDto');

function toCourseDto(course) {
  const value = course.get ? course.get({ plain: true }) : course;
  return {
    id: value.id,
    title: value.title,
    description: value.description,
    category: value.category,
    format: value.format,
    durationHours: value.durationHours,
    price: Number(value.price),
    certificateIssued: value.certificateIssued,
    webinarUrl: value.webinarUrl,
    published: value.published,
    createdBy: value.createdBy,
    author: value.author || undefined,
    createdAt: toIsoDate(value.createdAt),
    updatedAt: toIsoDate(value.updatedAt),
  };
}

module.exports = { toCourseDto };

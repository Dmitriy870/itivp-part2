const { Op } = require('sequelize');
const { Webinar, Course } = require('../models');

class WebinarRepository {
  findUpcoming(from, courseId) {
    const where = { scheduledAt: { [Op.gte]: from } };
    if (courseId) where.courseId = courseId;
    return Webinar.findAll({
      where,
      include: [{ model: Course, as: 'course' }],
      order: [['scheduledAt', 'ASC']],
      limit: 20,
    });
  }
}

module.exports = WebinarRepository;

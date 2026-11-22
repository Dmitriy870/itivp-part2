const { Op } = require('sequelize');
const { Webinar, Course } = require('../models');
const BaseRepository = require('./BaseRepository');

const publishedCourse = { model: Course, as: 'course', where: { published: true }, required: true };

class WebinarRepository extends BaseRepository {
  constructor() {
    super(Webinar);
  }

  findUpcoming(from, courseId) {
    const where = { scheduledAt: { [Op.gte]: from } };
    if (courseId) where.courseId = courseId;
    return Webinar.findAll({
      where,
      include: [publishedCourse],
      order: [['scheduledAt', 'ASC']],
      limit: 20,
    });
  }

  findPublicById(id) {
    return this.findById(id, { include: [publishedCourse] });
  }

  findForCourse(courseId) {
    return this.findAll({ where: { courseId }, order: [['scheduledAt', 'ASC'], ['id', 'ASC']] });
  }

  findCourseWebinar(courseId, id) {
    return Webinar.findOne({ where: { courseId, id } });
  }
}

module.exports = WebinarRepository;

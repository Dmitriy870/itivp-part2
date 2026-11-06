const BaseRepository = require('./BaseRepository');
const { Enrollment, Course } = require('../models');

class EnrollmentRepository extends BaseRepository {
  constructor() {
    super(Enrollment);
  }

  findForUser(userId) {
    return Enrollment.findAll({
      where: { userId },
      include: [{ model: Course, as: 'course' }],
      order: [['createdAt', 'DESC']],
    });
  }

  findForUserAndCourse(userId, courseId) {
    return Enrollment.findOne({ where: { userId, courseId } });
  }

  findDetailedById(id) {
    return Enrollment.findByPk(id, {
      include: [{ model: Course, as: 'course' }],
    });
  }
}

module.exports = EnrollmentRepository;

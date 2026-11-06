const { Op, UniqueConstraintError } = require('sequelize');
const {
  Enrollment,
  Lesson,
  LessonProgress,
  Certificate,
  Course,
  User,
} = require('../models');

class LearningRepository {
  findEnrollment(userId, courseId) {
    return Enrollment.findOne({ where: { userId, courseId } });
  }

  completeEnrollment(enrollment) {
    if (enrollment.status === 'completed') return enrollment;
    return enrollment.update({ status: 'completed' });
  }

  findLessons(courseId) {
    return Lesson.findAll({ where: { courseId }, order: [['position', 'ASC']] });
  }

  findLesson(id) {
    return Lesson.findByPk(id);
  }

  findCompleted(userId, lessonIds) {
    if (lessonIds.length === 0) return [];
    return LessonProgress.findAll({
      where: { userId, lessonId: { [Op.in]: lessonIds } },
    });
  }

  async completeLesson(userId, lessonId, completedAt) {
    const existing = await LessonProgress.findOne({ where: { userId, lessonId } });
    if (existing) return existing;
    try {
      return await LessonProgress.create({ userId, lessonId, completedAt });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        return LessonProgress.findOne({ where: { userId, lessonId } });
      }
      throw error;
    }
  }

  findCertificate(userId, courseId) {
    return Certificate.findOne({ where: { userId, courseId } });
  }

  createCertificate(values) {
    return Certificate.create(values);
  }

  findCertificatesForUser(userId) {
    return Certificate.findAll({
      where: { userId },
      include: [{ model: Course, as: 'course' }],
      order: [['issuedAt', 'DESC']],
    });
  }

  findCertificateByNumber(number) {
    return Certificate.findOne({
      where: { number },
      include: [
        { model: Course, as: 'course' },
        { model: User, as: 'user', attributes: ['id', 'email'] },
      ],
    });
  }
}

module.exports = LearningRepository;

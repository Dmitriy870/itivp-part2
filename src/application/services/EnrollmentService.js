const AppError = require('../../shared/errors/AppError');
const { toEnrollmentDto } = require('../dto/enrollmentDto');

class EnrollmentService {
  constructor({ enrollmentRepository, courseRepository }) {
    this.enrollmentRepository = enrollmentRepository;
    this.courseRepository = courseRepository;
  }

  async listForUser(userId) {
    const enrollments = await this.enrollmentRepository.findForUser(userId);
    return enrollments.map(toEnrollmentDto);
  }

  async enroll(userId, courseId) {
    const course = await this.courseRepository.findById(courseId);
    if (!course || !course.published) {
      throw new AppError(404, 'COURSE_NOT_FOUND', 'Курс не найден');
    }

    const existing = await this.enrollmentRepository.findForUserAndCourse(userId, courseId);
    if (existing) {
      throw new AppError(409, 'ALREADY_ENROLLED', 'Вы уже записаны на этот курс');
    }

    const enrollment = await this.enrollmentRepository.create({ userId, courseId });
    const detailedEnrollment = await this.enrollmentRepository.findDetailedById(enrollment.id);
    return toEnrollmentDto(detailedEnrollment);
  }

  async cancel(userId, courseId) {
    const enrollment = await this.enrollmentRepository.findForUserAndCourse(userId, courseId);
    if (!enrollment) {
      throw new AppError(404, 'ENROLLMENT_NOT_FOUND', 'Запись на курс не найдена');
    }
    if (enrollment.status === 'completed') {
      throw new AppError(409, 'COURSE_ALREADY_COMPLETED', 'Завершённую программу нельзя отменить');
    }
    await enrollment.destroy();
  }
}

module.exports = EnrollmentService;

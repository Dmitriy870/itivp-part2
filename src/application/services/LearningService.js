const AppError = require('../../shared/errors/AppError');
const { toCertificateDto } = require('../dto/learningDto');

class LearningService {
  constructor({ learningRepository, courseRepository, clock, idGenerator }) {
    this.learningRepository = learningRepository;
    this.courseRepository = courseRepository;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  async getPlan(userId, courseId) {
    await this.requireEnrollment(userId, courseId);
    const course = await this.courseRepository.findById(courseId);
    const lessons = await this.learningRepository.findLessons(courseId);
    const completed = await this.learningRepository.findCompleted(userId, lessons.map((item) => item.id));
    const completedIds = new Set(completed.map((item) => item.lessonId));
    const certificate = await this.learningRepository.findCertificate(userId, courseId);

    return {
      course: { id: course.id, title: course.title },
      lessons: lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        position: lesson.position,
        durationMinutes: lesson.durationMinutes,
        completed: completedIds.has(lesson.id),
      })),
      progress: progressDto(completedIds.size, lessons.length),
      certificate: toCertificateDto(certificate),
    };
  }

  async completeLesson(userId, courseId, lessonId) {
    await this.requireEnrollment(userId, courseId);
    const lesson = await this.learningRepository.findLesson(lessonId);
    if (!lesson || String(lesson.courseId) !== String(courseId)) {
      throw new AppError(404, 'LESSON_NOT_FOUND', 'Занятие не найдено');
    }
    await this.learningRepository.completeLesson(userId, lessonId, this.clock.now());

    const lessons = await this.learningRepository.findLessons(courseId);
    const completed = await this.learningRepository.findCompleted(userId, lessons.map((item) => item.id));
    let certificate = await this.learningRepository.findCertificate(userId, courseId);
    if (lessons.length > 0 && completed.length === lessons.length && !certificate) {
      certificate = await this.learningRepository.createCertificate({
        userId,
        courseId,
        number: certificateNumber(this.clock.now(), this.idGenerator.newId()),
        issuedAt: this.clock.now(),
      });
    }
    return {
      progress: progressDto(completed.length, lessons.length),
      certificate: toCertificateDto(certificate),
    };
  }

  async listCertificates(userId) {
    const certificates = await this.learningRepository.findCertificatesForUser(userId);
    return certificates.map(toCertificateDto);
  }

  async verifyCertificate(number) {
    const certificate = await this.learningRepository.findCertificateByNumber(number.toUpperCase());
    if (!certificate) throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Сертификат не найден');
    return { valid: true, ...toCertificateDto(certificate) };
  }

  async requireEnrollment(userId, courseId) {
    const enrollment = await this.learningRepository.findEnrollment(userId, courseId);
    if (!enrollment) throw new AppError(403, 'ENROLLMENT_REQUIRED', 'Сначала запишитесь на курс');
    return enrollment;
  }
}

function progressDto(completed, total) {
  return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

function certificateNumber(date, id) {
  return `CERT-${date.getUTCFullYear()}-${id.replaceAll('-', '').slice(0, 10).toUpperCase()}`;
}

module.exports = LearningService;

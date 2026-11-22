const { toWebinarDto } = require('../dto/learningDto');
const AppError = require('../../shared/errors/AppError');
const { canManageCourse } = require('../../domain/course/coursePermissions');

const MINUTE_MS = 60_000;
const JOIN_LEAD_MINUTES = 10;

class WebinarService {
  constructor({ webinarRepository, courseRepository, clock }) {
    this.webinarRepository = webinarRepository;
    this.courseRepository = courseRepository;
    this.clock = clock;
  }

  async listUpcoming(courseId) {
    const webinars = await this.webinarRepository.findUpcoming(this.clock.now(), courseId);
    return webinars.map((webinar) => ({ ...toWebinarDto(webinar), meetingUrl: null }));
  }

  async getPublic(id) {
    const webinar = await this.webinarRepository.findPublicById(id);
    if (!webinar) throw new AppError(404, 'WEBINAR_NOT_FOUND', 'Вебинар не найден');
    const now = this.clock.now().getTime();
    const startsAt = webinar.scheduledAt.getTime();
    const canJoin = now >= startsAt - JOIN_LEAD_MINUTES * MINUTE_MS
      && now < startsAt + webinar.durationMinutes * MINUTE_MS;
    return { ...toWebinarDto(webinar), meetingUrl: canJoin ? webinar.meetingUrl : null };
  }

  async listManaged(courseId, actor) {
    await this.requireManager(courseId, actor);
    return (await this.webinarRepository.findForCourse(courseId)).map(toWebinarDto);
  }

  async create(courseId, input, actor) {
    await this.requireManager(courseId, actor);
    this.requireFuture(input.scheduledAt);
    return toWebinarDto(await this.webinarRepository.create({ ...input, courseId }));
  }

  async update(courseId, id, input, actor) {
    await this.requireManager(courseId, actor);
    const webinar = await this.requireWebinar(courseId, id);
    if (input.scheduledAt.getTime() !== webinar.scheduledAt.getTime()) this.requireFuture(input.scheduledAt);
    return toWebinarDto(await webinar.update(input));
  }

  async remove(courseId, id, actor) {
    await this.requireManager(courseId, actor);
    const webinar = await this.requireWebinar(courseId, id);
    await webinar.destroy();
  }

  async requireManager(courseId, actor) {
    const course = await this.courseRepository.findById(courseId);
    if (!course || (!course.published && !canManageCourse(course, actor))) {
      throw new AppError(404, 'COURSE_NOT_FOUND', 'Курс не найден');
    }
    if (!canManageCourse(course, actor)) {
      throw new AppError(403, 'WEBINAR_MANAGEMENT_FORBIDDEN', 'Вебинарами может управлять автор курса или администратор');
    }
  }

  async requireWebinar(courseId, id) {
    const webinar = await this.webinarRepository.findCourseWebinar(courseId, id);
    if (!webinar) throw new AppError(404, 'WEBINAR_NOT_FOUND', 'Вебинар не найден в этом курсе');
    return webinar;
  }

  requireFuture(date) {
    if (date <= this.clock.now()) {
      throw new AppError(400, 'WEBINAR_DATE_IN_PAST', 'Укажите дату и время в будущем');
    }
  }
}

module.exports = WebinarService;

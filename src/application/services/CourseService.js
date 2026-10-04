const AppError = require('../../shared/errors/AppError');
const { toCourseDto } = require('../dto/courseDto');

class CourseService {
  constructor({ courseRepository }) {
    this.courseRepository = courseRepository;
  }

  async list(filters) {
    const result = await this.courseRepository.findPage(filters);
    return {
      items: result.rows.map(toCourseDto),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.count,
        pages: Math.ceil(result.count / filters.limit),
      },
    };
  }

  async getById(id) {
    const course = await this.courseRepository.findDetailedById(id);
    if (!course) throw new AppError(404, 'COURSE_NOT_FOUND', 'Курс не найден');
    return toCourseDto(course);
  }

  async create(input, userId) {
    const course = await this.courseRepository.create({ ...input, createdBy: userId });
    return toCourseDto(course);
  }

  async update(id, input) {
    const course = await this.courseRepository.updateById(id, input);
    if (!course) throw new AppError(404, 'COURSE_NOT_FOUND', 'Курс не найден');
    return toCourseDto(course);
  }

  async remove(id) {
    const removed = await this.courseRepository.deleteById(id);
    if (!removed) throw new AppError(404, 'COURSE_NOT_FOUND', 'Курс не найден');
  }
}

module.exports = CourseService;

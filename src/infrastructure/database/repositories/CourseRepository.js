const { Op } = require('sequelize');
const BaseRepository = require('./BaseRepository');
const { Course, User } = require('../models');

class CourseRepository extends BaseRepository {
  constructor() {
    super(Course);
  }

  findPage({ page, limit, category, format, published }) {
    const where = {};
    if (category) where.category = { [Op.iLike]: `%${category}%` };
    if (format) where.format = format;
    if (published !== undefined) where.published = published;

    return Course.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'author', attributes: ['id', 'email'] }],
    });
  }

  findDetailedById(id) {
    return Course.findByPk(id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'email'] }],
    });
  }
}

module.exports = CourseRepository;

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  findById(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  findAll(options = {}) {
    return this.model.findAll(options);
  }

  create(values, options = {}) {
    return this.model.create(values, options);
  }

  async updateById(id, values, options = {}) {
    const entity = await this.findById(id, options);
    if (!entity) return null;
    return entity.update(values, options);
  }

  async deleteById(id, options = {}) {
    const entity = await this.findById(id, options);
    if (!entity) return false;
    await entity.destroy(options);
    return true;
  }
}

module.exports = BaseRepository;


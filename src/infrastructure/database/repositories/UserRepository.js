const BaseRepository = require('./BaseRepository');
const { User } = require('../models');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  findByEmailWithSecrets(email) {
    return User.scope('withSecrets').findOne({ where: { email: email.toLowerCase() } });
  }

  findByIdWithSecrets(id) {
    return User.scope('withSecrets').findByPk(id);
  }
}

module.exports = UserRepository;

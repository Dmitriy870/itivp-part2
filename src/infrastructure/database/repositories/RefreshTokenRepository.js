const BaseRepository = require('./BaseRepository');
const { RefreshToken } = require('../models');

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super(RefreshToken);
  }

  findByTokenId(id) {
    return RefreshToken.findByPk(id);
  }

  revokeAllForUser(userId, revokedAt) {
    return RefreshToken.update(
      { revokedAt },
      { where: { userId, revokedAt: null } },
    );
  }
}

module.exports = RefreshTokenRepository;

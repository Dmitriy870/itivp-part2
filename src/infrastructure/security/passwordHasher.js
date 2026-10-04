const bcrypt = require('bcrypt');

const PASSWORD_COST = 12;
const DUMMY_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

class PasswordHasher {
  hash(password) {
    return bcrypt.hash(password, PASSWORD_COST);
  }

  compare(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
  }

  compareWithDummy(password) {
    return bcrypt.compare(password, DUMMY_HASH);
  }
}

module.exports = new PasswordHasher();


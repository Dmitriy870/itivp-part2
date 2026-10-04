const crypto = require('node:crypto');

class IdGenerator {
  newId() {
    return crypto.randomUUID();
  }
}

module.exports = new IdGenerator();


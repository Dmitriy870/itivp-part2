const AppError = require('../../shared/errors/AppError');
const { toUserDto } = require('../dto/userDto');

class UserService {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async list() {
    const users = await this.userRepository.findAll({ order: [['createdAt', 'DESC']] });
    return users.map(toUserDto);
  }

  async changeRole(id, role, actorId) {
    if (id === actorId) {
      throw new AppError(400, 'SELF_ROLE_CHANGE', 'Нельзя изменить собственную роль');
    }
    const user = await this.userRepository.updateById(id, { role });
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Пользователь не найден');
    return toUserDto(user);
  }

  async remove(id, actorId) {
    if (id === actorId) {
      throw new AppError(400, 'SELF_DELETE', 'Нельзя удалить собственную учётную запись');
    }
    const removed = await this.userRepository.deleteById(id);
    if (!removed) throw new AppError(404, 'USER_NOT_FOUND', 'Пользователь не найден');
  }
}

module.exports = UserService;

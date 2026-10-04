const { toIsoDate } = require('./dateDto');

function toUserDto(user) {
  const value = user.get ? user.get({ plain: true }) : user;
  return {
    id: value.id,
    email: value.email,
    role: value.role,
    createdAt: toIsoDate(value.createdAt),
    updatedAt: toIsoDate(value.updatedAt),
  };
}

module.exports = { toUserDto };

const { ROLES } = require('../user/roles');

function canManageCourse(course, actor) {
  return Boolean(actor && (actor.role === ROLES.ADMIN || String(course.createdBy) === String(actor.id)));
}

module.exports = { canManageCourse };

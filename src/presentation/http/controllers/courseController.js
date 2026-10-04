function createCourseController(courseService) {
  async function list(req, res) {
  const result = await courseService.list(req.validated.query);
  res.json({ data: result.items, pagination: result.pagination });
  }

  async function getById(req, res) {
  const course = await courseService.getById(req.validated.params.id);
  res.json({ data: course });
  }

  async function create(req, res) {
  const course = await courseService.create(req.validated.body, req.user.id);
  res.status(201).location(`/courses/${course.id}`).json({ data: course });
  }

  async function update(req, res) {
  const course = await courseService.update(req.validated.params.id, req.validated.body);
  res.json({ data: course });
  }

  async function remove(req, res) {
  await courseService.remove(req.validated.params.id);
  res.status(204).send();
  }

  return { list, getById, create, update, remove };
}

module.exports = createCourseController;

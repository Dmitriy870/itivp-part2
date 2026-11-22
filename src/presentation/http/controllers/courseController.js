function createCourseController(courseService) {
  async function list(req, res) {
    const filters = req.validated.query;
    if (filters.published === false) {
      return res.json({ data: [], pagination: { page: filters.page, limit: filters.limit, total: 0, pages: 0 } });
    }
    const result = await courseService.list({ ...filters, published: true });
    return res.json({ data: result.items, pagination: result.pagination });
  }

  async function listMine(req, res) {
    const result = await courseService.list({ ...req.validated.query, createdBy: req.user.id });
    res.json({ data: result.items, pagination: result.pagination });
  }

  async function getById(req, res) {
  const course = await courseService.getById(req.validated.params.id, req.user);
  res.json({ data: course });
  }

  async function create(req, res) {
  const course = await courseService.create(req.validated.body, req.user.id);
  res.status(201).location(`/courses/${course.id}`).json({ data: course });
  }

  async function update(req, res) {
  const course = await courseService.update(
  req.validated.params.id,
  req.validated.body,
  { id: req.user.id, role: req.user.role },
  );
  res.json({ data: course });
  }

  async function remove(req, res) {
  await courseService.remove(req.validated.params.id);
  res.status(204).send();
  }

  return { list, listMine, getById, create, update, remove };
}

module.exports = createCourseController;

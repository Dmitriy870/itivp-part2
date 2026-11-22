function createWebinarController(webinarService) {
  async function list(req, res) {
    const webinars = await webinarService.listUpcoming(req.validated.query.courseId);
    res.json({ data: webinars });
  }

  async function getById(req, res) {
    res.json({ data: await webinarService.getPublic(req.validated.params.id) });
  }

  async function listManaged(req, res) {
    res.json({ data: await webinarService.listManaged(req.validated.params.courseId, req.user) });
  }

  async function create(req, res) {
    const webinar = await webinarService.create(req.validated.params.courseId, req.validated.body, req.user);
    res.status(201).json({ data: webinar });
  }

  async function update(req, res) {
    const { courseId, id } = req.validated.params;
    const webinar = await webinarService.update(courseId, id, req.validated.body, req.user);
    res.json({ data: webinar });
  }

  async function remove(req, res) {
    const { courseId, id } = req.validated.params;
    await webinarService.remove(courseId, id, req.user);
    res.status(204).end();
  }

  return { list, getById, listManaged, create, update, remove };
}

module.exports = createWebinarController;

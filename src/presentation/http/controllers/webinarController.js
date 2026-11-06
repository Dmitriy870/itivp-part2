function createWebinarController(webinarService) {
  async function list(req, res) {
    const webinars = await webinarService.listUpcoming(req.validated.query.courseId);
    res.json({ data: webinars });
  }

  return { list };
}

module.exports = createWebinarController;

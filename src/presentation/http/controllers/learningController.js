function createLearningController(learningService) {
  async function plan(req, res) {
    const result = await learningService.getPlan(req.user.id, req.validated.params.courseId);
    res.json({ data: result });
  }

  async function completeLesson(req, res) {
    const result = await learningService.completeLesson(
      req.user.id,
      req.validated.params.courseId,
      req.validated.params.lessonId,
    );
    res.json({ data: result });
  }

  async function certificates(req, res) {
    const result = await learningService.listCertificates(req.user.id);
    res.json({ data: result });
  }

  async function verifyCertificate(req, res) {
    const result = await learningService.verifyCertificate(req.validated.params.number);
    res.json({ data: result });
  }

  return { plan, completeLesson, certificates, verifyCertificate };
}

module.exports = createLearningController;

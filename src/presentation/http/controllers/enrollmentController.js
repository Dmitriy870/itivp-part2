function createEnrollmentController(enrollmentService) {
  async function listMine(req, res) {
    const enrollments = await enrollmentService.listForUser(req.user.id);
    res.json({ data: enrollments });
  }

  async function enroll(req, res) {
    const enrollment = await enrollmentService.enroll(
      req.user.id,
      req.validated.params.courseId,
    );
    res.status(201).json({ data: enrollment });
  }

  async function cancel(req, res) {
    await enrollmentService.cancel(req.user.id, req.validated.params.courseId);
    res.status(204).send();
  }

  return { listMine, enroll, cancel };
}

module.exports = createEnrollmentController;

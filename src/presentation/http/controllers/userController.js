function createUserController(userService) {
  async function list(req, res) {
  const users = await userService.list();
  res.json({ data: users });
  }

  async function changeRole(req, res) {
  const user = await userService.changeRole(
    req.validated.params.id,
    req.validated.body.role,
    req.user.id,
  );
  res.json({ data: user });
  }

  async function remove(req, res) {
  await userService.remove(req.validated.params.id, req.user.id);
  res.status(204).send();
  }

  return { list, changeRole, remove };
}

module.exports = createUserController;

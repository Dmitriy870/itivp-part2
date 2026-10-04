process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-different-and-32-characters';
process.env.CORS_ORIGINS = 'http://allowed.example';

const { after, before, beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const createApp = require('../src/presentation/http/app');
const { createContainer } = require('../src/main/container');
const { sequelize, User, Course, RefreshToken } = require('../src/infrastructure/database/models');
const { ROLES } = require('../src/domain/user/roles');

const app = createApp(createContainer());

let server;
let baseUrl;
let users;

before(async () => {
  await sequelize.sync({ force: true });
  await new Promise((resolve, reject) => {
    server = app.listen(0, '127.0.0.1', (error) => (error ? reject(error) : resolve()));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => {
  await RefreshToken.destroy({ where: {}, force: true });
  await Course.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
  users = {
    user: await createUser('user@example.com', 'User123!', ROLES.USER),
    moderator: await createUser('moderator@example.com', 'Moderator123!', ROLES.MODERATOR),
    admin: await createUser('admin@example.com', 'Admin123!', ROLES.ADMIN),
  };
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
  await sequelize.close();
});

test('Helmet устанавливает CSP и X-Frame-Options DENY', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('x-powered-by'), null);
});

test('регистрация создаёт только user и блокирует mass assignment роли', async () => {
  const attackResponse = await jsonRequest('/auth/register', {
    method: 'POST',
    body: { email: 'attacker@example.com', password: 'Strong123!', role: 'admin' },
  });
  assert.equal(attackResponse.status, 400);

  const response = await jsonRequest('/auth/register', {
    method: 'POST',
    body: { email: 'student@example.com', password: 'Strong123!' },
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.data.role, 'user');
  assert.equal(body.data.passwordHash, undefined);
  assert.match(body.data.id, /^[0-9a-f-]{36}$/i);
  assert.match(body.data.createdAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('слабый пароль и неверный Content-Type возвращают 400 и 415', async () => {
  const weakPassword = await jsonRequest('/auth/register', {
    method: 'POST',
    body: { email: 'weak@example.com', password: 'password' },
  });
  assert.equal(weakPassword.status, 400);

  const wrongType = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: '{}',
  });
  assert.equal(wrongType.status, 415);
});

test('login выдаёт access JWT, refresh cookie и открывает /auth/me', async () => {
  const login = await loginAs('user@example.com', 'User123!');
  assert.equal(login.response.status, 200);
  assert.ok(login.accessToken);
  assert.match(login.cookie, /HttpOnly/i);
  assert.match(login.cookie, /SameSite=Strict/i);

  const me = await fetch(`${baseUrl}/auth/me`, {
    headers: { authorization: `Bearer ${login.accessToken}` },
  });
  const body = await me.json();
  assert.equal(me.status, 200);
  assert.equal(body.data.email, 'user@example.com');
});

test('refresh-токен ротируется, повторное использование отзывает сессию', async () => {
  const login = await loginAs('user@example.com', 'User123!');
  const oldCookie = cookiePair(login.cookie);

  const refresh = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { cookie: oldCookie },
  });
  assert.equal(refresh.status, 200);
  assert.notEqual(cookiePair(refresh.headers.get('set-cookie')), oldCookie);

  const reuse = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { cookie: oldCookie },
  });
  assert.equal(reuse.status, 401);
  assert.equal((await reuse.json()).error.code, 'REFRESH_TOKEN_REUSED');
});

test('пять неверных паролей блокируют аккаунт на 15 минут', async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await jsonRequest('/auth/login', {
      method: 'POST',
      body: { email: 'user@example.com', password: 'Wrong123!' },
    });
    assert.equal(response.status, 401);
  }

  const blocked = await jsonRequest('/auth/login', {
    method: 'POST',
    body: { email: 'user@example.com', password: 'User123!' },
  });
  assert.equal(blocked.status, 423);
  assert.equal((await blocked.json()).error.code, 'ACCOUNT_LOCKED');
});

test('user не может создать курс, moderator может, admin может удалить', async () => {
  const userLogin = await loginAs('user@example.com', 'User123!');
  const denied = await jsonRequest('/courses', {
    method: 'POST',
    token: userLogin.accessToken,
    body: coursePayload(),
  });
  assert.equal(denied.status, 403);

  const moderatorLogin = await loginAs('moderator@example.com', 'Moderator123!');
  const created = await jsonRequest('/courses', {
    method: 'POST',
    token: moderatorLogin.accessToken,
    body: coursePayload(),
  });
  const createdBody = await created.json();
  assert.equal(created.status, 201);
  assert.equal(createdBody.data.createdBy, users.moderator.id);

  const moderatorDelete = await fetch(`${baseUrl}/courses/${createdBody.data.id}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${moderatorLogin.accessToken}` },
  });
  assert.equal(moderatorDelete.status, 403);

  const adminLogin = await loginAs('admin@example.com', 'Admin123!');
  const removed = await fetch(`${baseUrl}/courses/${createdBody.data.id}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${adminLogin.accessToken}` },
  });
  assert.equal(removed.status, 204);
});

test('CRUD курсов валидирует UUID, query и входные поля', async () => {
  const moderatorLogin = await loginAs('moderator@example.com', 'Moderator123!');
  const created = await jsonRequest('/courses', {
    method: 'POST',
    token: moderatorLogin.accessToken,
    body: coursePayload(),
  });
  const course = (await created.json()).data;

  const list = await fetch(`${baseUrl}/courses?page=1&limit=10&format=online&published=true`);
  assert.equal(list.status, 200);
  assert.equal((await list.json()).pagination.total, 1);

  const injection = encodeURIComponent("%' OR 1=1 --");
  const injectionAttempt = await fetch(`${baseUrl}/courses?category=${injection}`);
  assert.equal(injectionAttempt.status, 200);
  assert.equal((await injectionAttempt.json()).pagination.total, 0);

  const detail = await fetch(`${baseUrl}/courses/${course.id}`);
  assert.equal(detail.status, 200);

  const updated = await jsonRequest(`/courses/${course.id}`, {
    method: 'PUT',
    token: moderatorLogin.accessToken,
    body: { ...coursePayload(), title: 'Обновлённый безопасный REST API' },
  });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).data.title, 'Обновлённый безопасный REST API');

  const invalidId = await fetch(`${baseUrl}/courses/1`);
  assert.equal(invalidId.status, 400);

  const htmlInput = await jsonRequest('/courses', {
    method: 'POST',
    token: moderatorLogin.accessToken,
    body: { ...coursePayload(), title: '<script>alert(1)</script>' },
  });
  assert.equal(htmlInput.status, 400);
});

test('только admin управляет пользователями, секретные поля не выдаются', async () => {
  const userLogin = await loginAs('user@example.com', 'User123!');
  const denied = await fetch(`${baseUrl}/users`, {
    headers: { authorization: `Bearer ${userLogin.accessToken}` },
  });
  assert.equal(denied.status, 403);

  const adminLogin = await loginAs('admin@example.com', 'Admin123!');
  const list = await fetch(`${baseUrl}/users`, {
    headers: { authorization: `Bearer ${adminLogin.accessToken}` },
  });
  const listBody = await list.json();
  assert.equal(list.status, 200);
  assert.equal(listBody.data.length, 3);
  assert.equal(listBody.data[0].passwordHash, undefined);

  const changed = await jsonRequest(`/users/${users.user.id}/role`, {
    method: 'PUT',
    token: adminLogin.accessToken,
    body: { role: 'moderator' },
  });
  assert.equal(changed.status, 200);
  assert.equal((await changed.json()).data.role, 'moderator');
});

test('CORS отклоняет origin вне белого списка', async () => {
  const allowed = await fetch(`${baseUrl}/health`, { headers: { origin: 'http://allowed.example' } });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://allowed.example');

  const denied = await fetch(`${baseUrl}/health`, { headers: { origin: 'http://evil.example' } });
  assert.equal(denied.status, 403);
});

async function createUser(email, password, role) {
  return User.scope('withSecrets').create({
    email,
    passwordHash: await bcrypt.hash(password, 4),
    role,
  });
}

async function loginAs(email, password) {
  const response = await jsonRequest('/auth/login', { method: 'POST', body: { email, password } });
  const body = await response.json();
  return {
    response,
    accessToken: body.data?.accessToken,
    cookie: response.headers.get('set-cookie'),
  };
}

function jsonRequest(path, { method, body, token }) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  return fetch(`${baseUrl}${path}`, { method, headers, body: JSON.stringify(body) });
}

function cookiePair(setCookie) {
  return setCookie.split(';', 1)[0];
}

function coursePayload() {
  return {
    title: 'Безопасная разработка REST API',
    description: 'Программа профессиональной переподготовки по безопасности серверных приложений.',
    category: 'Информационные технологии',
    format: 'online',
    durationHours: 420,
    price: 1750,
    certificateIssued: true,
    webinarUrl: 'https://webinars.example.com/secure-api',
    published: true,
  };
}

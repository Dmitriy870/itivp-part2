const { toUserDto } = require('../../../application/dto/userDto');

const REFRESH_COOKIE = 'refreshToken';

function createAuthController(authService) {
  async function register(req, res) {
    const user = await authService.register(req.validated.body);
    res.status(201).json({ data: user });
  }

  async function login(req, res) {
  const result = await authService.login(req.validated.body, requestMeta(req));
  setRefreshCookie(res, result.refreshToken);
  res.json({ data: { user: result.user, accessToken: result.accessToken } });
  }

  async function refresh(req, res) {
  const result = await authService.refresh(req.cookies[REFRESH_COOKIE], requestMeta(req));
  setRefreshCookie(res, result.refreshToken);
  res.json({ data: { user: result.user, accessToken: result.accessToken } });
  }

  async function logout(req, res) {
  await authService.logout(req.cookies[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  res.status(204).send();
  }

  async function me(req, res) {
    res.json({ data: toUserDto(req.user) });
  }

  return { register, login, refresh, logout, me };
}

function requestMeta(req) {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent')?.slice(0, 500),
  };
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/auth',
    maxAge: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60 * 1000,
  };
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, cookieOptions());
}

function clearRefreshCookie(res) {
  const options = cookieOptions();
  delete options.maxAge;
  res.clearCookie(REFRESH_COOKIE, options);
}

module.exports = createAuthController;

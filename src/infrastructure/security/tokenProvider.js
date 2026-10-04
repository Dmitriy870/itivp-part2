const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const clock = require('../../shared/time/clock');

const ACCESS_SECRET = () => process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = () => process.env.JWT_REFRESH_SECRET;

function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role, type: 'access' },
    ACCESS_SECRET(),
    { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m', issuer: 'training-platform-api' },
  );
}

function signRefreshToken(user, tokenId) {
  const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);
  return jwt.sign(
    { sub: String(user.id), jti: tokenId, type: 'refresh' },
    REFRESH_SECRET(),
    { expiresIn: `${days}d`, issuer: 'training-platform-api' },
  );
}

function verifyAccessToken(token) {
  const payload = jwt.verify(token, ACCESS_SECRET(), { issuer: 'training-platform-api' });
  if (payload.type !== 'access') throw new jwt.JsonWebTokenError('Wrong token type');
  return payload;
}

function verifyRefreshToken(token) {
  const payload = jwt.verify(token, REFRESH_SECRET(), { issuer: 'training-platform-api' });
  if (payload.type !== 'refresh') throw new jwt.JsonWebTokenError('Wrong token type');
  return payload;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshExpiryDate() {
  const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);
  return clock.addDays(clock.now(), days);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  refreshExpiryDate,
};

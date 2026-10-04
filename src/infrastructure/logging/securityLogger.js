const fs = require('node:fs');
const path = require('node:path');
const clock = require('../../shared/time/clock');

const logDirectory = path.join(__dirname, '../../../logs');
const logFile = path.join(logDirectory, 'security.log');

function securityLog(event, details = {}) {
  const entry = {
    timestamp: clock.now().toISOString(),
    event,
    ...redact(details),
  };
  const line = JSON.stringify(entry);

  console.warn(`[SECURITY] ${line}`);

  if (process.env.NODE_ENV !== 'test') {
    fs.mkdirSync(logDirectory, { recursive: true });
    fs.appendFileSync(logFile, `${line}\n`, { encoding: 'utf8', mode: 0o600 });
  }
}

function redact(value) {
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(redact);

  return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => {
    if (/password|token|authorization|cookie/i.test(key)) return [key, '[REDACTED]'];
    return [key, typeof nestedValue === 'object' ? redact(nestedValue) : nestedValue];
  }));
}

module.exports = { securityLog };

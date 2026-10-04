function toIsoDate(value) {
  if (value === null || value === undefined) return value;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

module.exports = { toIsoDate };


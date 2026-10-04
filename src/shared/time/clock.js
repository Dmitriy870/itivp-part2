class Clock {
  now() {
    return new Date();
  }

  addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }
}

module.exports = new Clock();


const minuteMs = 60_000;
const dateFormatter = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short' });

export function formatWebinarDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function toLocalDateTime(value: string) {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * minuteMs;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function webinarWindow(scheduledAt: string, durationMinutes: number) {
  const startsAt = new Date(scheduledAt).getTime();
  return {
    startsAt,
    opensAt: startsAt - 10 * minuteMs,
    endsAt: startsAt + durationMinutes * minuteMs,
  };
}

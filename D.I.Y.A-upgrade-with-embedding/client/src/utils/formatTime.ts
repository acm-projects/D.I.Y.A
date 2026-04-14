export function formatTimeToCST(value?: string | null): string {
  const normalized = value?.trim();

  if (!normalized) {
    return "Time unavailable CST";
  }

  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return `${normalized} CST`;
  }

  const [, hourText, minuteText] = match;
  const hours = Number(hourText);
  const minutes = Number(minuteText);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return `${normalized} CST`;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  const displayMinutes = minuteText.padStart(2, "0");

  return `${displayHour}:${displayMinutes} ${period} CST`;
}

export function formatTimeRangeToCST(startTime?: string | null, endTime?: string | null): string {
  const formattedStart = formatTimeToCST(startTime);
  const normalizedEnd = endTime?.trim();

  if (!normalizedEnd) {
    return formattedStart;
  }

  return `${formattedStart} to ${formatTimeToCST(normalizedEnd)}`;
}

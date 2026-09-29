const TIME_FORMAT = { hour: "2-digit", minute: "2-digit" };

// "03:15 PM" today, "Yesterday 03:15 PM", otherwise the locale date.
export function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], TIME_FORMAT);
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString([], TIME_FORMAT)}`;
  }
  return date.toLocaleDateString();
}

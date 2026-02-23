/**
 * Formats an ISO timestamp into a human-readable relative string
 * (e.g. "Just now", "3 minutes ago", "2 days ago").
 * @param timestamp - ISO 8601 date string, or null
 * @returns Human-readable relative time, or "Never" if null
 */
export function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return "Never";
  const seconds = Math.floor(
    (Date.now() - new Date(timestamp).getTime()) / 1000
  );
  if (seconds < 0) return "Just now";
  if (seconds < 60) return "Just now";
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return minutes + " minute" + (minutes > 1 ? "s" : "") + " ago";
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return hours + " hour" + (hours > 1 ? "s" : "") + " ago";
  }
  const days = Math.floor(seconds / 86400);
  return days + " day" + (days > 1 ? "s" : "") + " ago";
}

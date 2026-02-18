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
    const m = Math.floor(seconds / 60);
    return m + " minute" + (m > 1 ? "s" : "") + " ago";
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    return h + " hour" + (h > 1 ? "s" : "") + " ago";
  }
  const d = Math.floor(seconds / 86400);
  return d + " day" + (d > 1 ? "s" : "") + " ago";
}

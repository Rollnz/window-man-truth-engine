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

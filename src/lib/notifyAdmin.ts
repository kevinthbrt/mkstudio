/**
 * Send a push notification to all subscribed admins.
 * Call from server-side API routes. Fire-and-forget (non-blocking).
 */
export function notifyAdmin(title: string, message: string, url?: string): void {
  const secret = process.env.INTERNAL_API_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (!secret) return;

  fetch(`${siteUrl}/api/notifications/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": secret,
    },
    body: JSON.stringify({ title, message, url }),
  }).catch(() => {});
}

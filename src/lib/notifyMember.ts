import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification } from "@/lib/push";

/**
 * Send a push notification to a specific member (by auth user_id).
 * Call from server-side API routes. Fire-and-forget (non-blocking).
 */
export function notifyMember(
  userId: string,
  title: string,
  message: string,
  url?: string
): void {
  (async () => {
    try {
      const adminClient = createAdminClient();
      const { data: subscriptions } = await adminClient
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId);

      if (!subscriptions || subscriptions.length === 0) return;

      const results = await Promise.allSettled(
        subscriptions.map((sub) =>
          sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            { title, body: message, url }
          )
        )
      );

      // Clean up expired subscriptions (HTTP 410)
      const expired = results
        .map((r, i) => ({ r, sub: subscriptions[i] }))
        .filter(({ r }) => r.status === "rejected" && (r.reason as any)?.statusCode === 410)
        .map(({ sub }) => sub.endpoint);

      if (expired.length > 0) {
        await adminClient
          .from("push_subscriptions")
          .delete()
          .in("endpoint", expired);
      }
    } catch {
      // Fire-and-forget: never throw
    }
  })();
}

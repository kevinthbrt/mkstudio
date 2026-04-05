import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification } from "@/lib/push";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Internal-only endpoint — called from other server-side API routes
  const authHeader = request.headers.get("x-internal-secret");
  if (authHeader !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { title, message, url } = body;

  if (!title || !message) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  // Only send to admin users
  const adminClient = createAdminClient();
  const { data: adminProfiles } = await adminClient
    .from("profiles")
    .select("user_id")
    .eq("role", "admin");

  const adminIds = (adminProfiles ?? []).map((p) => p.user_id);
  if (adminIds.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const { data: subscriptions } = await adminClient
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", adminIds);

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

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
    await adminClient.from("push_subscriptions").delete().in("endpoint", expired);
  }

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ sent });
}

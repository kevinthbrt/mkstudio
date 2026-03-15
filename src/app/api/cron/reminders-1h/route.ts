import { createAdminClient } from "@/lib/supabase/admin";
import { notifyMember } from "@/lib/notifyMember";
import { formatTime } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // Find sessions starting in 55–65 minutes from now
  const now = new Date();
  const from = new Date(now.getTime() + 55 * 60 * 1000);
  const to = new Date(now.getTime() + 65 * 60 * 1000);

  const { data: sessions, error: sessionsError } = await adminClient
    .from("class_sessions")
    .select("id, start_time, end_time, coach_name, class_types (name)")
    .gte("start_time", from.toISOString())
    .lte("start_time", to.toISOString())
    .eq("is_cancelled", false);

  if (sessionsError || !sessions || sessions.length === 0) {
    return NextResponse.json({ sent: 0, sessions: 0 });
  }

  let sent = 0;

  for (const session of sessions) {
    const sessionTyped = session as typeof session & { class_types: { name: string } };

    const { data: bookings } = await adminClient
      .from("class_bookings")
      .select("member_id, profiles (first_name, user_id)")
      .eq("class_session_id", session.id)
      .eq("status", "confirmed");

    if (!bookings) continue;

    for (const booking of bookings) {
      const profile = (booking as any).profiles;
      if (!profile?.user_id) continue;

      notifyMember(
        profile.user_id,
        `Dans 1h — ${sessionTyped.class_types.name}`,
        `Ton cours commence à ${formatTime(session.start_time)} avec ${session.coach_name}`,
        `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard`
      );
      sent++;
    }
  }

  return NextResponse.json({ sent, sessions: sessions.length });
}

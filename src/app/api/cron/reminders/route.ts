import { createAdminClient } from "@/lib/supabase/admin";
import { sendSessionReminderEmail } from "@/lib/email";
import { formatDate, formatTime } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // Find sessions starting in 23–25h from now
  const now = new Date();
  const from = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 25 * 60 * 60 * 1000);

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

    // Get all confirmed bookings for this session with member profiles
    const { data: bookings } = await adminClient
      .from("class_bookings")
      .select("member_id, profiles (first_name, email, user_id)")
      .eq("class_session_id", session.id)
      .eq("status", "confirmed");

    if (!bookings) continue;

    for (const booking of bookings) {
      const profile = (booking as any).profiles;
      if (!profile?.email) continue;

      try {
        await sendSessionReminderEmail({
          to: profile.email,
          firstName: profile.first_name ?? "",
          sessionName: sessionTyped.class_types.name,
          sessionDate: formatDate(session.start_time),
          sessionTime: `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`,
          coachName: session.coach_name,
        });
        sent++;
      } catch (err) {
        console.error("[cron/reminders] email error:", err);
      }
    }
  }

  return NextResponse.json({ sent, sessions: sessions.length });
}

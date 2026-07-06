import { createAdminClient } from "@/lib/supabase/admin";
import { sendSessionReminderEmail } from "@/lib/email";
import { notifyMember } from "@/lib/notifyMember";
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
    .select("id, start_time, end_time, coach_name, session_type, class_types (name)")
    .gte("start_time", from.toISOString())
    .lte("start_time", to.toISOString())
    .eq("is_cancelled", false);

  if (sessionsError || !sessions || sessions.length === 0) {
    return NextResponse.json({ sent: 0, sessions: 0 });
  }

  let sent = 0;

  for (const session of sessions) {
    const sessionTyped = session as typeof session & { class_types: { name: string } };
    const isMassage = session.session_type === "massage";

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
          note: isMassage
            ? "Pense à prévoir le règlement sur place, au moment du massage."
            : undefined,
        });
        sent++;
      } catch (err) {
        console.error("[cron/reminders] email error:", err);
      }

      // Push notification (non-blocking)
      if (profile.user_id) {
        notifyMember(
          profile.user_id,
          `Rappel — ${sessionTyped.class_types.name} demain`,
          isMassage
            ? `Ton massage est demain à ${formatTime(session.start_time)} — paiement sur place`
            : `Ton cours est demain à ${formatTime(session.start_time)} avec ${session.coach_name}`,
          `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard`
        );
      }
    }
  }

  return NextResponse.json({ sent, sessions: sessions.length });
}

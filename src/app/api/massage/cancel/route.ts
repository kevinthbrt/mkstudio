import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMassageCancellationEmail } from "@/lib/email";
import { notifyAdmins } from "@/lib/notifyMember";
import { formatDate, formatTime } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, email")
    .eq("user_id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const { sessionId } = await request.json();
  if (!sessionId) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  const adminClient = createAdminClient();

  const { data: session } = await adminClient
    .from("class_sessions")
    .select("id, start_time, end_time, min_cancel_hours, session_type, current_participants, class_types (name)")
    .eq("id", sessionId)
    .single();

  if (!session || session.session_type !== "massage") {
    return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
  }

  const hoursLeft = (new Date(session.start_time).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < session.min_cancel_hours) {
    return NextResponse.json(
      { error: `Annulation impossible : moins de ${session.min_cancel_hours}h avant le massage.` },
      { status: 400 }
    );
  }

  const { data: booking } = await adminClient
    .from("class_bookings")
    .select("id")
    .eq("member_id", profile.id)
    .eq("class_session_id", sessionId)
    .eq("status", "confirmed")
    .single();

  if (!booking) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });

  await adminClient
    .from("class_bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", booking.id);

  await adminClient
    .from("class_sessions")
    .update({ current_participants: Math.max(0, session.current_participants - 1) })
    .eq("id", sessionId);

  const massageName = (session as unknown as { class_types: { name: string } }).class_types.name;

  if (profile.email) {
    sendMassageCancellationEmail({
      to: profile.email,
      firstName: profile.first_name ?? "",
      massageName,
      sessionDate: formatDate(session.start_time),
      sessionTime: `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`,
    }).catch((err) => console.error("[massage/cancel] email error:", err));
  }

  notifyAdmins(
    "Annulation massage",
    `${profile.first_name} a annulé — ${massageName} le ${formatDate(session.start_time)} à ${formatTime(session.start_time)}`,
    "/admin/planning"
  );

  return NextResponse.json({ success: true });
}

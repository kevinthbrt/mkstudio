import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendWaitlistPromotedEmail } from "@/lib/email";
import { notifyMember } from "@/lib/notifyMember";
import { formatDate, formatTime } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Caller must be authenticated (member cancelling their own booking or admin)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { sessionId } = await request.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId requis" }, { status: 400 });

  const adminClient = createAdminClient();

  // Get session info
  const { data: session } = await adminClient
    .from("class_sessions")
    .select("id, start_time, end_time, coach_name, min_cancel_hours, current_participants, max_participants, class_types(name)")
    .eq("id", sessionId)
    .single();

  if (!session) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  // Re-check there is a free spot (the cancellation should have freed one)
  if (session.current_participants >= session.max_participants) {
    return NextResponse.json({ promoted: false, reason: "no_spots" });
  }

  // Get waiting entries ordered by position (first in, first served)
  const { data: waitlistEntries } = await adminClient
    .from("class_waitlists")
    .select("id, member_id, position")
    .eq("class_session_id", sessionId)
    .eq("status", "waiting")
    .order("position", { ascending: true });

  if (!waitlistEntries || waitlistEntries.length === 0) {
    return NextResponse.json({ promoted: false, reason: "empty_waitlist" });
  }

  for (const entry of waitlistEntries) {
    // Get member profile with balance
    const { data: memberProfile } = await adminClient
      .from("profiles")
      .select("id, user_id, first_name, email, collective_balance")
      .eq("id", entry.member_id)
      .single();

    if (!memberProfile || memberProfile.collective_balance < 1) {
      // No balance — mark as cancelled so they don't block the queue
      await adminClient
        .from("class_waitlists")
        .update({ status: "cancelled" })
        .eq("id", entry.id);
      continue;
    }

    // Guard: member already has a confirmed booking for this session
    const { data: existing } = await adminClient
      .from("class_bookings")
      .select("id, status")
      .eq("member_id", entry.member_id)
      .eq("class_session_id", sessionId)
      .maybeSingle();

    if (existing?.status === "confirmed") {
      await adminClient
        .from("class_waitlists")
        .update({ status: "promoted" })
        .eq("id", entry.id);
      return NextResponse.json({ promoted: true, memberId: entry.member_id });
    }

    // Book the member
    const { error: bookError } = await adminClient
      .from("class_bookings")
      .upsert(
        {
          member_id: entry.member_id,
          class_session_id: sessionId,
          status: "confirmed",
          session_debited: true,
          booked_at: new Date().toISOString(),
          cancelled_at: null,
        },
        { onConflict: "member_id,class_session_id" }
      );

    if (bookError) continue;

    // Deduct 1 collective session
    await adminClient.rpc("decrement_collective_balance", { p_member_id: entry.member_id });

    // Increment participants counter
    await adminClient.rpc("increment_participants", { session_id: sessionId });

    // Mark waitlist entry as promoted
    await adminClient
      .from("class_waitlists")
      .update({ status: "promoted" })
      .eq("id", entry.id);

    // Send confirmation email (non-blocking)
    const sessionDate = formatDate(session.start_time);
    const sessionTime = `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`;
    const sessionName = (session.class_types as { name: string }).name;

    sendWaitlistPromotedEmail({
      to: memberProfile.email,
      firstName: memberProfile.first_name,
      sessionName,
      sessionDate,
      sessionTime,
      coachName: session.coach_name,
      minCancelHours: session.min_cancel_hours,
    }).catch(() => {});

    // Send push notification (non-blocking)
    notifyMember(
      memberProfile.user_id,
      "Place disponible !",
      `Tu es inscrit(e) au cours ${sessionName} le ${sessionDate} à ${formatTime(session.start_time)}.`,
      `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard/planning`
    );

    return NextResponse.json({ promoted: true, memberId: entry.member_id });
  }

  return NextResponse.json({ promoted: false, reason: "no_eligible_member" });
}

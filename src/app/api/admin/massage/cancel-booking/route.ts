import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMassageCancellationEmail } from "@/lib/email";
import { formatDate, formatTime } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { bookingId } = await request.json();
  if (!bookingId) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  const adminClient = createAdminClient();

  const { data: booking } = await adminClient
    .from("class_bookings")
    .select(
      "id, status, invoice_order_id, class_session_id, member_id, guest_name, guest_email, class_sessions (session_type, start_time, end_time, current_participants), profiles (first_name, email), products (name)"
    )
    .eq("id", bookingId)
    .single();

  const session = (booking as unknown as {
    class_sessions: { session_type: string; start_time: string; end_time: string; current_participants: number };
  })?.class_sessions;
  const memberProfile = (booking as unknown as { profiles: { first_name: string; email: string } | null })?.profiles;
  const product = (booking as unknown as { products: { name: string } | null })?.products;

  if (!booking || session?.session_type !== "massage") {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }
  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "Cette réservation n'est plus active" }, { status: 400 });
  }
  if (booking.invoice_order_id) {
    return NextResponse.json({ error: "Ce massage a déjà été facturé" }, { status: 400 });
  }

  await adminClient
    .from("class_bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", bookingId);

  await adminClient
    .from("class_sessions")
    .update({ current_participants: Math.max(0, session.current_participants - 1) })
    .eq("id", booking.class_session_id);

  const recipientEmail = memberProfile?.email ?? booking.guest_email;
  const recipientFirstName = memberProfile?.first_name ?? booking.guest_name ?? "";

  if (recipientEmail) {
    sendMassageCancellationEmail({
      to: recipientEmail,
      firstName: recipientFirstName,
      massageName: product?.name ?? "Massage",
      sessionDate: formatDate(session.start_time),
      sessionTime: `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`,
    }).catch((err) => console.error("[admin/massage/cancel-booking] email error:", err));
  }

  return NextResponse.json({ success: true });
}

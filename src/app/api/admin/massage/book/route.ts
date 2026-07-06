import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMassageBookingConfirmationEmail } from "@/lib/email";
import { notifyMember } from "@/lib/notifyMember";
import { isEligibleForMassageDiscount } from "@/lib/massageEligibility";
import { computeMassagePrice } from "@/lib/massagePricing";
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

  const { sessionId, memberId, guestName, guestEmail, productId } = await request.json();
  if (!sessionId || !productId || (!memberId && !guestName)) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: session } = await adminClient
    .from("class_sessions")
    .select("id, start_time, end_time, coach_name, session_type, is_cancelled")
    .eq("id", sessionId)
    .single();

  if (!session || session.session_type !== "massage" || session.is_cancelled) {
    return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
  }

  const { data: massageProduct } = await adminClient
    .from("products")
    .select("name, price")
    .eq("id", productId)
    .eq("is_massage", true)
    .single();

  if (!massageProduct) {
    return NextResponse.json({ error: "Type de massage introuvable" }, { status: 400 });
  }

  let member: { id: string; first_name: string; email: string; user_id: string } | null = null;
  if (memberId) {
    const { data } = await adminClient
      .from("profiles")
      .select("id, first_name, email, user_id")
      .eq("id", memberId)
      .single();
    if (!data) return NextResponse.json({ error: "Adhérent introuvable" }, { status: 404 });
    member = data;
  }

  const eligible = member ? await isEligibleForMassageDiscount(adminClient, member.id) : false;
  const price = computeMassagePrice(massageProduct.price, eligible);

  const { data: result, error } = await adminClient.rpc("book_massage_session", {
    p_session_id: sessionId,
    p_product_id: productId,
    p_price: price,
    p_discount_applied: eligible,
    p_member_id: member?.id ?? null,
    p_guest_name: member ? null : guestName,
    p_guest_email: member ? null : guestEmail || null,
  });

  const rpcResult = result as { success: boolean; error?: string } | null;

  if (error || !rpcResult?.success) {
    const message = rpcResult?.error === "no_spots" ? "Ce créneau est déjà réservé." : "Une erreur est survenue.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const sessionDate = formatDate(session.start_time);
  const sessionTime = `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`;
  const recipientEmail = member?.email ?? guestEmail;
  const recipientFirstName = member?.first_name ?? guestName ?? "";

  if (recipientEmail) {
    sendMassageBookingConfirmationEmail({
      to: recipientEmail,
      firstName: recipientFirstName,
      massageName: massageProduct.name,
      sessionDate,
      sessionTime,
      coachName: session.coach_name,
      price,
      discountApplied: eligible,
    }).catch(() => {});
  }

  if (member?.user_id) {
    notifyMember(
      member.user_id,
      `Massage confirmé — ${massageProduct.name}`,
      `${sessionDate} à ${formatTime(session.start_time)}`,
      `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard`
    );
  }

  return NextResponse.json({ success: true, price, discountApplied: eligible });
}

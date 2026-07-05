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

  const { sessionId, memberId } = await request.json();
  if (!sessionId || !memberId) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: session } = await adminClient
    .from("class_sessions")
    .select("id, start_time, end_time, coach_name, session_type, is_cancelled, class_types (name), massage_product:products!massage_product_id (name, price)")
    .eq("id", sessionId)
    .single();

  const massageProduct = (session as unknown as { massage_product: { name: string; price: number } | null })?.massage_product;
  const classType = (session as unknown as { class_types: { name: string } })?.class_types;

  if (!session || session.session_type !== "massage" || session.is_cancelled || !massageProduct) {
    return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
  }

  const { data: member } = await adminClient
    .from("profiles")
    .select("id, first_name, email, user_id")
    .eq("id", memberId)
    .single();
  if (!member) return NextResponse.json({ error: "Adhérent introuvable" }, { status: 404 });

  const eligible = await isEligibleForMassageDiscount(adminClient, member.id);
  const price = computeMassagePrice(massageProduct.price, eligible);

  const { data: result, error } = await adminClient.rpc("book_massage_session", {
    p_member_id: member.id,
    p_session_id: sessionId,
    p_price: price,
    p_discount_applied: eligible,
  });

  const rpcResult = result as { success: boolean; error?: string } | null;

  if (error || !rpcResult?.success) {
    const message = rpcResult?.error === "no_spots" ? "Ce créneau est déjà réservé." : "Une erreur est survenue.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const massageName = classType?.name ?? massageProduct.name;
  const sessionDate = formatDate(session.start_time);
  const sessionTime = `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`;

  if (member.email) {
    sendMassageBookingConfirmationEmail({
      to: member.email,
      firstName: member.first_name ?? "",
      massageName,
      sessionDate,
      sessionTime,
      coachName: session.coach_name,
      price,
      discountApplied: eligible,
    }).catch(() => {});
  }

  if (member.user_id) {
    notifyMember(
      member.user_id,
      `Massage confirmé — ${massageName}`,
      `${sessionDate} à ${formatTime(session.start_time)}`,
      `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard`
    );
  }

  return NextResponse.json({ success: true, price, discountApplied: eligible });
}

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMassageBookingConfirmationEmail } from "@/lib/email";
import { notifyMember, notifyAdmins } from "@/lib/notifyMember";
import { isEligibleForMassageDiscount } from "@/lib/massageEligibility";
import { computeMassagePrice } from "@/lib/massagePricing";
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

  const { sessionId, productId } = await request.json();
  if (!sessionId || !productId) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

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
    .eq("active", true)
    .single();

  if (!massageProduct) {
    return NextResponse.json({ error: "Type de massage introuvable" }, { status: 400 });
  }

  const eligible = await isEligibleForMassageDiscount(adminClient, profile.id);
  const price = computeMassagePrice(massageProduct.price, eligible);

  const { data: result, error } = await adminClient.rpc("book_massage_session", {
    p_member_id: profile.id,
    p_session_id: sessionId,
    p_product_id: productId,
    p_price: price,
    p_discount_applied: eligible,
  });

  const rpcResult = result as { success: boolean; error?: string } | null;

  if (error || !rpcResult?.success) {
    const message =
      rpcResult?.error === "no_spots"
        ? "Ce créneau vient d'être réservé par quelqu'un d'autre."
        : "Une erreur est survenue. Réessayez.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const sessionDate = formatDate(session.start_time);
  const sessionTime = `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`;

  if (profile.email) {
    sendMassageBookingConfirmationEmail({
      to: profile.email,
      firstName: profile.first_name ?? "",
      massageName: massageProduct.name,
      sessionDate,
      sessionTime,
      coachName: session.coach_name,
      price,
      discountApplied: eligible,
    }).catch(() => {});
  }

  notifyMember(
    user.id,
    `Massage confirmé — ${massageProduct.name}`,
    `${sessionDate} à ${formatTime(session.start_time)}`,
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard`
  );

  notifyAdmins(
    "Nouvelle réservation massage 💆",
    `${profile.first_name} a réservé — ${massageProduct.name} le ${sessionDate} à ${formatTime(session.start_time)}`,
    "/admin/planning"
  );

  return NextResponse.json({ success: true, price, discountApplied: eligible });
}

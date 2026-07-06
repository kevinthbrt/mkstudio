import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPurchaseConfirmationEmail } from "@/lib/email";
import { notifyMember } from "@/lib/notifyMember";
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

  const { bookingId, paymentMethod, amount } = await request.json();
  if (!bookingId || !paymentMethod || amount == null) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: booking } = await adminClient
    .from("class_bookings")
    .select("id, member_id, guest_name, guest_email, status, invoice_order_id, massage_product_id, class_sessions (session_type)")
    .eq("id", bookingId)
    .single();

  const session = (booking as unknown as { class_sessions: { session_type: string } })?.class_sessions;

  if (!booking || session?.session_type !== "massage" || !booking.massage_product_id) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }
  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "Cette réservation n'est plus active" }, { status: 400 });
  }
  if (booking.invoice_order_id) {
    return NextResponse.json({ error: "Ce massage a déjà été facturé" }, { status: 400 });
  }

  let member: { id: string; first_name: string; email: string; user_id: string } | null = null;
  if (booking.member_id) {
    const { data } = await adminClient
      .from("profiles")
      .select("id, first_name, email, user_id")
      .eq("id", booking.member_id)
      .single();
    if (!data) return NextResponse.json({ error: "Adhérent introuvable" }, { status: 404 });
    member = data;
  }

  const { data: product } = await adminClient
    .from("products")
    .select("name, description")
    .eq("id", booking.massage_product_id)
    .single();
  if (!product) return NextResponse.json({ error: "Type de massage introuvable" }, { status: 404 });

  const { data: invoiceSettings } = await adminClient.from("invoice_settings").select("*").single();
  const invoiceNumber = invoiceSettings
    ? `${invoiceSettings.invoice_prefix}-${String(invoiceSettings.next_invoice_number).padStart(4, "0")}`
    : `INV-${Date.now()}`;

  const { data: order, error: orderError } = await adminClient
    .from("orders")
    .insert({
      member_id: member?.id ?? null,
      guest_name: member ? null : booking.guest_name,
      guest_email: member ? null : booking.guest_email,
      product_id: booking.massage_product_id,
      amount,
      sessions_purchased: 1,
      invoice_number: invoiceNumber,
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_method: paymentMethod,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Erreur lors de la création de la facture" }, { status: 500 });
  }

  if (invoiceSettings) {
    await adminClient
      .from("invoice_settings")
      .update({ next_invoice_number: invoiceSettings.next_invoice_number + 1 })
      .eq("id", invoiceSettings.id);
  }

  await adminClient
    .from("class_bookings")
    .update({ invoice_order_id: order.id })
    .eq("id", bookingId);

  const recipientEmail = member?.email ?? booking.guest_email;
  const recipientFirstName = member?.first_name ?? booking.guest_name ?? "";

  if (recipientEmail) {
    sendPurchaseConfirmationEmail({
      to: recipientEmail,
      firstName: recipientFirstName,
      productName: product.name,
      amount,
      sessionCount: 1,
      sessionType: "massage",
      invoiceNumber,
      orderId: order.id,
    }).catch((err) => console.error("[admin/massage/invoice] email error:", err));
  }

  if (member?.user_id) {
    notifyMember(
      member.user_id,
      "Facture disponible",
      `Ta facture ${invoiceNumber} est prête.`,
      `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard/purchases`
    );
  }

  return NextResponse.json({ success: true, orderId: order.id });
}

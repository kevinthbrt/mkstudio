import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMerchOrderConfirmationEmail, sendMerchOrderUpdatedEmail } from "@/lib/email";
import { merchErrorMessage, merchPaymentLabel } from "@/lib/merch";
import { acces } from "@/content/landing";
import { after, NextRequest, NextResponse } from "next/server";

/**
 * L'admin crée une commande pour un adhérent (orderId absent) ou modifie une
 * commande existante. L'adhérent est prévenu par email dans les deux cas.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ saleId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { data: admin } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { saleId } = await params;
  const body = await request.json().catch(() => null);
  const orderId: unknown = body?.orderId ?? null;
  const memberId: unknown = body?.memberId;
  const paymentMethod: unknown = body?.paymentMethod;
  const rawLines: unknown = body?.lines;

  if (
    (orderId !== null && typeof orderId !== "string") ||
    typeof memberId !== "string" ||
    typeof paymentMethod !== "string" ||
    !Array.isArray(rawLines)
  ) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const lines = rawLines.map((line) => ({
    item_id: String(line?.item_id ?? ""),
    variant: typeof line?.variant === "string" && line.variant ? line.variant : null,
    quantity: Number(line?.quantity),
  }));

  const adminClient = createAdminClient();
  const { data: result, error } = await adminClient.rpc("admin_save_merch_order", {
    p_order_id: orderId,
    p_sale_id: saleId,
    p_member_id: memberId,
    p_payment_method: paymentMethod,
    p_lines: lines,
    p_note: typeof body?.note === "string" ? body.note.slice(0, 500) : null,
  });

  const rpcResult = result as {
    success: boolean;
    error?: string;
    order_id?: string;
    created?: boolean;
    total?: number;
    previous_total?: number | null;
  } | null;

  if (error || !rpcResult?.success || !rpcResult.order_id) {
    if (error) console.error("[admin/boutique/orders] rpc error:", error.message);
    return NextResponse.json({ error: merchErrorMessage(rpcResult?.error) }, { status: 400 });
  }

  const savedOrderId = rpcResult.order_id;
  const created = Boolean(rpcResult.created);

  after(async () => {
    const [{ data: order }, { data: orderLines }, { data: sale }] = await Promise.all([
      adminClient.from("merch_orders").select("member_id, total, paid_at, paid_amount").eq("id", savedOrderId).single(),
      adminClient.from("merch_order_lines").select("*").eq("order_id", savedOrderId),
      adminClient.from("merch_sales").select("title, closes_at, payment_instructions").eq("id", saleId).single(),
    ]);
    if (!order || !sale) return;

    const { data: member } = await adminClient
      .from("profiles")
      .select("first_name, email")
      .eq("id", order.member_id)
      .single();
    if (!member?.email) return;

    const emailLines = (orderLines ?? []).map((line) => ({
      itemName: line.item_name,
      variant: line.variant,
      quantity: line.quantity,
      unitPrice: Number(line.unit_price),
    }));

    const sendResult = created
      ? await sendMerchOrderConfirmationEmail({
          to: member.email,
          firstName: member.first_name ?? "",
          saleTitle: sale.title,
          closesAt: sale.closes_at,
          lines: emailLines,
          total: Number(order.total),
          paymentLabel: merchPaymentLabel(paymentMethod),
          paymentInstructions: sale.payment_instructions,
          byAdmin: true,
        }).catch(() => null)
      : await sendMerchOrderUpdatedEmail({
          to: member.email,
          firstName: member.first_name ?? "",
          saleTitle: sale.title,
          lines: emailLines,
          total: Number(order.total),
          paymentLabel: merchPaymentLabel(paymentMethod),
          paymentInstructions: sale.payment_instructions,
          paidAmount: order.paid_at && order.paid_amount !== null ? Number(order.paid_amount) : null,
          contactPhone: acces.contacts[0].value,
        }).catch(() => null);

    if (!sendResult || sendResult.error) {
      console.error("[admin/boutique/orders] email non envoyé pour la commande", savedOrderId);
    }
  });

  return NextResponse.json({
    success: true,
    created,
    total: rpcResult.total,
    previousTotal: rpcResult.previous_total ?? null,
  });
}

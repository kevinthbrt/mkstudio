import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMerchOrderConfirmationEmail } from "@/lib/email";
import { notifyAdmins } from "@/lib/notifyMember";
import { merchErrorMessage, merchPaymentLabel } from "@/lib/merch";
import { formatPriceFromEuros } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

interface OrderLineInput {
  item_id: string;
  variant: string | null;
  quantity: number;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("user_id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const saleId: unknown = body?.saleId;
  const paymentMethod: unknown = body?.paymentMethod;
  const note: unknown = body?.note;
  const rawLines: unknown = body?.lines;

  if (typeof saleId !== "string" || typeof paymentMethod !== "string" || !Array.isArray(rawLines)) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  // Le prix n'est jamais lu depuis la requête : la base le recalcule.
  const lines: OrderLineInput[] = rawLines.map((line) => ({
    item_id: String(line?.item_id ?? ""),
    variant: typeof line?.variant === "string" && line.variant ? line.variant : null,
    quantity: Number(line?.quantity),
  }));

  const adminClient = createAdminClient();
  const { data: result, error } = await adminClient.rpc("place_merch_order", {
    p_member_id: profile.id,
    p_sale_id: saleId,
    p_payment_method: paymentMethod,
    p_lines: lines,
    p_note: typeof note === "string" ? note.slice(0, 500) : null,
  });

  const rpcResult = result as { success: boolean; error?: string; order_id?: string; total?: number } | null;
  if (error || !rpcResult?.success || !rpcResult.order_id) {
    if (error) console.error("[boutique/orders] rpc error:", error.message);
    return NextResponse.json({ error: merchErrorMessage(rpcResult?.error) }, { status: 400 });
  }

  const [{ data: sale }, { data: orderLines }] = await Promise.all([
    adminClient.from("merch_sales").select("title, closes_at, payment_instructions").eq("id", saleId).single(),
    adminClient.from("merch_order_lines").select("*").eq("order_id", rpcResult.order_id),
  ]);

  const total = Number(rpcResult.total ?? 0);

  if (profile.email && sale) {
    sendMerchOrderConfirmationEmail({
      to: profile.email,
      firstName: profile.first_name ?? "",
      saleTitle: sale.title,
      closesAt: sale.closes_at,
      lines: (orderLines ?? []).map((line) => ({
        itemName: line.item_name,
        variant: line.variant,
        quantity: line.quantity,
        unitPrice: Number(line.unit_price),
      })),
      total,
      paymentLabel: merchPaymentLabel(paymentMethod),
      paymentInstructions: sale.payment_instructions,
    }).catch((err) => console.error("[boutique/orders] email error:", err));
  }

  notifyAdmins(
    "Nouvelle commande boutique 🛍️",
    `${profile.first_name} ${profile.last_name ?? ""}`.trim() +
      ` : ${formatPriceFromEuros(total)} (${merchPaymentLabel(paymentMethod).toLowerCase()})`,
    `/admin/boutique/${saleId}`
  );

  return NextResponse.json({ success: true, orderId: rpcResult.order_id, total });
}

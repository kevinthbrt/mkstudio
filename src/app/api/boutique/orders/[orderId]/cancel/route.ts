import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/notifyMember";
import { merchErrorMessage } from "@/lib/merch";
import { after, NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const adminClient = createAdminClient();
  const { data: result, error } = await adminClient.rpc("cancel_merch_order", {
    p_member_id: profile.id,
    p_order_id: orderId,
  });

  const rpcResult = result as { success: boolean; error?: string } | null;
  if (error || !rpcResult?.success) {
    if (error) console.error("[boutique/cancel] rpc error:", error.message);
    return NextResponse.json({ error: merchErrorMessage(rpcResult?.error) }, { status: 400 });
  }

  const { data: order } = await adminClient
    .from("merch_orders")
    .select("sale_id")
    .eq("id", orderId)
    .single();

  after(() =>
    notifyAdmins(
      "Commande boutique annulée",
      `${profile.first_name} ${profile.last_name ?? ""}`.trim() + " a annulé sa commande.",
      order ? `/admin/boutique/${order.sale_id}` : "/admin/boutique"
    )
  );

  return NextResponse.json({ success: true });
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await request.json();
  const { member_id, product_id } = body;

  if (!member_id || !product_id) {
    return NextResponse.json(
      { error: "Adhérent et produit obligatoires" },
      { status: 400 }
    );
  }

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", product_id)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  const { data: invoiceSettings } = await supabase
    .from("invoice_settings")
    .select("*")
    .single();

  const invoiceNumber = invoiceSettings
    ? `${invoiceSettings.invoice_prefix}-${String(invoiceSettings.next_invoice_number).padStart(4, "0")}`
    : `INV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      member_id,
      product_id,
      amount: product.price,
      sessions_purchased: product.session_count,
      invoice_number: invoiceNumber,
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError) {
    console.error("[admin/orders] insert error:", orderError.message);
    return NextResponse.json({ error: "Une erreur est survenue lors de la création de la vente." }, { status: 500 });
  }

  // Credit the correct balance based on product type
  const { data: member } = await supabase
    .from("profiles")
    .select("collective_balance, individual_balance")
    .eq("id", member_id)
    .single();

  if (member) {
    const sessionType = product.session_type || "collective";
    if (sessionType === "individual") {
      await supabase
        .from("profiles")
        .update({ individual_balance: member.individual_balance + product.session_count })
        .eq("id", member_id);
    } else {
      await supabase
        .from("profiles")
        .update({ collective_balance: member.collective_balance + product.session_count })
        .eq("id", member_id);
    }
  }

  if (invoiceSettings) {
    await supabase
      .from("invoice_settings")
      .update({ next_invoice_number: invoiceSettings.next_invoice_number + 1 })
      .eq("id", invoiceSettings.id);
  }

  return NextResponse.json({
    success: true,
    order,
    invoice_number: invoiceNumber,
  });
}

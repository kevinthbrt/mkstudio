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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const { product_id } = body;

  if (!product_id) {
    return NextResponse.json({ error: "Produit obligatoire" }, { status: 400 });
  }

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", product_id)
    .eq("active", true)
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
    : `INV-${Date.now()}`;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      member_id: profile.id,
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
    console.error("[orders] insert error:", orderError.message);
    return NextResponse.json({ error: "Une erreur est survenue lors de la création de la commande." }, { status: 500 });
  }

  const sessionType = product.session_type || "collective";
  const balanceField = sessionType === "individual" ? "individual_balance" : "collective_balance";
  const currentBalance = sessionType === "individual"
    ? profile.individual_balance
    : profile.collective_balance;

  await supabase
    .from("profiles")
    .update({ [balanceField]: currentBalance + product.session_count })
    .eq("id", profile.id);

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

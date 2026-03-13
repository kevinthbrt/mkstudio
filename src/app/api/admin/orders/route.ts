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

  // Get product
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", product_id)
    .single();

  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  // Get invoice settings for invoice number
  const { data: invoiceSettings } = await supabase
    .from("invoice_settings")
    .select("*")
    .single();

  const invoiceNumber = invoiceSettings
    ? `${invoiceSettings.invoice_prefix}-${String(invoiceSettings.next_invoice_number).padStart(4, "0")}`
    : `INV-${Date.now()}`;

  // Create order
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
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // Update member balance
  const { data: member } = await supabase
    .from("profiles")
    .select("session_balance")
    .eq("id", member_id)
    .single();

  if (member) {
    await supabase
      .from("profiles")
      .update({
        session_balance: member.session_balance + product.session_count,
      })
      .eq("id", member_id);
  }

  // Increment invoice counter
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

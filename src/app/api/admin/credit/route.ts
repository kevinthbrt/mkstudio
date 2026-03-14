import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Admin can credit a member's balance without generating a sale or invoice
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
  const { member_id, session_type, amount } = body;

  if (!member_id || !session_type || typeof amount !== "number") {
    return NextResponse.json(
      { error: "Paramètres invalides (member_id, session_type, amount requis)" },
      { status: 400 }
    );
  }

  if (!["collective", "individual"].includes(session_type)) {
    return NextResponse.json(
      { error: "session_type doit être 'collective' ou 'individual'" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 100) {
    return NextResponse.json(
      { error: "Montant invalide (entier non nul, max 100)" },
      { status: 400 }
    );
  }

  // Fetch current balance
  const { data: member, error: memberError } = await supabase
    .from("profiles")
    .select("id, collective_balance, individual_balance")
    .eq("id", member_id)
    .single();

  if (memberError || !member) {
    return NextResponse.json({ error: "Adhérent introuvable" }, { status: 404 });
  }

  const field = session_type === "individual" ? "individual_balance" : "collective_balance";
  const currentBalance = session_type === "individual"
    ? member.individual_balance
    : member.collective_balance;
  const newBalance = Math.max(0, currentBalance + amount);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ [field]: newBalance })
    .eq("id", member_id);

  if (updateError) {
    console.error("[admin/credit] update error:", updateError.message);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du crédit." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    session_type,
    previous_balance: currentBalance,
    new_balance: newBalance,
    delta: amount,
  });
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé", status: 401, supabase: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin")
    return { error: "Non autorisé", status: 403, supabase: null };

  return { error: null, status: 200, supabase };
}

export async function GET() {
  const { error, status, supabase } = await getAdminClient();
  if (error || !supabase) return NextResponse.json({ error }, { status });

  const [expensesRes, incomesRes] = await Promise.all([
    supabase.from("expenses").select("*").order("date", { ascending: false }),
    supabase.from("manual_incomes").select("*").order("date", { ascending: false }),
  ]);

  return NextResponse.json({
    expenses: expensesRes.data || [],
    manual_incomes: incomesRes.data || [],
  });
}

export async function POST(request: Request) {
  const { error, status, supabase } = await getAdminClient();
  if (error || !supabase) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { type, date, description, amount } = body;

  if (!date || !description || !amount) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  if (type === "income") {
    const { data, error: dbError } = await supabase
      .from("manual_incomes")
      .insert({ date, description, amount: parsedAmount, payment_method: body.payment_method || null })
      .select()
      .single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  // default: expense
  const { category } = body;
  if (!category) return NextResponse.json({ error: "Catégorie manquante" }, { status: 400 });

  const { data, error: dbError } = await supabase
    .from("expenses")
    .insert({ date, description, category, amount: parsedAmount })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const { error, status, supabase } = await getAdminClient();
  if (error || !supabase) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const table = type === "income" ? "manual_incomes" : "expenses";
  const { error: dbError } = await supabase.from(table).delete().eq("id", id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

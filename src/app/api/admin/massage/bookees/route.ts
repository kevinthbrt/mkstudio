import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "missing session_id" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("class_bookings")
    .select("id, member_id, invoice_order_id, massage_price, massage_discount_applied, profiles (first_name, last_name)")
    .eq("class_session_id", sessionId)
    .eq("status", "confirmed");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data || []).map((b: any) => ({
      id: b.id,
      memberId: b.member_id,
      name: `${b.profiles?.first_name ?? ""} ${b.profiles?.last_name ?? ""}`.trim(),
      invoiced: !!b.invoice_order_id,
      price: b.massage_price,
      discountApplied: b.massage_discount_applied,
    }))
  );
}

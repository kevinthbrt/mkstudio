import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Verify caller is an authenticated admin
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

  // Use service role to bypass RLS
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("class_bookings")
    .select("guest_names, profiles (first_name, last_name)")
    .eq("class_session_id", sessionId)
    .eq("status", "confirmed");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data || []).map((b: any) => ({
      name: `${b.profiles?.first_name ?? ""} ${b.profiles?.last_name ?? ""}`.trim(),
      guest_names: b.guest_names ?? null,
    }))
  );
}

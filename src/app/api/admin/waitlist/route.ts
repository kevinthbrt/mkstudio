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
    .from("class_waitlists")
    .select("id, position, status, member_id, profiles(first_name, last_name)")
    .eq("class_session_id", sessionId)
    .eq("status", "waiting")
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data || []).map((w: any) => ({
      id: w.id,
      position: w.position,
      member_id: w.member_id,
      name: `${w.profiles?.first_name ?? ""} ${w.profiles?.last_name ?? ""}`.trim(),
    }))
  );
}

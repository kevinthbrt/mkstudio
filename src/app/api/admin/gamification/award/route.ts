import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { member_id, achievement_code } = body;

  if (!member_id || !achievement_code) {
    return NextResponse.json({ error: "member_id and achievement_code are required" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("award_manual_achievement", {
    p_member_id: member_id,
    p_achievement_code: achievement_code,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

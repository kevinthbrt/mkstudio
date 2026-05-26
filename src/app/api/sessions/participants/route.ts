import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "missing session_id" }, { status: 400 });

  const admin = createAdminClient();

  const { data: session, error: sessionError } = await admin
    .from("class_sessions")
    .select("session_type, is_hidden")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }

  if (session.session_type !== "collective") {
    return NextResponse.json({ error: "not a collective session" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("class_bookings")
    .select("guest_names, profiles (first_name, last_name)")
    .eq("class_session_id", sessionId)
    .eq("status", "confirmed");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data || []).map((b: any) => {
      const firstName = b.profiles?.first_name ?? "";
      const lastName = b.profiles?.last_name ?? "";
      const name = lastName
        ? `${firstName} ${lastName.charAt(0).toUpperCase()}.`
        : firstName;
      return { name: name.trim(), guest_names: b.guest_names ?? null };
    })
  );
}

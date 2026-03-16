import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await request.json();
  const { first_name, last_name, email, phone, date_of_birth, password } = body;

  if (!first_name || !last_name || !email || !password) {
    return NextResponse.json(
      { error: "Champs obligatoires manquants" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Create user with Supabase Auth
  const { data: newUser, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role: "member",
      },
    });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Update profile with phone and date_of_birth if provided
  if (newUser.user && (phone || date_of_birth)) {
    const updates: Record<string, string> = {};
    if (phone) updates.phone = phone;
    if (date_of_birth) updates.date_of_birth = date_of_birth;
    await admin
      .from("profiles")
      .update(updates)
      .eq("user_id", newUser.user.id);
  }

  return NextResponse.json({ success: true, user: newUser.user });
}

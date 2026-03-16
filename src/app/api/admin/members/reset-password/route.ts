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
  const { member_id, new_password } = body;

  if (!member_id || !new_password) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  if (new_password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get the user_id from the profile
  const { data: memberProfile } = await admin
    .from("profiles")
    .select("user_id")
    .eq("id", member_id)
    .single();

  if (!memberProfile?.user_id) {
    return NextResponse.json({ error: "Adhérent introuvable" }, { status: 404 });
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    memberProfile.user_id,
    { password: new_password }
  );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

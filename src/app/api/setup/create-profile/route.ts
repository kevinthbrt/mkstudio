import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// List of emails that should be admin
const ADMIN_EMAILS = ["kevin.thubert@gmail.com"];

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email || "");
  const role = isAdmin ? "admin" : "member";

  // Use admin client to bypass RLS for all profile operations
  const admin = createAdminClient();

  // Check if profile already exists (admin client bypasses RLS)
  const { data: existing } = await admin
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Update role if this user should be admin
    if (isAdmin && existing.role !== "admin") {
      await admin.from("profiles").update({ role: "admin" }).eq("id", existing.id);
      return NextResponse.json({
        message: "Profil mis à jour ! Rôle : Administrateur",
        role: "admin",
      });
    }
    return NextResponse.json({
      message: "Profil déjà existant",
      role: existing.role,
    });
  }

  const { error } = await admin.from("profiles").insert({
    user_id: user.id,
    first_name: user.user_metadata?.first_name || user.email?.split("@")[0] || "Utilisateur",
    last_name: user.user_metadata?.last_name || "",
    email: user.email || "",
    role,
    session_balance: 0,
  });

  if (error) {
    return NextResponse.json(
      { error: `Erreur création profil : ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: `Profil créé ! Rôle : ${role === "admin" ? "Administrateur" : "Adhérent"}`,
    role,
  });
}

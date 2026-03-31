import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";
import { notifyAdmin } from "@/lib/notifyAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, email")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  try {
    await sendWelcomeEmail(profile.email, profile.first_name);
    await notifyAdmin(
      "Nouvel adhérent inscrit",
      `${profile.first_name} (${profile.email}) vient de créer un compte.`,
      "/admin/members"
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[email/welcome]", err);
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }
}

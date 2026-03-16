import { createClient } from "@/lib/supabase/server";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, email")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const body = await request.json();
  const { sessionName, sessionDate, sessionTime, coachName, guests, minCancelHours } = body;

  if (!sessionName) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  try {
    await sendBookingConfirmationEmail({
      to: profile.email,
      firstName: profile.first_name,
      sessionName,
      sessionDate,
      sessionTime,
      coachName,
      guests,
      minCancelHours,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[email/booking]", err);
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }
}

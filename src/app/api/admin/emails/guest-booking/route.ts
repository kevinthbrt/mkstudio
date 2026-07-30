import { createClient } from "@/lib/supabase/server";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

// Sends a booking confirmation email to a guest with no account, registered
// by the admin for a collective/duo session (walk-in, no session debited).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { email, firstName, sessionName, sessionDate, sessionTime, coachName } = await request.json();

  if (!email || !sessionName) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  try {
    await sendBookingConfirmationEmail({
      to: email,
      firstName: firstName || "",
      sessionName,
      sessionDate,
      sessionTime,
      coachName,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/emails/guest-booking]", err);
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }
}

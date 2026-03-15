import { sendBookingConfirmationEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, firstName, sessionName, sessionDate, sessionTime, coachName, guests } = body;

  if (!email || !firstName || !sessionName) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  try {
    await sendBookingConfirmationEmail({ to: email, firstName, sessionName, sessionDate, sessionTime, coachName, guests });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[email/booking]", err);
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }
}

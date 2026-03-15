import { sendCancellationEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, firstName, sessionName, sessionDate, sessionTime, refundedSessions, sessionType } = body;

  if (!email || !firstName || !sessionName) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  try {
    await sendCancellationEmail({ to: email, firstName, sessionName, sessionDate, sessionTime, refundedSessions, sessionType });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[email/cancellation]", err);
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }
}

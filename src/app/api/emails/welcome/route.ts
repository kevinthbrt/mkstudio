import { sendWelcomeEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, firstName } = body;

  if (!email || !firstName) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  try {
    await sendWelcomeEmail(email, firstName);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[email/welcome]", err);
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }
}

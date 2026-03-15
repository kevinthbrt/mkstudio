import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendIndividualSessionBookingEmail } from "@/lib/email";
import { notifyMember } from "@/lib/notifyMember";
import { NextRequest, NextResponse } from "next/server";

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

  const body = await request.json();
  const { memberId, sessionName, sessionDate, sessionTime, coachName, recurring } = body;

  if (!memberId || !sessionName) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  try {
    const { data: member } = await supabase
      .from("profiles")
      .select("first_name, user_id")
      .eq("id", memberId)
      .single();

    if (!member?.user_id) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    const adminClient = createAdminClient();
    const { data: authUser } = await adminClient.auth.admin.getUserById(member.user_id);

    if (authUser?.user?.email) {
      await sendIndividualSessionBookingEmail({
        to: authUser.user.email,
        firstName: member.first_name ?? "",
        sessionName,
        sessionDate,
        sessionTime,
        coachName,
        recurring: recurring ?? false,
      });
    }

    notifyMember(
      member.user_id,
      `Séance planifiée — ${sessionName}`,
      `${sessionDate} à ${sessionTime} avec ${coachName}`,
      `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/dashboard`
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/emails/booking]", err);
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }
}

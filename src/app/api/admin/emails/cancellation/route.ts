import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSessionCancelledByAdminEmail } from "@/lib/email";
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
  const { memberIds, sessionName, sessionDate, sessionTime, sessionType } = body;

  if (!memberIds?.length || !sessionName) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  try {
    const adminClient = createAdminClient();

    const { data: members } = await supabase
      .from("profiles")
      .select("id, first_name, user_id")
      .in("id", memberIds);

    if (!members?.length) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    let sent = 0;
    for (const member of members) {
      if (!member.user_id) continue;
      const { data: authUser } = await adminClient.auth.admin.getUserById(member.user_id);
      if (authUser?.user?.email) {
        await sendSessionCancelledByAdminEmail({
          to: authUser.user.email,
          firstName: member.first_name ?? "",
          sessionName,
          sessionDate,
          sessionTime,
          sessionType: sessionType ?? "collective",
        });
        sent++;
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error("[admin/emails/cancellation]", err);
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }
}

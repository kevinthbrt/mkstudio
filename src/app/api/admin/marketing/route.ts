import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMarketingEmail } from "@/lib/email";
import { generateUnsubscribeToken } from "@/lib/unsubscribeToken";
import { MarketingCampaignType } from "@/lib/marketingEmailTemplate";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, email, role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return { supabase, profile };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { count } = await auth.supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "member")
    .eq("is_test_account", false)
    .eq("marketing_opt_in", true);

  return NextResponse.json({ recipientCount: count ?? 0 });
}

interface CampaignBody {
  mode: "test" | "send";
  type: MarketingCampaignType;
  title: string;
  intro?: string;
  bodyText: string;
  imageUrl?: string;
  promoCode?: string;
  validUntil?: string;
  ctaText: string;
  ctaLink: string;
  subject?: string;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body: CampaignBody = await request.json();
  const { mode, type, title, intro, bodyText, imageUrl, promoCode, validUntil, ctaText, ctaLink, subject } = body;

  if (!type || !title?.trim() || !bodyText?.trim() || !ctaText?.trim() || !ctaLink?.trim()) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const templateParams = { type, title, intro, bodyText, imageUrl, promoCode, validUntil, ctaText, ctaLink };

  try {
    if (mode === "test") {
      if (!auth.profile.email) {
        return NextResponse.json({ error: "Aucune adresse email admin trouvée" }, { status: 400 });
      }
      await sendMarketingEmail({
        ...templateParams,
        to: auth.profile.email,
        subject: subject ? `[TEST] ${subject}` : undefined,
        firstName: auth.profile.first_name ?? "",
        unsubscribeUrl: "#",
      });
      return NextResponse.json({ success: true });
    }

    if (mode !== "send") {
      return NextResponse.json({ error: "Mode invalide" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: members, error } = await adminClient
      .from("profiles")
      .select("id, first_name, email")
      .eq("role", "member")
      .eq("is_test_account", false)
      .eq("marketing_opt_in", true);

    if (error) throw error;

    let sent = 0;
    for (const member of members ?? []) {
      if (!member.email) continue;
      const token = generateUnsubscribeToken(member.id);
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/unsubscribe?profile=${member.id}&token=${token}`;
      await sendMarketingEmail({
        ...templateParams,
        to: member.email,
        subject,
        firstName: member.first_name ?? "",
        unsubscribeUrl,
      });
      sent++;
    }

    await adminClient.from("email_campaigns").insert({
      type,
      subject: subject || title,
      title,
      recipient_count: sent,
      sent_by: auth.profile.id,
    });

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error("[admin/marketing]", err);
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }
}

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmailBatch } from "@/lib/email";
import { isMerchSaleOpen } from "@/lib/merch";
import { merchAnnouncementSubject, renderMerchAnnouncementHtml } from "@/lib/merchAnnouncementEmail";
import { generateUnsubscribeToken } from "@/lib/unsubscribeToken";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ saleId: string }> };

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, first_name, email")
    .eq("user_id", user.id)
    .single();
  return profile?.role === "admin" ? profile : null;
}

async function loadSale(saleId: string) {
  const adminClient = createAdminClient();
  const [saleRes, itemsRes, settingsRes] = await Promise.all([
    adminClient.from("merch_sales").select("*").eq("id", saleId).single(),
    adminClient
      .from("merch_items")
      .select("name, price, image_url, variants")
      .eq("sale_id", saleId)
      .eq("active", true)
      .order("position"),
    adminClient.from("merch_settings").select("shop_enabled").maybeSingle(),
  ]);
  return {
    adminClient,
    sale: saleRes.data,
    items: itemsRes.data ?? [],
    shopEnabled: settingsRes.data?.shop_enabled ?? false,
  };
}

/** Destinataires : adhérents réels qui acceptent les emails promotionnels. */
async function loadRecipients(adminClient: ReturnType<typeof createAdminClient>) {
  const { data } = await adminClient
    .from("profiles")
    .select("id, first_name, email")
    .eq("role", "member")
    .eq("is_test_account", false)
    .eq("marketing_opt_in", true);
  return (data ?? []).filter((m) => m.email);
}

/** Aperçu de l'email et état de la vente, pour la fenêtre de confirmation. */
export async function GET(_request: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { saleId } = await params;
  const { adminClient, sale, items, shopEnabled } = await loadSale(saleId);
  if (!sale) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

  const recipients = await loadRecipients(adminClient);

  return NextResponse.json({
    subject: merchAnnouncementSubject(sale),
    html: renderMerchAnnouncementHtml({ sale, items, firstName: admin.first_name ?? "", unsubscribeUrl: "#" }),
    recipients: recipients.length,
    announcedAt: sale.announced_at,
    shopEnabled,
    saleOpen: isMerchSaleOpen(sale),
    itemCount: items.length,
  });
}

/** mode « test » : envoi à l'admin seul. mode « send » : envoi à tous les adhérents, une seule fois. */
export async function POST(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { saleId } = await params;
  const body = await request.json().catch(() => ({}));
  const mode = body?.mode;

  const { adminClient, sale, items, shopEnabled } = await loadSale(saleId);
  if (!sale) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

  const subject = merchAnnouncementSubject(sale);

  if (mode === "test") {
    if (!admin.email) return NextResponse.json({ error: "Aucune adresse email sur votre profil." }, { status: 400 });
    const sent = await sendEmailBatch([
      {
        to: admin.email,
        subject: `[TEST] ${subject}`,
        html: renderMerchAnnouncementHtml({ sale, items, firstName: admin.first_name ?? "", unsubscribeUrl: "#" }),
      },
    ]);
    if (!sent) return NextResponse.json({ error: "L'email de test n'a pas pu partir." }, { status: 502 });
    return NextResponse.json({ success: true, to: admin.email });
  }

  if (mode !== "send") return NextResponse.json({ error: "Mode invalide" }, { status: 400 });

  if (!shopEnabled) {
    return NextResponse.json({ error: "La boutique est désactivée : activez-la avant de prévenir les adhérents." }, { status: 400 });
  }
  if (!isMerchSaleOpen(sale)) {
    return NextResponse.json({ error: "La vente n'est pas ouverte aux commandes." }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "Ajoutez au moins un article avant d'annoncer la vente." }, { status: 400 });
  }

  // Réserve l'envoi : si deux clics arrivent en même temps, un seul passe.
  const { data: claimed } = await adminClient
    .from("merch_sales")
    .update({ announced_at: new Date().toISOString() })
    .eq("id", saleId)
    .is("announced_at", null)
    .select("id")
    .maybeSingle();
  if (!claimed) {
    return NextResponse.json({ error: "Cette vente a déjà été annoncée." }, { status: 409 });
  }

  const recipients = await loadRecipients(adminClient);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const messages = recipients.map((member) => ({
    to: member.email,
    subject,
    html: renderMerchAnnouncementHtml({
      sale,
      items,
      firstName: member.first_name ?? "",
      unsubscribeUrl: `${siteUrl}/api/unsubscribe?profile=${member.id}&token=${generateUnsubscribeToken(member.id)}`,
    }),
  }));

  const sent = await sendEmailBatch(messages);

  if (sent === 0 && messages.length > 0) {
    // Rien n'est parti : on libère la vente pour permettre un nouvel essai.
    await adminClient.from("merch_sales").update({ announced_at: null }).eq("id", saleId);
    return NextResponse.json({ error: "L'envoi a échoué, aucun email n'est parti. Réessayez dans un instant." }, { status: 502 });
  }

  await adminClient.from("email_campaigns").insert({
    type: "announcement",
    subject,
    title: sale.title,
    recipient_count: sent,
    sent_by: admin.id,
  });

  return NextResponse.json({ success: true, sent, total: messages.length });
}

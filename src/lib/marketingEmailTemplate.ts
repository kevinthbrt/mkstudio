// Pure HTML template for admin marketing campaigns — no server-only imports,
// so it can be reused client-side (live preview) and server-side (actual send).

export type MarketingCampaignType = "announcement" | "promotion" | "massage";

export const MARKETING_CAMPAIGN_TYPES: Record<
  MarketingCampaignType,
  { label: string; emoji: string; color: string; bg: string; border: string }
> = {
  announcement: { label: "Nouveauté", emoji: "🎉", color: "#D4AF37", bg: "#D4AF3722", border: "#D4AF3744" },
  promotion: { label: "Promotion", emoji: "🏷️", color: "#fb923c", bg: "#f9731633", border: "#f9731644" },
  massage: { label: "Massage bien-être", emoji: "💆", color: "#a78bfa", bg: "#7c3aed22", border: "#7c3aed44" },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mkstudio-training.fr";

export interface MarketingEmailParams {
  type: MarketingCampaignType;
  title: string;
  intro?: string;
  bodyText: string;
  imageUrl?: string;
  promoCode?: string;
  validUntil?: string;
  ctaText: string;
  ctaLink: string;
  firstName?: string;
  unsubscribeUrl?: string;
}

export function defaultSubjectForCampaign(type: MarketingCampaignType, title: string): string {
  const { emoji } = MARKETING_CAMPAIGN_TYPES[type];
  return title ? `${emoji} ${title}` : "";
}

export function renderMarketingEmailHtml(params: MarketingEmailParams): string {
  const {
    type,
    title,
    intro,
    bodyText,
    imageUrl,
    promoCode,
    validUntil,
    ctaText,
    ctaLink,
    firstName = "Prénom",
    unsubscribeUrl = "#",
  } = params;

  const meta = MARKETING_CAMPAIGN_TYPES[type];

  const bodyParagraphs = bodyText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="color:#d1d5db;font-size:14px;line-height:1.7;margin:0 0 16px;">${p.replace(/\n/g, "<br/>")}</p>`
    )
    .join("");

  const promoBox =
    promoCode || validUntil
      ? `<div style="background:#D4AF3711;border:1px dashed #D4AF3755;border-radius:10px;padding:16px;margin:8px 0 24px;text-align:center;">
          ${promoCode ? `<p style="color:#6b7280;font-size:12px;margin:0 0 4px;">Code promo</p>
          <p style="color:#D4AF37;font-size:20px;font-weight:800;letter-spacing:2px;margin:0 0 8px;">${promoCode}</p>` : ""}
          ${validUntil ? `<p style="color:#6b7280;font-size:12px;margin:0;">Valable jusqu'au ${validUntil}</p>` : ""}
        </div>`
      : "";

  const content = `
    <div style="display:inline-block;background:${meta.bg};border:1px solid ${meta.border};border-radius:8px;padding:6px 14px;margin-bottom:20px;">
      <span style="color:${meta.color};font-size:13px;font-weight:600;">${meta.emoji} ${meta.label}</span>
    </div>
    ${imageUrl ? `<img src="${imageUrl}" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-bottom:20px;display:block;" />` : ""}
    <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px;">${title}</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;">Bonjour ${firstName},${intro ? ` ${intro}` : ""}</p>
    <div style="height:1px;background:#1f1f1f;margin:24px 0;"></div>
    ${bodyParagraphs}
    ${promoBox}
    <div style="text-align:center;margin-top:8px;">
      <a href="${ctaLink}" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8941E);color:#000;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">${ctaText}</a>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MK Studio</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="width:56px;height:56px;background:linear-gradient(135deg,#D4AF37,#B8941E);border-radius:14px;margin:0 auto 12px auto;">
                <span style="color:#000;font-weight:800;font-size:20px;line-height:56px;display:block;text-align:center;">MK</span>
              </div>
              <div style="color:#D4AF37;font-size:22px;font-weight:700;letter-spacing:0.5px;">MK Studio</div>
            </td>
          </tr>
          <tr>
            <td style="background:#111111;border:1px solid #1f1f1f;border-radius:16px;padding:32px 28px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="color:#3a3a3a;font-size:12px;margin:0 0 6px;">
                MK Studio · <a href="${SITE_URL}" style="color:#3a3a3a;text-decoration:none;">${SITE_URL.replace("https://", "")}</a>
              </p>
              <p style="color:#3a3a3a;font-size:11px;margin:0;">
                Vous recevez cet email en tant qu'adhérent(e) MK Studio. <a href="${unsubscribeUrl}" style="color:#6b7280;">Se désinscrire des emails marketing</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

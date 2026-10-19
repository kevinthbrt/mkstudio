import type { MerchItem, MerchSale } from "@/types/database";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mkstudio-training.fr";
const MAX_ITEMS = 6;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const eur = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);

/** « 31 octobre » */
function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(
    new Date(iso)
  );
}

/** « 20 h » ou « 20 h 30 » */
function formatHour(iso: string): string {
  const [hours, minutes] = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  })
    .format(new Date(iso))
    .split(":");
  return minutes === "00" ? `${Number(hours)} h` : `${Number(hours)} h ${minutes}`;
}

export function merchAnnouncementSubject(sale: Pick<MerchSale, "closes_at">): string {
  return `La boutique MK Studio est ouverte jusqu'au ${formatDay(sale.closes_at)}`;
}

function itemCell(item: Pick<MerchItem, "name" | "price" | "image_url" | "variants">): string {
  const image = item.image_url
    ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" width="236" style="width:100%;height:auto;aspect-ratio:1/1;object-fit:cover;border-radius:10px;display:block;" />`
    : `<div style="width:100%;padding-top:100%;border-radius:10px;background:#1a1929;"></div>`;
  const sizes = item.variants.length
    ? `<p style="color:#6b7280;font-size:11px;margin:2px 0 0;">${item.variants.map(escapeHtml).join(" · ")}</p>`
    : "";
  return `<td width="50%" valign="top" style="padding:6px;">
      ${image}
      <p style="color:#ffffff;font-size:13px;font-weight:600;margin:10px 0 0;">${escapeHtml(item.name)}</p>
      <p style="color:#D4AF37;font-size:13px;font-weight:700;margin:2px 0 0;">${eur(Number(item.price))}</p>
      ${sizes}
    </td>`;
}

export function renderMerchAnnouncementHtml(params: {
  sale: Pick<MerchSale, "title" | "description" | "closes_at">;
  items: Pick<MerchItem, "name" | "price" | "image_url" | "variants">[];
  firstName: string;
  unsubscribeUrl: string;
}): string {
  const { sale, items, firstName, unsubscribeUrl } = params;
  const shown = items.slice(0, MAX_ITEMS);
  const hidden = items.length - shown.length;

  const rows: string[] = [];
  for (let i = 0; i < shown.length; i += 2) {
    rows.push(`<tr>${itemCell(shown[i])}${shown[i + 1] ? itemCell(shown[i + 1]) : '<td width="50%"></td>'}</tr>`);
  }

  const step = (n: number, text: string) => `<tr>
      <td width="28" valign="top" style="padding:0 0 10px;">
        <div style="width:22px;height:22px;border-radius:11px;background:#D4AF3722;color:#D4AF37;font-size:12px;font-weight:700;line-height:22px;text-align:center;">${n}</div>
      </td>
      <td style="color:#d1d5db;font-size:14px;line-height:1.6;padding:0 0 10px;">${text}</td>
    </tr>`;

  const content = `
    <div style="display:inline-block;background:#D4AF3722;border:1px solid #D4AF3744;border-radius:8px;padding:6px 14px;margin-bottom:20px;">
      <span style="color:#D4AF37;font-size:13px;font-weight:600;">🛍️ Boutique éphémère</span>
    </div>
    <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 16px;">${escapeHtml(sale.title)}</h1>
    <p style="color:#d1d5db;font-size:14px;line-height:1.7;margin:0 0 12px;">Bonjour ${escapeHtml(firstName)},</p>
    <p style="color:#d1d5db;font-size:14px;line-height:1.7;margin:0 0 12px;">Pour quelques jours seulement, la boutique MK Studio est ouverte.</p>
    ${sale.description ? `<p style="color:#9ca3af;font-size:14px;line-height:1.7;margin:0 0 12px;white-space:pre-line;">${escapeHtml(sale.description)}</p>` : ""}

    ${rows.length ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px -6px 4px;">${rows.join("")}</table>` : ""}
    ${hidden > 0 ? `<p style="color:#9ca3af;font-size:13px;margin:4px 0 0;">Et ${hidden} autre${hidden > 1 ? "s" : ""} article${hidden > 1 ? "s" : ""} à découvrir dans la boutique.</p>` : ""}

    <div style="height:1px;background:#1f1f1f;margin:24px 0;"></div>

    <p style="color:#ffffff;font-size:15px;font-weight:700;margin:0 0 14px;">Comment ça marche</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${step(1, "Tu choisis tes articles et tes tailles depuis ton espace adhérent, rubrique Boutique.")}
      ${step(2, "Tu règles par chèque, virement ou espèces.")}
      ${step(3, "Après la clôture, nous passons une commande groupée, puis tu récupères tes articles à la salle.")}
    </table>

    <p style="color:#d1d5db;font-size:14px;line-height:1.7;margin:12px 0 24px;">
      Les commandes sont ouvertes jusqu'au <strong style="color:#ffffff;">${formatDay(sale.closes_at)} à ${formatHour(sale.closes_at)}</strong>. Après cette date, la collection ne sera plus disponible.
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      <a href="${SITE_URL}/dashboard/boutique" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8941E);color:#000;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">Découvrir la collection</a>
    </div>

    <p style="color:#d1d5db;font-size:14px;line-height:1.7;margin:0;">À bientôt à la salle,<br/>Manon</p>
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
                Tu reçois cet email en tant qu'adhérent(e) MK Studio. <a href="${unsubscribeUrl}" style="color:#6b7280;">Se désinscrire des emails marketing</a>
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

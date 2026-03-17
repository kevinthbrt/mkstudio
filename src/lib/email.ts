import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "");
}
const FROM = process.env.RESEND_FROM_EMAIL ?? "MK Studio <noreply@mkstudio-training.fr>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mkstudio-training.fr";

// ─── Shared layout ────────────────────────────────────────────────────────────
function layout(content: string): string {
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
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="width:56px;height:56px;background:linear-gradient(135deg,#D4AF37,#B8941E);border-radius:14px;margin:0 auto 12px auto;">
                <span style="color:#000;font-weight:800;font-size:20px;line-height:56px;display:block;text-align:center;">MK</span>
              </div>
              <div style="color:#D4AF37;font-size:22px;font-weight:700;letter-spacing:0.5px;">MK Studio</div>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#111111;border:1px solid #1f1f1f;border-radius:16px;padding:32px 28px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="color:#3a3a3a;font-size:12px;margin:0;">
                MK Studio · <a href="${SITE_URL}" style="color:#3a3a3a;text-decoration:none;">${SITE_URL.replace("https://", "")}</a>
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

function btn(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8941E);color:#000;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;margin-top:8px;">${text}</a>`;
}

function divider(): string {
  return `<div style="height:1px;background:#1f1f1f;margin:24px 0;"></div>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;color:#6b7280;font-size:13px;">${label}</td>
    <td style="padding:8px 0;color:#ffffff;font-size:13px;font-weight:500;text-align:right;">${value}</td>
  </tr>`;
}

// ─── Welcome email ─────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, firstName: string) {
  const html = layout(`
    <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px;">Bienvenue chez MK Studio ! 🎉</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;">Bonjour ${firstName}, ton compte est prêt.</p>
    ${divider()}
    <p style="color:#d1d5db;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Tu fais maintenant partie de la communauté MK Studio. Tu peux dès maintenant consulter le planning, t'inscrire aux cours collectifs et suivre tes séances.
    </p>
    <p style="color:#d1d5db;font-size:14px;line-height:1.7;margin:0 0 28px;">
      Pour réserver des cours, assure-toi d'avoir des séances disponibles dans ton solde. N'hésite pas à contacter ton coach pour en savoir plus sur les offres disponibles.
    </p>
    <div style="text-align:center;">
      ${btn("Accéder à mon espace", `${SITE_URL}/dashboard`)}
    </div>
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Bienvenue chez MK Studio 🏋️",
    html,
  });
}

// ─── Booking confirmation ──────────────────────────────────────────────────────
export async function sendBookingConfirmationEmail(params: {
  to: string;
  firstName: string;
  sessionName: string;
  sessionDate: string;
  sessionTime: string;
  coachName: string;
  guests?: string[];
  minCancelHours?: number;
}) {
  const { to, firstName, sessionName, sessionDate, sessionTime, coachName, guests, minCancelHours } = params;

  const guestSection = guests && guests.length > 0
    ? `<tr>${infoRow("Invité(s)", guests.join(", "))}</tr>`
    : "";

  const cancelPolicy = minCancelHours != null
    ? `<div style="background:#f9731611;border:1px solid #f9731633;border-radius:10px;padding:14px;margin-bottom:24px;">
        <p style="color:#fb923c;font-size:13px;font-weight:600;margin:0 0 6px;">⚠️ Politique d&apos;annulation</p>
        <p style="color:#d1d5db;font-size:13px;line-height:1.6;margin:0;">
          Tu peux annuler ton inscription directement depuis ton espace MK Studio, <strong style="color:#ffffff;">jusqu&apos;à ${minCancelHours}h avant le cours</strong>. Passé ce délai, la séance sera décomptée de ton solde.
        </p>
      </div>`
    : `<p style="color:#6b7280;font-size:12px;margin:0 0 20px;">Pour annuler, rendez-vous sur ton espace MK Studio. Vérifie les délais d&apos;annulation autorisés.</p>`;

  const html = layout(`
    <div style="display:inline-block;background:#16a34a22;border:1px solid #16a34a44;border-radius:8px;padding:6px 14px;margin-bottom:20px;">
      <span style="color:#4ade80;font-size:13px;font-weight:600;">✓ Inscription confirmée</span>
    </div>
    <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 6px;">${sessionName}</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;">Bonjour ${firstName}, ta réservation est confirmée.</p>
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Date", sessionDate)}
      ${infoRow("Horaire", sessionTime)}
      ${infoRow("Coach", coachName)}
      ${guestSection}
    </table>
    ${divider()}
    ${cancelPolicy}
    <div style="text-align:center;">
      ${btn("Voir mon planning", `${SITE_URL}/dashboard`)}
    </div>
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Inscription confirmée — ${sessionName}`,
    html,
  });
}

// ─── Cancellation confirmation ─────────────────────────────────────────────────
export async function sendCancellationEmail(params: {
  to: string;
  firstName: string;
  sessionName: string;
  sessionDate: string;
  sessionTime: string;
  refundedSessions: number;
  sessionType: "collective" | "individual" | "duo";
}) {
  const { to, firstName, sessionName, sessionDate, sessionTime, refundedSessions, sessionType } = params;
  const balanceLabel = sessionType === "individual" ? "individuel" : sessionType === "duo" ? "duo" : "collectif";

  const html = layout(`
    <div style="display:inline-block;background:#f9731633;border:1px solid #f9731644;border-radius:8px;padding:6px 14px;margin-bottom:20px;">
      <span style="color:#fb923c;font-size:13px;font-weight:600;">Inscription annulée</span>
    </div>
    <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 6px;">${sessionName}</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;">Bonjour ${firstName}, ton annulation a bien été prise en compte.</p>
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Date", sessionDate)}
      ${infoRow("Horaire", sessionTime)}
      ${infoRow("Séances remboursées", `${refundedSessions} séance${refundedSessions > 1 ? "s" : ""} (solde ${balanceLabel})`)}
    </table>
    ${divider()}
    <p style="color:#d1d5db;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Tes séances ont été créditées sur ton compte. Tu peux te réinscrire à un autre cours depuis ton espace.
    </p>
    <div style="text-align:center;">
      ${btn("Voir le planning", `${SITE_URL}/dashboard/planning`)}
    </div>
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Annulation — ${sessionName}`,
    html,
  });
}

// ─── Purchase confirmation ─────────────────────────────────────────────────────
export async function sendPurchaseConfirmationEmail(params: {
  to: string;
  firstName: string;
  productName: string;
  amount: number;
  sessionCount: number;
  sessionType: "collective" | "individual" | "duo";
  invoiceNumber: string;
  orderId: string;
}) {
  const { to, firstName, productName, amount, sessionCount, sessionType, invoiceNumber, orderId } = params;
  const balanceLabel = sessionType === "individual" ? "individuel" : sessionType === "duo" ? "duo" : "collectif";
  const formattedAmount = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);

  const html = layout(`
    <div style="display:inline-block;background:#D4AF3722;border:1px solid #D4AF3744;border-radius:8px;padding:6px 14px;margin-bottom:20px;">
      <span style="color:#D4AF37;font-size:13px;font-weight:600;">Achat confirmé</span>
    </div>
    <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 6px;">${productName}</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;">Bonjour ${firstName}, ton achat a bien été enregistré.</p>
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Produit", productName)}
      ${infoRow("Montant", formattedAmount)}
      ${infoRow("Séances créditées", `${sessionCount} séance${sessionCount > 1 ? "s" : ""} (solde ${balanceLabel})`)}
      ${infoRow("N° facture", invoiceNumber)}
    </table>
    ${divider()}
    <p style="color:#d1d5db;font-size:14px;line-height:1.7;margin:0 0 24px;">
      Tes séances ont été ajoutées à ton solde ${balanceLabel}. Tu peux maintenant réserver tes cours.
    </p>
    <div style="text-align:center;margin-bottom:16px;">
      ${btn("Télécharger ma facture", `${SITE_URL}/api/invoices/${orderId}`)}
    </div>
    <div style="text-align:center;">
      ${btn("Voir le planning", `${SITE_URL}/dashboard/planning`)}
    </div>
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Confirmation d'achat — ${productName} (${invoiceNumber})`,
    html,
  });
}

// ─── Individual / Duo session booking by admin ────────────────────────────────
export async function sendIndividualSessionBookingEmail(params: {
  to: string;
  firstName: string;
  sessionName: string;
  sessionDate: string;
  sessionTime: string;
  coachName: string;
  recurring?: boolean;
  sessionType?: "individual" | "duo";
}) {
  const { to, firstName, sessionName, sessionDate, sessionTime, coachName, recurring, sessionType = "individual" } = params;
  const isDuo = sessionType === "duo";
  const label = isDuo ? "duo" : "individuelle";
  const subjectLabel = isDuo ? "Séance duo confirmée" : "Séance individuelle confirmée";

  const html = layout(`
    <div style="display:inline-block;background:#16a34a22;border:1px solid #16a34a44;border-radius:8px;padding:6px 14px;margin-bottom:20px;">
      <span style="color:#4ade80;font-size:13px;font-weight:600;">✓ Séance ${label} confirmée</span>
    </div>
    <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 6px;">${sessionName}</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;">Bonjour ${firstName}, ta séance ${label} est planifiée.</p>
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Date", sessionDate)}
      ${infoRow("Horaire", sessionTime)}
      ${infoRow("Coach", coachName)}
      ${recurring ? infoRow("Récurrence", "Chaque semaine") : ""}
    </table>
    ${divider()}
    <div style="background:#f9731611;border:1px solid #f9731633;border-radius:10px;padding:14px;margin-bottom:24px;">
      <p style="color:#fb923c;font-size:13px;font-weight:600;margin:0 0 6px;">⚠️ Politique d&apos;annulation</p>
      <p style="color:#d1d5db;font-size:13px;line-height:1.6;margin:0;">
        Pour annuler, contacte ton coach <strong style="color:#ffffff;">au moins 24h à l&apos;avance</strong>. Sans annulation dans ce délai, la séance sera décomptée de ton solde.
      </p>
    </div>
    <div style="text-align:center;">
      ${btn("Voir mon planning", `${SITE_URL}/dashboard`)}
    </div>
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${subjectLabel} — ${sessionName}`,
    html,
  });
}

// ─── Session cancelled by admin ────────────────────────────────────────────────
export async function sendSessionCancelledByAdminEmail(params: {
  to: string;
  firstName: string;
  sessionName: string;
  sessionDate: string;
  sessionTime: string;
  sessionType: "collective" | "individual" | "duo";
}) {
  const { to, firstName, sessionName, sessionDate, sessionTime, sessionType } = params;
  const balanceLabel = sessionType === "individual" ? "individuel" : sessionType === "duo" ? "duo" : "collectif";

  const html = layout(`
    <div style="display:inline-block;background:#f9731633;border:1px solid #f9731644;border-radius:8px;padding:6px 14px;margin-bottom:20px;">
      <span style="color:#fb923c;font-size:13px;font-weight:600;">Cours annulé</span>
    </div>
    <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 6px;">${sessionName}</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;">Bonjour ${firstName}, ce cours a été annulé par le coach.</p>
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Date", sessionDate)}
      ${infoRow("Horaire", sessionTime)}
    </table>
    ${divider()}
    <p style="color:#d1d5db;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Ta séance a été automatiquement remboursée sur ton solde ${balanceLabel}.
    </p>
    <div style="text-align:center;">
      ${btn("Voir le planning", `${SITE_URL}/dashboard/planning`)}
    </div>
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Cours annulé — ${sessionName}`,
    html,
  });
}

// ─── 24h reminder ─────────────────────────────────────────────────────────────
export async function sendSessionReminderEmail(params: {
  to: string;
  firstName: string;
  sessionName: string;
  sessionDate: string;
  sessionTime: string;
  coachName: string;
}) {
  const { to, firstName, sessionName, sessionDate, sessionTime, coachName } = params;

  const html = layout(`
    <div style="display:inline-block;background:#7c3aed22;border:1px solid #7c3aed44;border-radius:8px;padding:6px 14px;margin-bottom:20px;">
      <span style="color:#a78bfa;font-size:13px;font-weight:600;">⏰ Rappel — demain</span>
    </div>
    <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 6px;">${sessionName}</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;">Bonjour ${firstName}, tu as un cours demain !</p>
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Date", sessionDate)}
      ${infoRow("Horaire", sessionTime)}
      ${infoRow("Coach", coachName)}
    </table>
    ${divider()}
    <p style="color:#d1d5db;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Pense à préparer ta tenue et à arriver quelques minutes en avance. À demain !
    </p>
    <div style="text-align:center;">
      ${btn("Voir mon planning", `${SITE_URL}/dashboard`)}
    </div>
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Rappel — ${sessionName} demain à ${sessionTime}`,
    html,
  });
}

// ─── Waitlist confirmation email ───────────────────────────────────────────────
export async function sendWaitlistConfirmationEmail({
  to,
  firstName,
  sessionName,
  sessionDate,
  sessionTime,
  coachName,
  position,
}: {
  to: string;
  firstName: string;
  sessionName: string;
  sessionDate: string;
  sessionTime: string;
  coachName: string;
  position: number;
}) {
  const html = layout(`
    <div style="display:inline-block;background:#d9770622;border:1px solid #d9770644;border-radius:8px;padding:6px 14px;margin-bottom:20px;">
      <span style="color:#fb923c;font-size:13px;font-weight:600;">⏳ Liste d'attente</span>
    </div>
    <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 6px;">${sessionName}</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;">Bonjour ${firstName}, tu es inscrit(e) sur la liste d'attente.</p>
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Date", sessionDate)}
      ${infoRow("Horaire", sessionTime)}
      ${infoRow("Coach", coachName)}
      ${infoRow("Ta position", `#${position}`)}
    </table>
    ${divider()}
    <div style="background:#d9770611;border:1px solid #d9770633;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
      <p style="color:#fb923c;font-size:13px;margin:0;line-height:1.6;">
        Si une place se libère, tu seras automatiquement inscrit(e) et une séance sera débitée de ton solde. Tu recevras une notification et un email de confirmation.
      </p>
    </div>
    <p style="color:#6b7280;font-size:13px;margin:0 0 20px;">
      Tu peux quitter la liste d'attente à tout moment depuis le planning.
    </p>
    <div style="text-align:center;">
      ${btn("Voir le planning", `${SITE_URL}/dashboard/planning`)}
    </div>
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Liste d'attente — ${sessionName} le ${sessionDate}`,
    html,
  });
}

// ─── Waitlist promoted email ────────────────────────────────────────────────────
export async function sendWaitlistPromotedEmail({
  to,
  firstName,
  sessionName,
  sessionDate,
  sessionTime,
  coachName,
  minCancelHours,
}: {
  to: string;
  firstName: string;
  sessionName: string;
  sessionDate: string;
  sessionTime: string;
  coachName: string;
  minCancelHours: number;
}) {
  const html = layout(`
    <div style="display:inline-block;background:#16a34a22;border:1px solid #16a34a44;border-radius:8px;padding:6px 14px;margin-bottom:20px;">
      <span style="color:#4ade80;font-size:13px;font-weight:600;">🎉 Place obtenue !</span>
    </div>
    <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 6px;">${sessionName}</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;">Bonne nouvelle ${firstName} ! Une place s'est libérée et tu es inscrit(e) automatiquement.</p>
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Date", sessionDate)}
      ${infoRow("Horaire", sessionTime)}
      ${infoRow("Coach", coachName)}
      ${infoRow("Séance débitée", "1 séance collective")}
    </table>
    ${divider()}
    <div style="background:#d9770611;border:1px solid #d9770633;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
      <p style="color:#fb923c;font-size:13px;margin:0;line-height:1.6;">
        ⚠️ Annulation possible jusqu'à <strong>${minCancelHours}h avant</strong> le cours. Passé ce délai, la séance ne sera pas remboursée.
      </p>
    </div>
    <div style="text-align:center;">
      ${btn("Voir mon planning", `${SITE_URL}/dashboard/planning`)}
    </div>
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `✅ Tu es inscrit(e) — ${sessionName} le ${sessionDate}`,
    html,
  });
}

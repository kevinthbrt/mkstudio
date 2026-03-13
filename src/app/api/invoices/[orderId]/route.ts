import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function generateInvoiceHTML(
  order: any,
  member: any,
  product: any,
  settings: any
): string {
  const date = new Date(order.paid_at || order.created_at);
  const formattedDate = date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${order.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a1a;
      background: #fff;
      font-size: 14px;
      line-height: 1.6;
    }
    .page {
      max-width: 794px;
      margin: 0 auto;
      padding: 60px 60px;
      min-height: 1123px;
    }
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 50px;
      padding-bottom: 30px;
      border-bottom: 3px solid #D4AF37;
    }
    .logo-section h1 {
      font-size: 28px;
      font-weight: 900;
      color: #0a0a0a;
      letter-spacing: -0.5px;
    }
    .logo-section .subtitle {
      color: #D4AF37;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta .invoice-title {
      font-size: 32px;
      font-weight: 900;
      color: #0a0a0a;
      letter-spacing: -1px;
    }
    .invoice-meta .invoice-number {
      color: #D4AF37;
      font-size: 14px;
      font-weight: 700;
      margin-top: 4px;
    }
    .invoice-meta .invoice-date {
      color: #666;
      font-size: 12px;
      margin-top: 4px;
    }
    /* Parties */
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    .party-block h3 {
      font-size: 11px;
      font-weight: 700;
      color: #D4AF37;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
    }
    .party-block p {
      color: #333;
      font-size: 13px;
      line-height: 1.7;
    }
    .party-block .name {
      font-weight: 700;
      font-size: 15px;
      color: #0a0a0a;
    }
    /* Table */
    .table-section {
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead tr {
      background: #0a0a0a;
      color: #fff;
    }
    thead th {
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    thead th:last-child {
      text-align: right;
    }
    tbody tr {
      border-bottom: 1px solid #f0f0f0;
    }
    tbody td {
      padding: 16px;
      font-size: 13px;
      color: #333;
    }
    tbody td:last-child {
      text-align: right;
      font-weight: 600;
    }
    /* Totals */
    .totals {
      margin-left: auto;
      width: 300px;
      border: 2px solid #f0f0f0;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 40px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
    }
    .total-row:last-child {
      border-bottom: none;
      background: #0a0a0a;
      color: #fff;
    }
    .total-row.final span:last-child {
      color: #D4AF37;
      font-size: 18px;
      font-weight: 900;
    }
    .total-row span:first-child {
      font-size: 13px;
      color: #666;
    }
    .total-row.final span:first-child {
      color: #fff;
      font-weight: 700;
    }
    .total-row span:last-child {
      font-weight: 700;
      font-size: 14px;
    }
    /* Footer */
    .footer {
      margin-top: auto;
      padding-top: 30px;
      border-top: 1px solid #e0e0e0;
    }
    .tva-mention {
      background: #fff8e1;
      border: 1px solid #D4AF37;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 12px;
      color: #7a6000;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .legal-text {
      font-size: 11px;
      color: #999;
      line-height: 1.8;
    }
    .penalty-text {
      font-size: 11px;
      color: #bbb;
      margin-top: 8px;
    }
    @media print {
      body { background: white; }
      .page { padding: 40px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <h1>${settings.business_name}</h1>
        <div class="subtitle">Coach Sportif</div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">FACTURE</div>
        <div class="invoice-number">${order.invoice_number}</div>
        <div class="invoice-date">Émise le ${formattedDate}</div>
      </div>
    </div>

    <!-- Parties -->
    <div class="parties">
      <div class="party-block">
        <h3>Prestataire</h3>
        <p class="name">${settings.owner_name}</p>
        <p>${settings.business_name}</p>
        <p>${settings.address}</p>
        <p>${settings.postal_code} ${settings.city}</p>
        <p>${settings.country}</p>
        <p>Email : ${settings.email}</p>
        <p>Tél : ${settings.phone}</p>
        <p style="margin-top:8px;">SIRET : ${settings.siret}</p>
        ${settings.ape_code ? `<p>APE : ${settings.ape_code}</p>` : ""}
      </div>
      <div class="party-block">
        <h3>Client</h3>
        <p class="name">${member.first_name} ${member.last_name}</p>
        <p>Email : ${member.email}</p>
        ${member.phone ? `<p>Tél : ${member.phone}</p>` : ""}
      </div>
    </div>

    <!-- Table -->
    <div class="table-section">
      <table>
        <thead>
          <tr>
            <th style="width:50%">Description de la prestation</th>
            <th>Quantité</th>
            <th>Prix unitaire HT</th>
            <th>Montant HT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${product.name}</strong>
              ${product.description ? `<br><span style="color:#666;font-size:12px;">${product.description}</span>` : ""}
            </td>
            <td>${order.sessions_purchased} séance(s)</td>
            <td>${(order.amount / order.sessions_purchased).toFixed(2)} €</td>
            <td>${order.amount.toFixed(2)} €</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals">
      <div class="total-row">
        <span>Total HT</span>
        <span>${order.amount.toFixed(2)} €</span>
      </div>
      <div class="total-row">
        <span>TVA</span>
        <span>0,00 €</span>
      </div>
      <div class="total-row final">
        <span>TOTAL TTC</span>
        <span>${order.amount.toFixed(2)} €</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="tva-mention">
        ⚡ ${settings.tva_mention}
      </div>

      ${settings.bank_details ? `
      <div style="margin-bottom:16px; font-size:12px; color:#555;">
        <strong>Coordonnées bancaires :</strong><br>
        ${settings.bank_details}
      </div>
      ` : ""}

      <div class="legal-text">
        <strong>Conditions de paiement :</strong> ${settings.payment_terms}<br>
        Date de réalisation de la prestation : ${formattedDate}<br>
      </div>
      <div class="penalty-text">
        En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée,
        ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 €
        (art. L441-10 et D441-5 du Code de commerce).
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!userProfile) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  // Members can only access their own invoices
  if (userProfile.role !== "admin" && order.member_id !== userProfile.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const [{ data: member }, { data: product }, { data: settings }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", order.member_id).single(),
      supabase.from("products").select("*").eq("id", order.product_id).single(),
      supabase.from("invoice_settings").select("*").single(),
    ]);

  if (!member || !product) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 500 });
  }

  if (!settings) {
    return NextResponse.json(
      { error: "Paramètres de facturation non configurés" },
      { status: 400 }
    );
  }

  const html = generateInvoiceHTML(order, member, product, settings);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="facture-${order.invoice_number}.html"`,
    },
  });
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";

// Register Helvetica (built-in PDF font)
Font.registerHyphenationCallback((word) => [word]);

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  especes: "Espèces",
  virement: "Virement bancaire",
  cheque: "Chèque",
  carte: "Carte bancaire",
  helloasso: "HelloAsso",
};

const GOLD = "#D4AF37";
const BLACK = "#0a0a0a";
const DARK_GRAY = "#333333";
const LIGHT_GRAY = "#666666";
const BORDER_GRAY = "#e0e0e0";
const BG_LIGHT = "#fff8e1";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: BLACK,
    backgroundColor: "#ffffff",
    paddingTop: 36,
    paddingBottom: 36,
    paddingLeft: 48,
    paddingRight: 48,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2.5,
    borderBottomColor: GOLD,
  },
  businessName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: BLACK,
  },
  subtitle: {
    fontSize: 8,
    color: GOLD,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: BLACK,
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 10,
    color: GOLD,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    marginTop: 2,
  },
  invoiceDate: {
    fontSize: 8,
    color: LIGHT_GRAY,
    textAlign: "right",
    marginTop: 2,
  },
  // Parties
  parties: {
    flexDirection: "row",
    gap: 30,
    marginBottom: 20,
  },
  partyBlock: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BLACK,
    marginBottom: 2,
  },
  partyText: {
    fontSize: 9,
    color: DARK_GRAY,
    lineHeight: 1.5,
    marginBottom: 1,
  },
  // Table
  tableSection: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BLACK,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 8,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableCell: {
    fontSize: 9,
    color: DARK_GRAY,
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: BLACK,
  },
  tableCellDesc: {
    fontSize: 8,
    color: LIGHT_GRAY,
    marginTop: 2,
  },
  // Totals
  totalsContainer: {
    alignSelf: "flex-end",
    width: 220,
    borderWidth: 1.5,
    borderColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: BLACK,
  },
  totalLabel: {
    fontSize: 9,
    color: LIGHT_GRAY,
  },
  totalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BLACK,
  },
  totalLabelFinal: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  totalValueFinal: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
  },
  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: BORDER_GRAY,
    paddingTop: 14,
  },
  tvaMention: {
    backgroundColor: BG_LIGHT,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 8,
    color: "#7a6000",
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  legalText: {
    fontSize: 8,
    color: LIGHT_GRAY,
    lineHeight: 1.6,
    marginBottom: 2,
  },
  penaltyText: {
    fontSize: 7,
    color: "#bbbbbb",
    marginTop: 6,
    lineHeight: 1.5,
  },
  bankDetails: {
    fontSize: 8,
    color: "#555555",
    marginBottom: 8,
    lineHeight: 1.5,
  },
});

function InvoicePDF({
  order,
  member,
  product,
  settings,
}: {
  order: any;
  member: any;
  product: any;
  settings: any;
}) {
  const date = new Date(order.paid_at || order.created_at);
  const formattedDate = date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const unitPrice = (order.amount / order.sessions_purchased).toFixed(2);
  const totalHT = Number(order.amount).toFixed(2);
  const paymentLabel =
    PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method;

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },

      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(
            Text,
            { style: styles.businessName },
            settings.business_name
          ),
          React.createElement(
            Text,
            { style: styles.subtitle },
            "COACH SPORTIF"
          )
        ),
        React.createElement(
          View,
          null,
          React.createElement(
            Text,
            { style: styles.invoiceTitle },
            "FACTURE"
          ),
          React.createElement(
            Text,
            { style: styles.invoiceNumber },
            order.invoice_number
          ),
          React.createElement(
            Text,
            { style: styles.invoiceDate },
            `Émise le ${formattedDate}`
          )
        )
      ),

      // Parties
      React.createElement(
        View,
        { style: styles.parties },
        // Prestataire
        React.createElement(
          View,
          { style: styles.partyBlock },
          React.createElement(
            Text,
            { style: styles.partyLabel },
            "Prestataire"
          ),
          React.createElement(
            Text,
            { style: styles.partyName },
            settings.legal_status
              ? `${settings.owner_name} – ${settings.legal_status}`
              : settings.owner_name
          ),
          React.createElement(
            Text,
            { style: styles.partyText },
            settings.business_name
          ),
          settings.address
            ? React.createElement(
                Text,
                { style: styles.partyText },
                settings.address
              )
            : null,
          settings.postal_code || settings.city
            ? React.createElement(
                Text,
                { style: styles.partyText },
                `${settings.postal_code} ${settings.city}`.trim()
              )
            : null,
          settings.country
            ? React.createElement(
                Text,
                { style: styles.partyText },
                settings.country
              )
            : null,
          settings.email
            ? React.createElement(
                Text,
                { style: styles.partyText },
                `Email : ${settings.email}`
              )
            : null,
          settings.phone
            ? React.createElement(
                Text,
                { style: styles.partyText },
                `Tél : ${settings.phone}`
              )
            : null,
          React.createElement(
            Text,
            { style: { ...styles.partyText, marginTop: 4 } },
            `SIRET : ${settings.siret}`
          ),
          settings.ape_code
            ? React.createElement(
                Text,
                { style: styles.partyText },
                `APE : ${settings.ape_code}`
              )
            : null,
          null
        ),
        // Client
        React.createElement(
          View,
          { style: styles.partyBlock },
          React.createElement(Text, { style: styles.partyLabel }, "Client"),
          React.createElement(
            Text,
            { style: styles.partyName },
            `${member.first_name} ${member.last_name}`
          ),
          React.createElement(
            Text,
            { style: styles.partyText },
            `Email : ${member.email}`
          ),
          member.phone
            ? React.createElement(
                Text,
                { style: styles.partyText },
                `Tél : ${member.phone}`
              )
            : null
        )
      ),

      // Table
      React.createElement(
        View,
        { style: styles.tableSection },
        // Header row
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(
            Text,
            { style: { ...styles.tableHeaderCell, width: "45%" } },
            "Description de la prestation"
          ),
          React.createElement(
            Text,
            { style: { ...styles.tableHeaderCell, width: "20%" } },
            "Quantité"
          ),
          React.createElement(
            Text,
            { style: { ...styles.tableHeaderCell, width: "17.5%" } },
            "Prix unit. HT"
          ),
          React.createElement(
            Text,
            {
              style: {
                ...styles.tableHeaderCell,
                width: "17.5%",
                textAlign: "right",
              },
            },
            "Montant HT"
          )
        ),
        // Data row
        React.createElement(
          View,
          { style: styles.tableRow },
          React.createElement(
            View,
            { style: { width: "45%" } },
            React.createElement(
              Text,
              { style: styles.tableCellBold },
              product.name
            ),
            product.description
              ? React.createElement(
                  Text,
                  { style: styles.tableCellDesc },
                  product.description
                )
              : null
          ),
          React.createElement(
            Text,
            { style: { ...styles.tableCell, width: "20%" } },
            `${Number(order.sessions_purchased)} séance(s)`
          ),
          React.createElement(
            Text,
            { style: { ...styles.tableCell, width: "17.5%" } },
            `${unitPrice} €`
          ),
          React.createElement(
            Text,
            {
              style: {
                ...styles.tableCell,
                width: "17.5%",
                textAlign: "right",
                fontFamily: "Helvetica-Bold",
              },
            },
            `${totalHT} €`
          )
        )
      ),

      // Totals
      React.createElement(
        View,
        { style: styles.totalsContainer },
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, "Total HT"),
          React.createElement(
            Text,
            { style: styles.totalValue },
            `${totalHT} €`
          )
        ),
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, "TVA"),
          React.createElement(
            Text,
            { style: styles.totalValue },
            "0,00 €"
          )
        ),
        React.createElement(
          View,
          { style: styles.totalRowFinal },
          React.createElement(
            Text,
            { style: styles.totalLabelFinal },
            "TOTAL TTC"
          ),
          React.createElement(
            Text,
            { style: styles.totalValueFinal },
            `${totalHT} €`
          )
        )
      ),

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          { style: styles.tvaMention },
          `⚡ ${settings.tva_mention}`
        ),

        settings.bank_details
          ? React.createElement(
              View,
              { style: { marginBottom: 8 } },
              React.createElement(
                Text,
                { style: { ...styles.bankDetails, fontFamily: "Helvetica-Bold" } },
                "Coordonnées bancaires :"
              ),
              React.createElement(
                Text,
                { style: styles.bankDetails },
                settings.bank_details
              )
            )
          : null,

        React.createElement(
          Text,
          { style: styles.legalText },
          `Conditions de paiement : ${settings.payment_terms}\n` +
            (order.payment_method
              ? `Mode de paiement : ${paymentLabel}\n`
              : "") +
            `Date de réalisation de la prestation : ${formattedDate}`
        ),

        React.createElement(
          Text,
          { style: styles.penaltyText },
          "En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, " +
            "ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 € " +
            "(art. L441-10 et D441-5 du Code de commerce)."
        )
      )
    )
  );
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

  const effectiveSettings = settings ?? {
    business_name: "MK Studio",
    owner_name: "MK Studio",
    address: "",
    postal_code: "",
    city: "",
    country: "France",
    email: "",
    phone: "",
    siret: "À configurer",
    ape_code: null,
    tva_mention: "TVA non applicable, art. 293 B du CGI",
    payment_terms: "Paiement à réception de facture",
    invoice_prefix: "MKS",
    next_invoice_number: 1,
    logo_url: null,
    bank_details: null,
    stamp_url: null,
  };

  const element = React.createElement(InvoicePDF, {
    order,
    member,
    product,
    settings: effectiveSettings,
  }) as React.ReactElement<any>;

  const pdfBuffer = await renderToBuffer(element);
  const uint8 = new Uint8Array(pdfBuffer);

  const filename = `facture-${order.invoice_number || orderId}.pdf`;

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": uint8.byteLength.toString(),
    },
  });
}

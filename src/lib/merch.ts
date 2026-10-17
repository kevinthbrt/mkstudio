import type { MerchItem, MerchOrder, MerchOrderLine, MerchSale } from "@/types/database";

export type MerchPaymentMethod = MerchOrder["payment_method"];

export const MERCH_PAYMENT_METHODS: { value: MerchPaymentMethod; label: string }[] = [
  { value: "cheque", label: "Chèque" },
  { value: "virement", label: "Virement" },
  { value: "especes", label: "Espèces" },
];

export function merchPaymentLabel(method: string): string {
  return MERCH_PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}

export const MERCH_SALE_STATUS_LABELS: Record<MerchSale["status"], string> = {
  draft: "Brouillon",
  open: "Commandes ouvertes",
  supplier_ordered: "Commande fournisseur passée",
  completed: "Terminée",
};

/** Une vente accepte des commandes tant qu'elle est ouverte et que la date butoir n'est pas passée. */
export function isMerchSaleOpen(sale: Pick<MerchSale, "status" | "closes_at">, now = new Date()): boolean {
  return sale.status === "open" && new Date(sale.closes_at) > now;
}

/** Libellé de statut tel que l'admin le voit, en tenant compte de la date butoir. */
export function merchSaleStatusLabel(sale: Pick<MerchSale, "status" | "closes_at">): string {
  if (sale.status === "open" && !isMerchSaleOpen(sale)) return "Date butoir atteinte";
  return MERCH_SALE_STATUS_LABELS[sale.status];
}

/** Codes d'erreur renvoyés par place_merch_order / cancel_merch_order. */
const MERCH_ERROR_MESSAGES: Record<string, string> = {
  sale_not_found: "Cette vente n'existe pas.",
  sale_closed: "Les commandes sont fermées pour cette vente.",
  invalid_payment_method: "Choisissez un moyen de paiement.",
  invalid_lines: "Votre panier est vide ou invalide.",
  item_unavailable: "Un article de votre panier n'est plus disponible.",
  invalid_quantity: "Quantité invalide.",
  invalid_variant: "Choisissez une taille pour chaque article.",
  order_not_found: "Commande introuvable.",
  already_cancelled: "Cette commande est déjà annulée.",
  already_paid: "Cette commande est déjà réglée : contactez la salle pour l'annuler.",
};

export function merchErrorMessage(code: string | undefined): string {
  return (code && MERCH_ERROR_MESSAGES[code]) || "Une erreur est survenue. Réessayez.";
}

export interface MerchRecapRow {
  key: string;
  itemName: string;
  variant: string | null;
  quantity: number;
  amount: number;
}

/**
 * Totalise les quantités par article et par taille sur les commandes
 * confirmées : c'est la liste à transmettre au fournisseur.
 * Si les articles sont fournis, le tri suit leur ordre d'affichage et
 * l'ordre des tailles saisi par l'admin (S, M, L plutôt que L, M, S).
 */
export function buildMerchRecap(
  orders: (Pick<MerchOrder, "status"> & { lines: MerchOrderLine[] })[],
  items: Pick<MerchItem, "id" | "variants" | "position">[] = []
): MerchRecapRow[] {
  const rows = new Map<string, MerchRecapRow & { itemId: string | null }>();

  for (const order of orders) {
    if (order.status !== "confirmed") continue;
    for (const line of order.lines) {
      const key = `${line.item_id ?? line.item_name}::${line.variant ?? ""}`;
      const row = rows.get(key) ?? {
        key,
        itemId: line.item_id,
        itemName: line.item_name,
        variant: line.variant,
        quantity: 0,
        amount: 0,
      };
      row.quantity += line.quantity;
      row.amount += line.quantity * Number(line.unit_price);
      rows.set(key, row);
    }
  }

  const itemById = new Map(items.map((item) => [item.id, item]));
  const rank = (row: { itemId: string | null; variant: string | null }) => {
    const item = row.itemId ? itemById.get(row.itemId) : undefined;
    const variantIndex = item && row.variant ? item.variants.indexOf(row.variant) : -1;
    return [item?.position ?? Number.MAX_SAFE_INTEGER, variantIndex];
  };

  return [...rows.values()]
    .sort((a, b) => {
      const [posA, varA] = rank(a);
      const [posB, varB] = rank(b);
      return (
        posA - posB ||
        a.itemName.localeCompare(b.itemName, "fr") ||
        varA - varB ||
        (a.variant ?? "").localeCompare(b.variant ?? "", "fr", { numeric: true })
      );
    })
    .map((row) => ({
      key: row.key,
      itemName: row.itemName,
      variant: row.variant,
      quantity: row.quantity,
      amount: row.amount,
    }));
}

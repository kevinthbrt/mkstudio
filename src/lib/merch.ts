import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MerchItem, MerchOrder, MerchOrderLine, MerchSale } from "@/types/database";

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
  shop_disabled: "La boutique est fermée pour le moment.",
  invalid_payment_method: "Choisissez un moyen de paiement.",
  invalid_lines: "Votre panier est vide ou invalide.",
  item_unavailable: "Un article de votre panier n'est plus disponible.",
  invalid_quantity: "Quantité invalide.",
  invalid_variant: "Choisissez une taille pour chaque article.",
  order_not_found: "Commande introuvable.",
  already_cancelled: "Cette commande est déjà annulée.",
  already_paid: "Cette commande est déjà réglée : contactez la salle pour l'annuler.",
  sale_locked: "La commande fournisseur est passée : les commandes ne peuvent plus être modifiées.",
  member_not_found: "Adhérent introuvable.",
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

export interface ShopStatus {
  /** Interrupteur global de l'admin. */
  enabled: boolean;
  /** Vente qui accepte des commandes en ce moment (la plus proche de sa date butoir). */
  sale: Pick<MerchSale, "id" | "title" | "closes_at"> | null;
}

/** La boutique « saute aux yeux » uniquement quand elle est activée et qu'une vente est en cours. */
export function isShopLive(shop: ShopStatus | null | undefined): shop is ShopStatus & { sale: NonNullable<ShopStatus["sale"]> } {
  return Boolean(shop?.enabled && shop.sale);
}

/** Lit l'état de la boutique avec le client Supabase de l'utilisateur connecté. */
export async function fetchShopStatus(supabase: SupabaseClient<Database>): Promise<ShopStatus> {
  const [settingsRes, saleRes] = await Promise.all([
    supabase.from("merch_settings").select("shop_enabled").maybeSingle(),
    supabase
      .from("merch_sales")
      .select("id, title, closes_at")
      .eq("status", "open")
      .gt("closes_at", new Date().toISOString())
      .order("closes_at")
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    enabled: settingsRes.data?.shop_enabled ?? false,
    sale: saleRes.data ?? null,
  };
}

/** « encore 8 jours », « dernier jour », « encore 5 h ». */
export function timeLeftLabel(closesAt: string, now = Date.now()): string {
  const ms = new Date(closesAt).getTime() - now;
  const days = Math.floor(ms / 86_400_000);
  if (days >= 2) return `encore ${days} jours`;
  const hours = Math.max(1, Math.floor(ms / 3_600_000));
  return hours >= 24 ? "dernier jour" : `encore ${hours} h`;
}

/**
 * Écart entre ce qui a été encaissé et le total actuel d'une commande réglée
 * puis modifiée. Positif : reste à encaisser. Négatif : à rembourser.
 */
export function merchPaymentGap(order: Pick<MerchOrder, "paid_at" | "paid_amount" | "total">): number {
  if (!order.paid_at || order.paid_amount === null) return 0;
  return Math.round((Number(order.total) - Number(order.paid_amount)) * 100) / 100;
}

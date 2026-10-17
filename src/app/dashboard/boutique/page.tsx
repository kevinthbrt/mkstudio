"use client";

import { useCallback, useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SaleShop } from "@/components/boutique/SaleShop";
import { isMerchSaleOpen, merchPaymentLabel } from "@/lib/merch";
import { formatDateTime, formatPriceFromEuros } from "@/lib/utils";
import type { MerchItem, MerchOrder, MerchOrderLine, MerchSale } from "@/types/database";

type MyOrder = MerchOrder & { lines: MerchOrderLine[] };

interface BoutiqueData {
  enabled: boolean;
  sales: MerchSale[];
  items: MerchItem[];
  orders: MyOrder[];
}

async function fetchBoutique(): Promise<BoutiqueData> {
  const supabase = createClient();
  // RLS : l'adhérent ne voit que les ventes publiées et ses propres commandes.
  const [salesRes, ordersRes, settingsRes] = await Promise.all([
    supabase.from("merch_sales").select("*").order("closes_at"),
    supabase.from("merch_orders").select("*").order("created_at", { ascending: false }),
    supabase.from("merch_settings").select("shop_enabled").maybeSingle(),
  ]);
  const enabled = settingsRes.data?.shop_enabled ?? false;

  const sales = salesRes.data ?? [];
  const openSaleIds = enabled ? sales.filter((s) => isMerchSaleOpen(s)).map((s) => s.id) : [];
  const orders = ordersRes.data ?? [];
  const orderIds = orders.map((o) => o.id);

  const [itemsRes, linesRes] = await Promise.all([
    openSaleIds.length
      ? supabase.from("merch_items").select("*").in("sale_id", openSaleIds).eq("active", true).order("position")
      : Promise.resolve({ data: [] as MerchItem[] }),
    orderIds.length
      ? supabase.from("merch_order_lines").select("*").in("order_id", orderIds)
      : Promise.resolve({ data: [] as MerchOrderLine[] }),
  ]);

  const lines = linesRes.data ?? [];
  return {
    enabled,
    sales,
    items: itemsRes.data ?? [],
    orders: orders.map((o) => ({ ...o, lines: lines.filter((l) => l.order_id === o.id) })),
  };
}

/** Où en est la commande, du point de vue de l'adhérent. */
function orderProgress(order: MyOrder, sale: MerchSale | undefined): { label: string; variant: "gray" | "orange" | "blue" | "green" | "red" | "gold" } {
  if (order.status === "cancelled") return { label: "Annulée", variant: "red" };
  if (order.delivered_at) return { label: "Remise", variant: "green" };
  if (sale?.status === "supplier_ordered") return { label: "Commandée au fournisseur", variant: "blue" };
  if (sale && isMerchSaleOpen(sale)) return { label: "En attente de la date butoir", variant: "gold" };
  return { label: "En préparation", variant: "gray" };
}

export default function BoutiquePage() {
  const [data, setData] = useState<BoutiqueData | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(() => fetchBoutique().then(setData), []);

  useEffect(() => {
    let active = true;
    fetchBoutique().then((result) => {
      if (active) setData(result);
    });
    return () => {
      active = false;
    };
  }, []);

  async function cancelOrder(order: MyOrder) {
    if (!window.confirm("Annuler cette commande ?")) return;
    setCancellingId(order.id);
    setError("");
    const res = await fetch(`/api/boutique/orders/${order.id}/cancel`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) setError(body.error || "L'annulation a échoué.");
    await reload();
    setCancellingId(null);
  }

  if (!data) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const openSales = data.enabled ? data.sales.filter((s) => isMerchSaleOpen(s)) : [];
  const saleById = new Map(data.sales.map((s) => [s.id, s]));

  return (
    <div className="p-4 lg:p-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Boutique</h1>
        <p className="text-gray-500 text-sm mt-1">
          Les articles MK Studio en précommande. Vous réglez par chèque, virement ou espèces, et vous récupérez vos
          articles à la salle.
        </p>
      </div>

      {openSales.length === 0 ? (
        <Card className="p-10 text-center">
          <ShoppingBag size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">
            {data.enabled ? "Pas de vente en cours" : "La boutique est fermée pour le moment"}
          </p>
          <p className="text-gray-500 text-sm mt-1">Les prochaines collections apparaîtront ici.</p>
        </Card>
      ) : (
        openSales.map((sale) => (
          <SaleShop
            key={sale.id}
            sale={sale}
            items={data.items.filter((i) => i.sale_id === sale.id)}
            onOrdered={reload}
          />
        ))
      )}

      {data.orders.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">Mes commandes</h2>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="space-y-3">
            {data.orders.map((order) => {
              const sale = saleById.get(order.sale_id);
              const progress = orderProgress(order, sale);
              const canCancel =
                order.status === "confirmed" && !order.paid_at && sale !== undefined && isMerchSaleOpen(sale);

              return (
                <Card key={order.id} className={order.status === "cancelled" ? "p-4 opacity-60" : "p-4"}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{sale?.title ?? "Vente"}</p>
                        <Badge variant={progress.variant}>{progress.label}</Badge>
                        {order.status === "confirmed" && (
                          <Badge variant={order.paid_at ? "green" : "orange"}>
                            {order.paid_at ? "Réglée" : "À régler"}
                          </Badge>
                        )}
                      </div>
                      <ul className="mt-2 space-y-0.5 text-sm text-gray-300">
                        {order.lines.map((line) => (
                          <li key={line.id}>
                            {line.quantity} × {line.item_name}
                            {line.variant && <span className="text-gray-500"> · taille {line.variant}</span>}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-gray-500">
                        Commandée le {formatDateTime(order.created_at)} · règlement par{" "}
                        {merchPaymentLabel(order.payment_method).toLowerCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <p className="text-lg font-bold text-white">{formatPriceFromEuros(Number(order.total))}</p>
                      {canCancel && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:text-red-400"
                          loading={cancellingId === order.id}
                          onClick={() => cancelOrder(order)}
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

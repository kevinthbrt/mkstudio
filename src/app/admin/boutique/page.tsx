"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ChevronRight, Plus, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SaleFormModal, type SaleFormValues } from "@/components/boutique/SaleFormModal";
import { isMerchSaleOpen, merchSaleStatusLabel } from "@/lib/merch";
import { formatDateTime, formatPriceFromEuros } from "@/lib/utils";
import type { MerchOrder, MerchSale } from "@/types/database";

type OrderSummary = Pick<MerchOrder, "sale_id" | "status" | "total" | "paid_at">;

function statusVariant(sale: MerchSale): "gold" | "green" | "gray" | "blue" | "orange" {
  if (sale.status === "draft") return "gray";
  if (sale.status === "open") return isMerchSaleOpen(sale) ? "green" : "orange";
  if (sale.status === "supplier_ordered") return "blue";
  return "gold";
}

async function fetchBoutique() {
  const supabase = createClient();
  const [salesRes, ordersRes] = await Promise.all([
    supabase.from("merch_sales").select("*").order("closes_at", { ascending: false }),
    supabase.from("merch_orders").select("sale_id, status, total, paid_at"),
  ]);
  return { sales: salesRes.data ?? [], orders: (ordersRes.data ?? []) as OrderSummary[] };
}

export default function AdminBoutiquePage() {
  const router = useRouter();
  const [sales, setSales] = useState<MerchSale[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let active = true;
    fetchBoutique().then((data) => {
      if (!active) return;
      setSales(data.sales);
      setOrders(data.orders);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(values: SaleFormValues): Promise<string | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from("merch_sales").insert(values).select("id").single();
    if (error || !data) return "La vente n'a pas pu être créée.";
    setShowCreate(false);
    router.push(`/admin/boutique/${data.id}`);
    return null;
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Boutique</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ventes éphémères de merchandising : précommandes, puis commande groupée au fournisseur
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Nouvelle vente
        </Button>
      </div>

      {sales.length === 0 ? (
        <Card className="p-10 text-center">
          <ShoppingBag size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">Aucune vente pour l&apos;instant</p>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            Créez une vente, ajoutez vos articles avec leurs tailles, fixez une date butoir puis ouvrez les commandes.
          </p>
          <Button className="mt-5" onClick={() => setShowCreate(true)}>
            Créer une vente
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sales.map((sale) => {
            const saleOrders = orders.filter((o) => o.sale_id === sale.id && o.status === "confirmed");
            const total = saleOrders.reduce((sum, o) => sum + Number(o.total), 0);
            const paid = saleOrders
              .filter((o) => o.paid_at)
              .reduce((sum, o) => sum + Number(o.total), 0);

            return (
              <Link key={sale.id} href={`/admin/boutique/${sale.id}`}>
                <Card hover className="p-5 h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Badge variant={statusVariant(sale)}>{merchSaleStatusLabel(sale)}</Badge>
                      <h2 className="mt-3 text-lg font-bold text-white truncate">{sale.title}</h2>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                        <CalendarClock size={13} />
                        Date butoir : {formatDateTime(sale.closes_at)}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-gray-600 flex-shrink-0 mt-1" />
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-600">Commandes</p>
                      <p className="mt-1 text-lg font-bold text-white">{saleOrders.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-600">Montant</p>
                      <p className="mt-1 text-lg font-bold text-white">{formatPriceFromEuros(total)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-600">Encaissé</p>
                      <p className="mt-1 text-lg font-bold text-[#D4AF37]">{formatPriceFromEuros(paid)}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && (
        <SaleFormModal open sale={null} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}

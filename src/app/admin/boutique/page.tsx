"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ChevronRight, Eye, EyeOff, Plus, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SaleFormModal, type SaleFormValues } from "@/components/boutique/SaleFormModal";
import { isMerchSaleOpen, merchSaleStatusLabel } from "@/lib/merch";
import { cn } from "@/lib/utils";
import { formatDateTime, formatPriceFromEuros } from "@/lib/utils";
import type { MerchOrder, MerchSale } from "@/types/database";

type OrderSummary = Pick<MerchOrder, "sale_id" | "status" | "total" | "paid_at" | "paid_amount">;

function statusVariant(sale: MerchSale): "gold" | "green" | "gray" | "blue" | "orange" {
  if (sale.status === "draft") return "gray";
  if (sale.status === "open") return isMerchSaleOpen(sale) ? "green" : "orange";
  if (sale.status === "supplier_ordered") return "blue";
  return "gold";
}

async function fetchBoutique() {
  const supabase = createClient();
  const [salesRes, ordersRes, settingsRes] = await Promise.all([
    supabase.from("merch_sales").select("*").order("closes_at", { ascending: false }),
    supabase.from("merch_orders").select("sale_id, status, total, paid_at, paid_amount"),
    supabase.from("merch_settings").select("shop_enabled").maybeSingle(),
  ]);
  return {
    sales: salesRes.data ?? [],
    orders: (ordersRes.data ?? []) as OrderSummary[],
    enabled: settingsRes.data?.shop_enabled ?? false,
  };
}

export default function AdminBoutiquePage() {
  const router = useRouter();
  const [sales, setSales] = useState<MerchSale[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState("");

  useEffect(() => {
    let active = true;
    fetchBoutique().then((data) => {
      if (!active) return;
      setSales(data.sales);
      setOrders(data.orders);
      setEnabled(data.enabled);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function toggleShop() {
    setToggling(true);
    setToggleError("");
    const supabase = createClient();
    const { error } = await supabase
      .from("merch_settings")
      .update({ shop_enabled: !enabled, updated_at: new Date().toISOString() })
      .eq("id", true);
    if (error) setToggleError("Le réglage n'a pas pu être enregistré.");
    else {
      setEnabled(!enabled);
      // Rafraîchit la navigation (pastille « En cours », menu des adhérents).
      router.refresh();
    }
    setToggling(false);
  }

  async function handleCreate(values: SaleFormValues): Promise<string | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from("merch_sales").insert(values).select("id").single();
    if (error || !data) return "La vente n'a pas pu être créée.";
    setShowCreate(false);
    router.push(`/admin/boutique/${data.id}`);
    return null;
  }

  const openSale = sales.find((s) => isMerchSaleOpen(s));

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

      {/* Interrupteur global */}
      <Card className={cn("p-5", enabled && "border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)]")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
                enabled ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "bg-white/5 text-gray-500"
              )}
            >
              {enabled ? <Eye size={18} /> : <EyeOff size={18} />}
            </div>
            <div>
              <p className="font-semibold text-white">
                {enabled ? "Boutique activée" : "Boutique désactivée"}
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                {enabled
                  ? openSale
                    ? `Les adhérents voient « ${openSale.title} » mise en avant sur toutes leurs pages.`
                    : "Visible par les adhérents, mais aucune vente n'est ouverte : rien n'est mis en avant."
                  : "Invisible pour les adhérents, et aucune commande n'est acceptée. Vous pouvez préparer vos ventes tranquillement."}
              </p>
              {toggleError && <p className="mt-1 text-sm text-red-400">{toggleError}</p>}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Activer la boutique"
            disabled={toggling}
            onClick={toggleShop}
            className={cn(
              "relative h-8 w-14 flex-shrink-0 self-end rounded-full transition-colors disabled:opacity-50 sm:self-auto",
              enabled ? "bg-gradient-to-r from-[#C9A227] to-[#E8C84A]" : "bg-white/10"
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all",
                enabled ? "left-7" : "left-1"
              )}
            />
          </button>
        </div>
      </Card>

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
              .reduce((sum, o) => sum + Number(o.paid_amount ?? o.total), 0);

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

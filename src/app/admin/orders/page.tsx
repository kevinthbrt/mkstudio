"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { CreditCard, Plus, Download, FileText } from "lucide-react";
import { formatDate, formatPriceFromEuros } from "@/lib/utils";
import type { Product, Profile } from "@/types/database";

interface OrderWithDetails {
  id: string;
  amount: number;
  sessions_purchased: number;
  invoice_number: string;
  status: string;
  created_at: string;
  profiles: { first_name: string; last_name: string };
  products: { name: string };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSell, setShowSell] = useState(false);
  const [selling, setSelling] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [form, setForm] = useState({ member_id: "", product_id: "" });
  const [sellError, setSellError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const [ordersRes, membersRes, productsRes] = await Promise.all([
      supabase
        .from("orders")
        .select(`*, profiles (first_name, last_name), products (name)`)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "member").order("last_name"),
      supabase.from("products").select("*").eq("active", true),
    ]);

    setOrders((ordersRes.data as any[]) || []);
    setMembers(membersRes.data || []);
    setProducts(productsRes.data || []);
    setLoading(false);
  }

  async function handleSell(e: React.FormEvent) {
    e.preventDefault();
    setSelling(true);
    setSellError("");

    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setSellError(data.error || "Erreur lors de la vente");
    } else {
      setShowSell(false);
      setForm({ member_id: "", product_id: "" });
      loadData();
    }
    setSelling(false);
  }

  async function downloadInvoice(orderId: string) {
    setGeneratingId(orderId);
    try {
      const res = await fetch(`/api/invoices/${orderId}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const order = orders.find((o) => o.id === orderId);
        a.download = `facture-${order?.invoice_number || orderId}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (err) {
      console.error(err);
    }
    setGeneratingId(null);
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);

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
          <h1 className="text-2xl font-bold text-white">Ventes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Chiffre d&apos;affaires total :{" "}
            <span className="text-[#D4AF37] font-semibold">
              {formatPriceFromEuros(totalRevenue)}
            </span>
          </p>
        </div>
        <Button onClick={() => setShowSell(true)}>
          <Plus size={16} />
          Enregistrer une vente
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-10 text-center">
          <CreditCard size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Aucune vente enregistrée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#D4AF37] flex-shrink-0">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">
                  {order.profiles?.first_name} {order.profiles?.last_name}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {order.products?.name} — {order.sessions_purchased} séance(s)
                </p>
                <p className="text-gray-600 text-xs mt-0.5">
                  {order.invoice_number} — {formatDate(order.created_at)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <p className="text-[#D4AF37] font-bold">
                  {formatPriceFromEuros(order.amount)}
                </p>
                <Badge variant="green">Payé</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadInvoice(order.id)}
                  loading={generatingId === order.id}
                  className="text-xs"
                >
                  <Download size={12} />
                  Facture
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sell modal */}
      <Modal
        open={showSell}
        onClose={() => {
          setShowSell(false);
          setSellError("");
        }}
        title="Enregistrer une vente"
      >
        <form onSubmit={handleSell} className="space-y-4">
          <Select
            label="Adhérent"
            value={form.member_id}
            onChange={(e) => setForm({ ...form, member_id: e.target.value })}
            options={[
              { value: "", label: "Sélectionner un adhérent..." },
              ...members.map((m) => ({
                value: m.id,
                label: `${m.first_name} ${m.last_name}`,
              })),
            ]}
            required
          />
          <Select
            label="Produit"
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            options={[
              { value: "", label: "Sélectionner un produit..." },
              ...products.map((p) => ({
                value: p.id,
                label: `${p.name} — ${formatPriceFromEuros(p.price)} (${p.session_count} séances)`,
              })),
            ]}
            required
          />

          {form.product_id && (
            <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a]">
              {(() => {
                const product = products.find((p) => p.id === form.product_id);
                if (!product) return null;
                return (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Montant à encaisser</span>
                    <span className="text-[#D4AF37] font-bold text-lg">
                      {formatPriceFromEuros(product.price)}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {sellError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              <p className="text-sm text-red-400">{sellError}</p>
            </div>
          )}

          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg p-3">
            <p className="text-xs text-gray-400">
              ✓ La facture sera générée automatiquement
              <br />
              ✓ Les séances seront créditées sur le compte de l&apos;adhérent
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setShowSell(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={selling} className="flex-1">
              Valider la vente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

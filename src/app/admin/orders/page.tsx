"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { CreditCard, Plus, Download, FileText, Users, Zap } from "lucide-react";
import { formatDate, formatPriceFromEuros } from "@/lib/utils";
import type { Product, Profile } from "@/types/database";

interface OrderWithDetails {
  id: string;
  amount: number;
  sessions_purchased: number;
  invoice_number: string;
  status: string;
  payment_method: string | null;
  created_at: string;
  profiles: { first_name: string; last_name: string };
  products: { name: string; session_type: string };
}

const PAYMENT_METHODS = [
  { value: "especes", label: "Espèces" },
  { value: "virement", label: "Virement bancaire" },
  { value: "cheque", label: "Chèque" },
  { value: "carte", label: "Carte bancaire" },
  { value: "helloasso", label: "HelloAsso" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSell, setShowSell] = useState(false);
  const [selling, setSelling] = useState(false);
  const [form, setForm] = useState({ member_id: "", product_id: "", payment_method: "" });
  const [sellError, setSellError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const [ordersRes, membersRes, productsRes] = await Promise.all([
      supabase
        .from("orders")
        .select(`*, profiles (first_name, last_name), products (name, session_type)`)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "member").order("last_name"),
      supabase.from("products").select("*").eq("active", true).order("name"),
    ]);

    setOrders((ordersRes.data as unknown as OrderWithDetails[]) || []);
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
      setForm({ member_id: "", product_id: "", payment_method: "" });
      loadData();
    }
    setSelling(false);
  }

  async function downloadInvoice(orderId: string) {
    const res = await fetch(`/api/invoices/${orderId}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const order = orders.find((o) => o.id === orderId);
      a.download = `facture-${order?.invoice_number || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    }
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);

  const collectiveProducts = products.filter((p) => p.session_type === "collective" || !p.session_type);
  const individualProducts = products.filter((p) => p.session_type === "individual");

  const selectedProduct = products.find((p) => p.id === form.product_id);

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
          {orders.map((order) => {
            const isIndividual = order.products?.session_type === "individual";
            return (
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
                    {isIndividual ? " individuelles" : " collectives"}
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {order.invoice_number} — {formatDate(order.created_at)}
                    {order.payment_method && (
                      <> — {PAYMENT_METHODS.find(m => m.value === order.payment_method)?.label ?? order.payment_method}</>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <p className="text-[#D4AF37] font-bold">
                    {formatPriceFromEuros(order.amount)}
                  </p>
                  <div className="flex gap-1">
                    <Badge variant="green">Payé</Badge>
                    {isIndividual ? (
                      <Badge variant="blue">Individuel</Badge>
                    ) : (
                      <Badge variant="gray">Collectif</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadInvoice(order.id)}
                    className="text-xs"
                  >
                    <Download size={12} />
                    Facture
                  </Button>
                </div>
              </div>
            );
          })}
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

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-300">Produit</p>

            {collectiveProducts.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Users size={11} /> Packs collectifs
                </p>
                {collectiveProducts.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      form.product_id === p.id
                        ? "bg-[#D4AF37]/10 border-[#D4AF37]/40"
                        : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="product_id"
                        value={p.id}
                        checked={form.product_id === p.id}
                        onChange={() => setForm({ ...form, product_id: p.id })}
                        className="accent-[#D4AF37]"
                      />
                      <div>
                        <p className="text-white text-sm font-medium">{p.name}</p>
                        <p className="text-gray-500 text-xs">{p.session_count} séances</p>
                      </div>
                    </div>
                    <p className="text-[#D4AF37] font-bold text-sm">
                      {formatPriceFromEuros(p.price)}
                    </p>
                  </label>
                ))}
              </div>
            )}

            {individualProducts.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Zap size={11} /> Packs individuels
                </p>
                {individualProducts.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      form.product_id === p.id
                        ? "bg-blue-500/10 border-blue-500/40"
                        : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="product_id"
                        value={p.id}
                        checked={form.product_id === p.id}
                        onChange={() => setForm({ ...form, product_id: p.id })}
                        className="accent-blue-400"
                      />
                      <div>
                        <p className="text-white text-sm font-medium">{p.name}</p>
                        <p className="text-gray-500 text-xs">{p.session_count} séances</p>
                      </div>
                    </div>
                    <p className="text-blue-400 font-bold text-sm">
                      {formatPriceFromEuros(p.price)}
                    </p>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-gray-300">Mode de paiement</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    form.payment_method === m.value
                      ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-white"
                      : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={m.value}
                    checked={form.payment_method === m.value}
                    onChange={() => setForm({ ...form, payment_method: m.value })}
                    className="accent-[#D4AF37]"
                  />
                  <span className="text-sm">{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedProduct && (
            <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a]">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Montant à encaisser</span>
                <span className="text-[#D4AF37] font-bold text-lg">
                  {formatPriceFromEuros(selectedProduct.price)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Crédite le solde{" "}
                <span className={selectedProduct.session_type === "individual" ? "text-blue-400" : "text-[#D4AF37]"}>
                  {selectedProduct.session_type === "individual" ? "individuel" : "collectif"}
                </span>{" "}
                de l&apos;adhérent
              </p>
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
            <Button type="submit" loading={selling} className="flex-1" disabled={!form.member_id || !form.product_id || !form.payment_method}>
              Valider la vente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

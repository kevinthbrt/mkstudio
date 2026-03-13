"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckCircle, Package, Zap } from "lucide-react";
import { formatPriceFromEuros } from "@/lib/utils";
import type { Product } from "@/types/database";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileId, setProfileId] = useState("");
  const [sessionBalance, setSessionBalance] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [profileResult, productsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, session_balance")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("price", { ascending: true }),
    ]);

    if (profileResult.data) {
      setProfileId(profileResult.data.id);
      setSessionBalance(profileResult.data.session_balance);
    }
    setProducts(productsResult.data || []);
    setLoading(false);
  }

  async function handleBuy(product: Product) {
    setBuyingId(product.id);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(
          `Achat effectué ! ${product.session_count} séance(s) créditée(s). Facture ${data.invoice_number}`
        );
        setSessionBalance((s) => s + product.session_count);
        setTimeout(() => setSuccess(null), 6000);
      }
    } catch (err) {
      console.error(err);
    }
    setBuyingId(null);
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
      <div>
        <h1 className="text-2xl font-bold text-white">Boutique</h1>
        <p className="text-gray-500 text-sm mt-1">
          Solde actuel :{" "}
          <span className="text-[#D4AF37] font-semibold">
            {sessionBalance} séance(s)
          </span>
        </p>
      </div>

      {success && (
        <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
          <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-10 text-center">
          <Package size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Aucun produit disponible pour le moment</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card
              key={product.id}
              className="p-5 flex flex-col hover:border-[#D4AF37]/40 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                  <Zap size={18} className="text-[#D4AF37]" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#D4AF37]">
                    {formatPriceFromEuros(product.price)}
                  </p>
                </div>
              </div>

              <h3 className="text-white font-semibold">{product.name}</h3>
              {product.description && (
                <p className="text-gray-500 text-sm mt-1 flex-1">
                  {product.description}
                </p>
              )}

              <div className="mt-3 py-2 px-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm">Séances incluses</span>
                <span className="text-white font-bold">
                  {product.session_count}
                </span>
              </div>

              <div className="text-xs text-gray-600 mb-3">
                {(product.price / product.session_count).toFixed(2)} €/séance
              </div>

              <Button
                onClick={() => handleBuy(product)}
                loading={buyingId === product.id}
                className="w-full mt-auto"
              >
                Acheter maintenant
              </Button>
            </Card>
          ))}
        </div>
      )}

      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4">
        <p className="text-xs text-gray-500">
          ℹ️ Après votre achat, une facture sera générée automatiquement et
          disponible dans votre espace &quot;Achats & Factures&quot;. Les séances
          sont créditées instantanément sur votre compte.
        </p>
      </div>
    </div>
  );
}

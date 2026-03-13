"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Download, ShoppingBag } from "lucide-react";
import { formatDate, formatPriceFromEuros } from "@/lib/utils";

interface OrderWithProduct {
  id: string;
  amount: number;
  sessions_purchased: number;
  invoice_number: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  products: { name: string; description: string | null };
}

export default function PurchasesPage() {
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;
    setProfileId(profile.id);

    const { data } = await supabase
      .from("orders")
      .select(`*, products (name, description)`)
      .eq("member_id", profile.id)
      .order("created_at", { ascending: false });

    setOrders((data as any[]) || []);
    setLoading(false);
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
        a.download = `facture-${order?.invoice_number || orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (err) {
      console.error("Error downloading invoice:", err);
    }
    setGeneratingId(null);
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, o) => sum + o.amount, 0);
  const totalSessions = orders.reduce((sum, o) => sum + o.sessions_purchased, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Achats & Factures</h1>
        <p className="text-gray-500 text-sm mt-1">
          Retrouvez l&apos;ensemble de vos achats et téléchargez vos factures
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-gray-400 text-xs mb-1">Total dépensé</p>
          <p className="text-2xl font-bold text-[#D4AF37]">
            {formatPriceFromEuros(totalSpent)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-400 text-xs mb-1">Séances achetées</p>
          <p className="text-2xl font-bold text-white">{totalSessions}</p>
        </Card>
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-10 text-center">
          <ShoppingBag size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Aucun achat pour le moment</p>
          <p className="text-gray-600 text-sm mt-1">
            Achetez un pack pour commencer
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#D4AF37] flex-shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {order.products?.name}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {order.invoice_number} — {formatDate(order.created_at)}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-gray-400">
                        {order.sessions_purchased} séance(s)
                      </span>
                      <Badge variant="green">Payé</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#D4AF37] font-bold">
                    {formatPriceFromEuros(order.amount)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => downloadInvoice(order.id)}
                    loading={generatingId === order.id}
                  >
                    <Download size={14} />
                    Facture
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

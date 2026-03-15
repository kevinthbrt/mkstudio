"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  Download,
  ShoppingBag,
  Calendar,
  Clock,
  Users,
  Zap,
  XCircle,
} from "lucide-react";
import { formatDate, formatPriceFromEuros } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface OrderWithProduct {
  id: string;
  amount: number;
  sessions_purchased: number;
  invoice_number: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  products: { name: string; description: string | null; session_type: string } | null;
}

interface BookingWithDetails {
  id: string;
  status: "confirmed" | "cancelled";
  booked_at: string;
  cancelled_at: string | null;
  session_debited: boolean;
  class_sessions: {
    start_time: string;
    end_time: string;
    session_type: "collective" | "individual";
    class_types: { name: string } | null;
  } | null;
}

type HistoryItem =
  | { kind: "purchase"; date: string; data: OrderWithProduct }
  | { kind: "booking"; date: string; data: BookingWithDetails };

export default function PurchasesPage() {
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [profile, setProfile] = useState<Pick<Profile, "collective_balance" | "individual_balance"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"invoices" | "history">("invoices");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, collective_balance, individual_balance")
      .eq("user_id", user.id)
      .single();

    if (!profileData) return;
    setProfile(profileData);

    const [{ data: ordersData }, { data: bookingsData }] = await Promise.all([
      supabase
        .from("orders")
        .select(`*, products (name, description, session_type)`)
        .eq("member_id", profileData.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("class_bookings")
        .select(
          `*, class_sessions (start_time, end_time, session_type, class_types (name))`
        )
        .eq("member_id", profileData.id)
        .order("booked_at", { ascending: false }),
    ]);

    const typedOrders = (ordersData as any[]) || [];
    setOrders(typedOrders);

    const purchaseItems: HistoryItem[] = typedOrders.map((o) => ({
      kind: "purchase",
      date: o.created_at,
      data: o,
    }));

    const bookingItems: HistoryItem[] = ((bookingsData as any[]) || []).map(
      (b) => ({
        kind: "booking",
        date: b.booked_at,
        data: b,
      })
    );

    const merged = [...purchaseItems, ...bookingItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setHistory(merged);
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

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Achats & Historique</h1>
        <p className="text-gray-500 text-sm mt-1">
          Vos achats, factures et historique des séances
        </p>
      </div>

      {/* Remaining sessions */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-gray-400 text-xs mb-1">Séances collectives restantes</p>
          <p className="text-2xl font-bold text-[#D4AF37]">
            {profile?.collective_balance ?? 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-400 text-xs mb-1">Séances individuelles restantes</p>
          <p className="text-2xl font-bold text-white">{profile?.individual_balance ?? 0}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111111] border border-[#1f1f1f] rounded-xl p-1">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "invoices"
              ? "bg-[#1a1a1a] text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Factures ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "history"
              ? "bg-[#1a1a1a] text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Historique ({history.length})
        </button>
      </div>

      {/* Invoices tab */}
      {activeTab === "invoices" && (
        <>
          {orders.length === 0 ? (
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-10 text-center">
              <ShoppingBag size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Aucun achat pour le moment</p>
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
                          {order.products?.session_type === "individual" ? (
                            <Badge variant="blue">Individuel</Badge>
                          ) : (
                            <Badge variant="gold">Collectif</Badge>
                          )}
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
        </>
      )}

      {/* History tab */}
      {activeTab === "history" && (
        <>
          {history.length === 0 ? (
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-10 text-center">
              <Clock size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Aucune activité pour le moment</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {history.map((item, index) => (
                <div key={`${item.kind}-${item.data.id}`} className="flex gap-3">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-4 ${
                        item.kind === "purchase"
                          ? "bg-[#D4AF37]/10 border border-[#D4AF37]/30"
                          : item.kind === "booking" &&
                            (item.data as BookingWithDetails).status === "cancelled"
                          ? "bg-red-500/10 border border-red-500/30"
                          : (item.data as BookingWithDetails).class_sessions
                              ?.session_type === "individual"
                          ? "bg-blue-500/10 border border-blue-500/30"
                          : "bg-green-500/10 border border-green-500/30"
                      }`}
                    >
                      {item.kind === "purchase" ? (
                        <FileText size={14} className="text-[#D4AF37]" />
                      ) : (item.data as BookingWithDetails).status === "cancelled" ? (
                        <XCircle size={14} className="text-red-400" />
                      ) : (item.data as BookingWithDetails).class_sessions
                          ?.session_type === "individual" ? (
                        <Zap size={14} className="text-blue-400" />
                      ) : (
                        <Users size={14} className="text-green-400" />
                      )}
                    </div>
                    {index < history.length - 1 && (
                      <div className="w-px flex-1 bg-[#1f1f1f] my-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4 pt-3">
                    {item.kind === "purchase" ? (
                      <PurchaseHistoryRow
                        order={item.data as OrderWithProduct}
                        onDownload={() => downloadInvoice(item.data.id)}
                        loading={generatingId === item.data.id}
                      />
                    ) : (
                      <BookingHistoryRow booking={item.data as BookingWithDetails} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PurchaseHistoryRow({
  order,
  onDownload,
  loading,
}: {
  order: OrderWithProduct;
  onDownload: () => void;
  loading: boolean;
}) {
  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-white font-medium text-sm">{order.products?.name}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {formatDatetime(order.created_at)}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-xs text-gray-400">
              +{order.sessions_purchased} séance(s)
            </span>
            {order.products?.session_type === "individual" ? (
              <Badge variant="blue">Individuel</Badge>
            ) : (
              <Badge variant="gold">Collectif</Badge>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[#D4AF37] font-bold text-sm">
            {formatPriceFromEuros(order.amount)}
          </p>
          <button
            onClick={onDownload}
            disabled={loading}
            className="mt-1 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Download size={11} />
            {loading ? "..." : "Facture"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingHistoryRow({ booking }: { booking: BookingWithDetails }) {
  const session = booking.class_sessions;
  const isIndividual = session?.session_type === "individual";
  const isCancelled = booking.status === "cancelled";

  return (
    <div
      className={`border rounded-xl p-3 ${
        isCancelled
          ? "bg-red-500/5 border-red-500/20"
          : isIndividual
          ? "bg-blue-500/5 border-blue-500/20"
          : "bg-[#111111] border-[#1f1f1f]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`font-medium text-sm ${isCancelled ? "text-gray-500 line-through" : "text-white"}`}>
            {session?.class_types?.name || "Séance"}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            {session?.start_time
              ? formatDatetime(session.start_time)
              : formatDatetime(booking.booked_at)}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {isIndividual ? (
              <Badge variant="blue">Individuel</Badge>
            ) : (
              <Badge variant="gold">Collectif</Badge>
            )}
            {isCancelled ? (
              <Badge variant="red">Annulé</Badge>
            ) : (
              <Badge variant="green">Confirmé</Badge>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar size={11} />
            {session?.start_time
              ? new Date(session.start_time).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDatetime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

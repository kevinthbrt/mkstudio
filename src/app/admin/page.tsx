import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/Card";
import { Users, Zap, CreditCard, Calendar, ArrowRight } from "lucide-react";
import { formatPriceFromEuros, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { PushNotificationSetup } from "@/components/PushNotificationSetup";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalMembers },
    { data: recentOrders },
    { data: upcomingSessions },
    { data: allOrders },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "member"),
    supabase
      .from("orders")
      .select(`*, profiles (first_name, last_name), products (name)`)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("class_sessions")
      .select(`*, class_types (name, color)`)
      .gte("start_time", new Date().toISOString())
      .eq("is_cancelled", false)
      .order("start_time")
      .limit(5),
    supabase
      .from("orders")
      .select("amount, sessions_purchased"),
  ]);

  const totalRevenue = (allOrders || []).reduce((sum, o) => sum + o.amount, 0);
  const totalSessionsSold = (allOrders || []).reduce(
    (sum, o) => sum + o.sessions_purchased,
    0
  );

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.02) 60%, transparent 100%)",
          border: "1px solid rgba(212,175,55,0.12)",
        }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)", transform: "translate(30%, -30%)" }}
        />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#D4AF37]/60 uppercase tracking-widest mb-1">Administration</p>
            <h1 className="text-2xl font-black text-white tracking-tight">Tableau de bord</h1>
            <p className="text-gray-500 text-sm mt-1">Vue d&apos;ensemble de MK Studio</p>
          </div>
          <PushNotificationSetup />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Adhérents"
          value={totalMembers || 0}
          icon={<Users size={18} />}
          color="gold"
        />
        <StatCard
          title="Chiffre d'affaires"
          value={formatPriceFromEuros(totalRevenue)}
          icon={<CreditCard size={18} />}
          color="green"
        />
        <StatCard
          title="Séances vendues"
          value={totalSessionsSold}
          icon={<Zap size={18} />}
          color="blue"
        />
        <StatCard
          title="Cours à venir"
          value={upcomingSessions?.length || 0}
          icon={<Calendar size={18} />}
          color="purple"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ventes récentes</h2>
            <Link href="/admin/orders" className="text-[#D4AF37] text-xs font-semibold hover:text-[#F5E06B] flex items-center gap-1 transition-colors">
              Voir tout <ArrowRight size={11} />
            </Link>
          </div>

          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl p-4 flex items-center justify-between"
                  style={{
                    background: "linear-gradient(135deg, rgba(30,28,45,0.8) 0%, rgba(22,21,38,0.9) 100%)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div>
                    <p className="text-white text-sm font-semibold">
                      {(order.profiles as any)?.first_name}{" "}
                      {(order.profiles as any)?.last_name}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {(order.products as any)?.name} · {order.sessions_purchased} séance(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#D4AF37] font-bold text-sm">
                      {formatPriceFromEuros(order.amount)}
                    </p>
                    <Badge variant="green" className="mt-1">Payé</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl p-8 text-center"
              style={{ background: "linear-gradient(135deg, rgba(30,28,45,0.5) 0%, rgba(22,21,38,0.6) 100%)", border: "1px dashed rgba(255,255,255,0.06)" }}
            >
              <p className="text-gray-600 text-sm">Aucune vente</p>
            </div>
          )}
        </div>

        {/* Upcoming classes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prochains cours</h2>
            <Link href="/admin/planning" className="text-[#D4AF37] text-xs font-semibold hover:text-[#F5E06B] flex items-center gap-1 transition-colors">
              Gérer <ArrowRight size={11} />
            </Link>
          </div>

          {upcomingSessions && upcomingSessions.length > 0 ? (
            <div className="space-y-2">
              {upcomingSessions.map((session) => {
                const color = (session.class_types as any)?.color || "#D4AF37";
                return (
                  <div
                    key={session.id}
                    className="rounded-2xl p-4 flex items-center gap-3"
                    style={{
                      background: "linear-gradient(135deg, rgba(30,28,45,0.8) 0%, rgba(22,21,38,0.9) 100%)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: color + "20" }}
                    >
                      <Calendar size={16} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">
                        {(session.class_types as any)?.name}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {formatDateTime(session.start_time)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-gray-400">
                        {session.current_participants}/{session.max_participants}
                      </p>
                      <p className="text-xs text-gray-700">inscrits</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl p-8 text-center"
              style={{ background: "linear-gradient(135deg, rgba(30,28,45,0.5) 0%, rgba(22,21,38,0.6) 100%)", border: "1px dashed rgba(255,255,255,0.06)" }}
            >
              <p className="text-gray-600 text-sm">Aucun cours prévu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

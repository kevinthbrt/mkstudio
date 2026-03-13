import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/Card";
import { Users, Zap, CreditCard, Calendar } from "lucide-react";
import { formatPriceFromEuros, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

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
      <div>
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">
          Vue d&apos;ensemble de MK Studio
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Adhérents"
          value={totalMembers || 0}
          icon={<Users size={18} />}
        />
        <StatCard
          title="Chiffre d'affaires"
          value={formatPriceFromEuros(totalRevenue)}
          icon={<CreditCard size={18} />}
        />
        <StatCard
          title="Séances vendues"
          value={totalSessionsSold}
          icon={<Zap size={18} />}
        />
        <StatCard
          title="Cours à venir"
          value={upcomingSessions?.length || 0}
          icon={<Calendar size={18} />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">
              Ventes récentes
            </h2>
            <Link
              href="/admin/orders"
              className="text-[#D4AF37] text-xs font-medium hover:underline"
            >
              Voir tout
            </Link>
          </div>

          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {(order.profiles as any)?.first_name}{" "}
                      {(order.profiles as any)?.last_name}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {(order.products as any)?.name} —{" "}
                      {order.sessions_purchased} séance(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#D4AF37] font-bold text-sm">
                      {formatPriceFromEuros(order.amount)}
                    </p>
                    <Badge variant="green" className="mt-1">
                      Payé
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-6 text-center">
              <p className="text-gray-500 text-sm">Aucune vente</p>
            </div>
          )}
        </div>

        {/* Upcoming classes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">
              Prochains cours
            </h2>
            <Link
              href="/admin/planning"
              className="text-[#D4AF37] text-xs font-medium hover:underline"
            >
              Gérer
            </Link>
          </div>

          {upcomingSessions && upcomingSessions.length > 0 ? (
            <div className="space-y-2">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 flex items-center gap-3"
                >
                  <div
                    className="w-2 h-10 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        (session.class_types as any)?.color || "#D4AF37",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {(session.class_types as any)?.name}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {formatDateTime(session.start_time)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">
                      {session.current_participants}/{session.max_participants}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-6 text-center">
              <p className="text-gray-500 text-sm">Aucun cours prévu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

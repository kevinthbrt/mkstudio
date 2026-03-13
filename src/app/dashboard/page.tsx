import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/ui/Card";
import { Zap, Calendar, ShoppingBag, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatDateTime, formatPriceFromEuros } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export default async function MemberDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Upcoming bookings
  const { data: upcomingBookings } = await supabase
    .from("class_bookings")
    .select(`
      *,
      class_sessions (
        *,
        class_types (name, color)
      )
    `)
    .eq("member_id", profile.id)
    .eq("status", "confirmed")
    .gte("class_sessions.start_time", new Date().toISOString())
    .order("class_sessions(start_time)", { ascending: true })
    .limit(3);

  // Recent orders
  const { data: recentOrders } = await supabase
    .from("orders")
    .select(`*, products (name)`)
    .eq("member_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(3);

  // Total sessions booked
  const { count: totalBookings } = await supabase
    .from("class_bookings")
    .select("*", { count: "exact", head: true })
    .eq("member_id", profile.id)
    .eq("status", "confirmed");

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Bonjour, {profile.first_name} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Bienvenue dans votre espace personnel MK Studio
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Solde de séances"
          value={profile.session_balance}
          subtitle="séances disponibles"
          icon={<Zap size={18} />}
        />
        <StatCard
          title="Cours à venir"
          value={upcomingBookings?.length || 0}
          subtitle="prochains cours"
          icon={<Calendar size={18} />}
        />
        <StatCard
          title="Total réservations"
          value={totalBookings || 0}
          subtitle="depuis l'inscription"
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          title="Commandes"
          value={recentOrders?.length || 0}
          subtitle="achats effectués"
          icon={<ShoppingBag size={18} />}
        />
      </div>

      {/* Session balance highlight */}
      {profile.session_balance === 0 && (
        <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#B8941E]/10 border border-[#D4AF37]/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[#D4AF37] font-semibold text-sm">
              Votre solde est vide
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              Achetez un pack pour réserver des cours
            </p>
          </div>
          <Link
            href="/dashboard/shop"
            className="bg-gradient-to-r from-[#D4AF37] via-[#F5E06B] to-[#D4AF37] text-black font-semibold text-sm px-4 py-2 rounded-lg hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all"
          >
            Acheter
          </Link>
        </div>
      )}

      {/* Upcoming classes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Mes prochains cours</h2>
          <Link
            href="/dashboard/sessions"
            className="text-[#D4AF37] text-xs font-medium hover:underline"
          >
            Voir tout
          </Link>
        </div>

        {upcomingBookings && upcomingBookings.length > 0 ? (
          <div className="space-y-2">
            {upcomingBookings.map((booking) => {
              const session = booking.class_sessions as any;
              if (!session) return null;
              return (
                <div
                  key={booking.id}
                  className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 flex items-center gap-4"
                >
                  <div
                    className="w-2 h-12 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: session.class_types?.color || "#D4AF37",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">
                      {session.class_types?.name}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {formatDateTime(session.start_time)} — {session.coach_name}
                    </p>
                  </div>
                  <Badge variant="green">Confirmé</Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-6 text-center">
            <Calendar size={24} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aucun cours à venir</p>
            <Link
              href="/dashboard/planning"
              className="text-[#D4AF37] text-xs font-medium hover:underline mt-1 inline-block"
            >
              Voir le planning →
            </Link>
          </div>
        )}
      </div>

      {/* Recent purchases */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Achats récents</h2>
          <Link
            href="/dashboard/purchases"
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
                    {(order.products as any)?.name}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {order.sessions_purchased} séance(s) — {order.invoice_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#D4AF37] font-semibold text-sm">
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
            <ShoppingBag size={24} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aucun achat effectué</p>
          </div>
        )}
      </div>
    </div>
  );
}

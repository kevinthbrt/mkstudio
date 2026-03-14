import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/ui/Card";
import { Zap, Calendar, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
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
    .limit(5);

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
          title="Séances collectives"
          value={profile.collective_balance}
          subtitle="disponibles"
          icon={<Users size={18} />}
        />
        <StatCard
          title="Séances individuelles"
          value={profile.individual_balance}
          subtitle="disponibles"
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
      </div>

      {/* Low balance warning */}
      {profile.collective_balance === 0 && profile.individual_balance === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 font-semibold text-sm">Vos soldes sont vides</p>
          <p className="text-gray-400 text-xs mt-0.5">
            Contactez votre coach pour acheter un pack de séances.
          </p>
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
              const isIndividual = session.session_type === "individual";
              return (
                <div
                  key={booking.id}
                  className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 flex items-center gap-4"
                >
                  <div
                    className="w-2 h-12 rounded-full flex-shrink-0"
                    style={{ backgroundColor: session.class_types?.color || "#D4AF37" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">
                      {session.class_types?.name}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {formatDateTime(session.start_time)} — {session.coach_name}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="green">Confirmé</Badge>
                    {isIndividual && <Badge variant="blue">Individuel</Badge>}
                  </div>
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
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/ui/Card";
import { Zap, Calendar, Users, ArrowRight, UserPlus, Trophy } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { NotificationBanner } from "@/components/NotificationBanner";
import { XPBar } from "@/components/gamification/XPBar";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";

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

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const [xpRes, streakRes] = await Promise.all([
    db.from("user_xp").select("total_xp, level, title").eq("member_id", profile.id).maybeSingle(),
    db.from("user_streaks").select("current_streak_weeks, longest_streak_weeks").eq("member_id", profile.id).maybeSingle(),
  ]);

  const xpData = xpRes.data ?? { total_xp: 0, level: 1, title: "Novice" };
  const streakData = streakRes.data ?? { current_streak_weeks: 0, longest_streak_weeks: 0 };

  const xpThresholds = [0, 100, 300, 700, 1500, 3000, 6000, 12000, Infinity];
  const currentLevel = xpData.level as number;
  const xpForCurrentLevel = xpThresholds[currentLevel - 1];
  const xpForNextLevel = xpThresholds[currentLevel];
  const progressPercent =
    xpForNextLevel === Infinity
      ? 100
      : Math.round(((xpData.total_xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100);

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
    .order("booked_at", { ascending: false })
    .limit(20);

  const { count: totalBookings } = await supabase
    .from("class_bookings")
    .select("*", { count: "exact", head: true })
    .eq("member_id", profile.id)
    .eq("status", "confirmed");

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.03) 60%, transparent 100%)",
          border: "1px solid rgba(212,175,55,0.15)",
        }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)", transform: "translate(30%, -30%)" }}
        />
        <p className="text-xs font-semibold text-[#D4AF37]/70 uppercase tracking-widest mb-1">Bienvenue</p>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {profile.first_name} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Votre espace personnel MK Studio
        </p>
      </div>

      <NotificationBanner />

      {/* Gamification widget */}
      <Link href="/dashboard/achievements">
        <div
          className="rounded-2xl p-4 space-y-4 transition-all hover:border-[#D4AF37]/25 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, rgba(30,28,45,0.8) 0%, rgba(22,21,38,0.9) 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-[#D4AF37]" />
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Ma progression</span>
            </div>
            <ArrowRight size={12} className="text-gray-600" />
          </div>
          <XPBar
            level={currentLevel}
            title={xpData.title as string}
            totalXp={xpData.total_xp as number}
            xpForCurrentLevel={xpForCurrentLevel}
            xpForNextLevel={xpForNextLevel === Infinity ? null : xpForNextLevel}
            progressPercent={progressPercent}
            compact
          />
          {streakData.current_streak_weeks > 0 && (
            <StreakDisplay
              current={streakData.current_streak_weeks as number}
              longest={streakData.longest_streak_weeks as number}
              compact
            />
          )}
        </div>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Séances collectives"
          value={profile.collective_balance}
          subtitle="disponibles"
          icon={<Users size={18} />}
          color="gold"
        />
        <StatCard
          title="Séances individuelles"
          value={profile.individual_balance}
          subtitle="disponibles"
          icon={<Zap size={18} />}
          color="blue"
        />
        <StatCard
          title="Séances duo"
          value={profile.duo_balance ?? 0}
          subtitle="disponibles"
          icon={<UserPlus size={18} />}
          color="purple"
        />
        <StatCard
          title="Cours à venir"
          value={upcomingBookings?.length || 0}
          subtitle="prochains cours"
          icon={<Calendar size={18} />}
          color="green"
        />
      </div>

      {/* Low balance warning */}
      {profile.collective_balance === 0 && profile.individual_balance === 0 && (profile.duo_balance ?? 0) === 0 && (
        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
          <div>
            <p className="text-amber-400 font-semibold text-sm">Vos soldes sont épuisés</p>
            <p className="text-gray-500 text-xs mt-0.5">
              Contactez votre coach pour acheter un pack de séances.
            </p>
          </div>
        </div>
      )}

      {/* Upcoming classes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Mes prochains cours</h2>
          <Link
            href="/dashboard/sessions"
            className="text-[#D4AF37] text-xs font-semibold hover:text-[#F5E06B] flex items-center gap-1 transition-colors"
          >
            Voir tout <ArrowRight size={12} />
          </Link>
        </div>

        {(() => {
          const now = new Date().toISOString();
          const filtered = (upcomingBookings || [])
            .filter((b: any) => b.class_sessions && new Date(b.class_sessions.start_time) >= new Date())
            .sort((a: any, b: any) => new Date(a.class_sessions.start_time).getTime() - new Date(b.class_sessions.start_time).getTime())
            .slice(0, 5);
          return filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((booking: any) => {
              const session = booking.class_sessions as any;
              if (!session) return null;
              const isIndividual = session.session_type === "individual";
              const isDuo = session.session_type === "duo";
              return (
                <div
                  key={booking.id}
                  className="rounded-2xl p-4 flex items-center gap-4 transition-all"
                  style={{
                    background: "linear-gradient(135deg, rgba(30,28,45,0.8) 0%, rgba(22,21,38,0.9) 100%)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    className="w-1.5 h-12 rounded-full flex-shrink-0"
                    style={{ backgroundColor: session.class_types?.color || "#D4AF37" }}
                  />
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: (session.class_types?.color || "#D4AF37") + "20" }}
                  >
                    <Calendar size={16} style={{ color: session.class_types?.color || "#D4AF37" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">
                      {session.class_types?.name}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {formatDateTime(session.start_time)} · {session.coach_name}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end flex-shrink-0">
                    <Badge variant="green">Confirmé</Badge>
                    {isIndividual && <Badge variant="blue">Individuel</Badge>}
                    {isDuo && <Badge variant="purple">Duo</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Link href="/dashboard/planning">

            <div className="rounded-2xl p-8 text-center transition-all hover:border-[#D4AF37]/20 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, rgba(30,28,45,0.5) 0%, rgba(22,21,38,0.6) 100%)",
                border: "1px dashed rgba(255,255,255,0.06)",
              }}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-3">
                <Calendar size={20} className="text-[#D4AF37]" />
              </div>
              <p className="text-gray-400 text-sm font-medium">Aucun cours à venir</p>
              <p className="text-[#D4AF37] text-xs font-semibold mt-1">
                Consulter le planning →
              </p>
            </div>
          </Link>
        );
        })()}
      </div>
    </div>
  );
}

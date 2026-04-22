import { createClient } from "@/lib/supabase/server";
import { Users, CreditCard, Calendar, ArrowRight, Cake, UserCheck } from "lucide-react";
import { formatPriceFromEuros } from "@/lib/utils";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Current week: Monday → Sunday
  const today = new Date();
  const dow = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const [
    { count: totalMembers },
    { data: allOrders },
    { data: membersWithBirthday },
    { data: weekSessionsRaw },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "member"),
    supabase.from("orders").select("amount"),
    supabase
      .from("profiles")
      .select("first_name, last_name, date_of_birth")
      .eq("role", "member")
      .not("date_of_birth", "is", null),
    supabase
      .from("class_sessions")
      .select(`id, start_time, end_time, max_participants, current_participants, coach_name, session_type, class_types (name, color)`)
      .gte("start_time", weekStart.toISOString())
      .lte("start_time", weekEnd.toISOString())
      .eq("is_cancelled", false)
      .order("start_time"),
  ]);

  // Fetch confirmed bookings for this week's sessions (with member names)
  const sessionIds = (weekSessionsRaw || []).map((s) => s.id);

  interface BookingRow {
    id: string;
    class_session_id: string;
    guest_names: string | null;
    profiles: { first_name: string; last_name: string } | null;
  }

  let weekBookings: BookingRow[] = [];
  if (sessionIds.length > 0) {
    // Two-step: fetch bookings, then profiles
    const { data: rawBookings } = await supabase
      .from("class_bookings")
      .select("id, class_session_id, member_id, guest_names")
      .in("class_session_id", sessionIds)
      .eq("status", "confirmed");

    if (rawBookings && rawBookings.length > 0) {
      const memberIds = [...new Set(rawBookings.map((b) => b.member_id))];
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", memberIds);

      const profileMap = new Map((profileRows || []).map((p) => [p.id, p]));
      weekBookings = rawBookings.map((b) => ({
        id: b.id,
        class_session_id: b.class_session_id,
        guest_names: b.guest_names,
        profiles: profileMap.get(b.member_id) ?? null,
      }));
    }
  }

  // Index bookings by session id
  const bookingsBySession = new Map<string, BookingRow[]>();
  for (const b of weekBookings) {
    if (!bookingsBySession.has(b.class_session_id)) bookingsBySession.set(b.class_session_id, []);
    bookingsBySession.get(b.class_session_id)!.push(b);
  }

  const totalRevenue = (allOrders || []).reduce((s, o) => s + o.amount, 0);

  // Upcoming birthdays (next 30 days)
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const upcomingBirthdays = (membersWithBirthday || [])
    .map((m) => {
      const dob = new Date(m.date_of_birth + "T00:00:00");
      const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (next < todayMidnight) next.setFullYear(today.getFullYear() + 1);
      const diffDays = Math.round((next.getTime() - todayMidnight.getTime()) / 86400000);
      return { ...m, next, diffDays, age: next.getFullYear() - dob.getFullYear() };
    })
    .filter((m) => m.diffDays <= 30)
    .sort((a, b) => a.diffDays - b.diffDays);

  // Group sessions by day (key = YYYY-MM-DD)
  type SessionRow = NonNullable<typeof weekSessionsRaw>[number];
  const dayMap = new Map<string, { label: string; sessions: SessionRow[] }>();
  for (const session of weekSessionsRaw || []) {
    const d = new Date(session.start_time);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!dayMap.has(key)) {
      dayMap.set(key, {
        label: d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
        sessions: [],
      });
    }
    dayMap.get(key)!.sessions.push(session);
  }
  const sessionDays = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(30,28,45,0.8) 100%)", border: "1px solid rgba(212,175,55,0.15)" }}
        >
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
            <Users size={18} className="text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-gray-500 text-xs">Adhérents</p>
            <p className="text-white font-black text-xl leading-tight">{totalMembers ?? 0}</p>
          </div>
        </div>
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(30,28,45,0.8) 100%)", border: "1px solid rgba(34,197,94,0.12)" }}
        >
          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
            <CreditCard size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-gray-500 text-xs">Chiffre d&apos;affaires</p>
            <p className="text-white font-black text-xl leading-tight">{formatPriceFromEuros(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Members & Birthdays */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg, rgba(30,28,45,0.8) 0%, rgba(22,21,38,0.9) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserCheck size={15} className="text-[#D4AF37]" />
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Adhérents</h2>
          </div>
          <Link href="/admin/members" className="text-[#D4AF37] text-xs font-semibold hover:text-[#F5E06B] flex items-center gap-1 transition-colors">
            Gérer <ArrowRight size={11} />
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
            <Users size={24} className="text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{totalMembers ?? 0}</p>
            <p className="text-gray-500 text-sm">membre{(totalMembers ?? 0) !== 1 ? "s" : ""} actif{(totalMembers ?? 0) !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {upcomingBirthdays.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Cake size={13} className="text-pink-400" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Anniversaires à venir</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {upcomingBirthdays.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{
                    background: m.diffDays === 0 ? "rgba(236,72,153,0.08)" : "rgba(255,255,255,0.03)",
                    border: m.diffDays === 0 ? "1px solid rgba(236,72,153,0.25)" : "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center flex-shrink-0">
                    <Cake size={14} className="text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{m.first_name} {m.last_name}</p>
                    <p className="text-gray-500 text-xs">{m.age} ans · {m.next.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {m.diffDays === 0 ? (
                      <span className="text-xs font-bold text-pink-400">Aujourd&apos;hui !</span>
                    ) : m.diffDays === 1 ? (
                      <span className="text-xs font-semibold text-pink-300">Demain</span>
                    ) : (
                      <span className="text-xs text-gray-600">J-{m.diffDays}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {upcomingBirthdays.length === 0 && (
          <p className="text-gray-600 text-xs">Aucun anniversaire dans les 30 prochains jours</p>
        )}
      </div>

      {/* Cours de la semaine */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-[#D4AF37]" />
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Cours de la semaine
            </h2>
          </div>
          <Link href="/admin/planning" className="text-[#D4AF37] text-xs font-semibold hover:text-[#F5E06B] flex items-center gap-1 transition-colors">
            Planning <ArrowRight size={11} />
          </Link>
        </div>

        {sessionDays.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "linear-gradient(135deg, rgba(30,28,45,0.5) 0%, rgba(22,21,38,0.6) 100%)", border: "1px dashed rgba(255,255,255,0.06)" }}
          >
            <Calendar size={28} className="text-gray-700 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Aucun cours cette semaine</p>
          </div>
        ) : (
          <div className="space-y-5">
            {sessionDays.map(([dayKey, { label, sessions }]) => {
              const isToday =
                dayKey ===
                `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              return (
                <div key={dayKey}>
                  {/* Day header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider capitalize ${isToday ? "text-[#D4AF37]" : "text-gray-500"}`}
                    >
                      {label}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] px-2 py-0.5 rounded-full">
                        Aujourd&apos;hui
                      </span>
                    )}
                  </div>

                  {/* Sessions */}
                  <div className="space-y-2">
                    {sessions.map((session) => {
                      const color = (session.class_types as any)?.color ?? "#D4AF37";
                      const name = (session.class_types as any)?.name ?? "—";
                      const bookings = bookingsBySession.get(session.id) ?? [];
                      const confirmedCount = bookings.length;

                      return (
                        <div
                          key={session.id}
                          className="rounded-2xl p-4"
                          style={{
                            background: "linear-gradient(135deg, rgba(30,28,45,0.8) 0%, rgba(22,21,38,0.9) 100%)",
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          {/* Session header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: color + "20" }}
                              >
                                <Calendar size={15} style={{ color }} />
                              </div>
                              <div>
                                <p className="text-white text-sm font-bold">{name}</p>
                                <p className="text-gray-500 text-xs">
                                  {fmtTime(session.start_time)} – {fmtTime(session.end_time)} · {session.coach_name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p
                                className="text-xs font-bold"
                                style={{ color: confirmedCount >= session.max_participants ? "#f87171" : color }}
                              >
                                {confirmedCount}/{session.max_participants}
                              </p>
                              <p className="text-xs text-gray-700">inscrits</p>
                            </div>
                          </div>

                          {/* Enrolled members */}
                          {bookings.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {bookings.map((b) => {
                                const memberName = b.profiles
                                  ? `${b.profiles.first_name} ${b.profiles.last_name.charAt(0)}.`
                                  : "—";
                                return (
                                  <span
                                    key={b.id}
                                    className="text-xs text-gray-300 bg-white/5 border border-white/8 rounded-lg px-2 py-1 leading-none"
                                  >
                                    {memberName}
                                    {b.guest_names && (
                                      <span className="text-gray-500 ml-1">+invité(s)</span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-700 text-xs italic">Aucun inscrit</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

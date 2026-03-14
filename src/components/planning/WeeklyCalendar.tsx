"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  User,
  Zap,
  AlertTriangle,
} from "lucide-react";
import {
  getWeekDays,
  isSameDay,
  formatTime,
  formatDate,
} from "@/lib/utils";

interface ClassSessionWithType {
  id: string;
  start_time: string;
  end_time: string;
  coach_name: string;
  max_participants: number;
  current_participants: number;
  min_cancel_hours: number;
  is_cancelled: boolean;
  session_type: "collective" | "individual";
  assigned_member_id: string | null;
  class_types: {
    name: string;
    color: string;
    description: string | null;
  };
}

interface CalendarProps {
  memberId?: string;
  collectiveBalance?: number;
  individualBalance?: number;
  isAdmin?: boolean;
}

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function WeeklyCalendar({
  memberId,
  collectiveBalance = 0,
  individualBalance = 0,
  isAdmin = false,
}: CalendarProps) {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<ClassSessionWithType[]>([]);
  const [bookings, setBookings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ClassSessionWithType | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const weekDays = getWeekDays(currentWeek);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const start = weekDays[0].toISOString();
    const end = new Date(weekDays[6].getTime() + 86400000).toISOString();

    // Members see collective + their individual sessions (filtered by RLS)
    // Admins see all sessions
    const { data: sessionsData } = await supabase
      .from("class_sessions")
      .select(`*, class_types (name, color, description)`)
      .gte("start_time", start)
      .lte("start_time", end)
      .eq("is_cancelled", false)
      .order("start_time");

    setSessions((sessionsData as ClassSessionWithType[]) || []);

    if (memberId) {
      const { data: bookingsData } = await supabase
        .from("class_bookings")
        .select("class_session_id, status")
        .eq("member_id", memberId);

      const bookingMap: Record<string, string> = {};
      (bookingsData || []).forEach((b) => {
        bookingMap[b.class_session_id] = b.status;
      });
      setBookings(bookingMap);
    }

    setLoading(false);
  }

  async function handleBook(session: ClassSessionWithType) {
    if (!memberId) return;
    // Only collective sessions can be self-booked by members
    if (!isAdmin && session.session_type === "individual") return;

    setBooking(true);
    setBookingError("");

    const isBooked = bookings[session.id] === "confirmed";

    if (isBooked) {
      // Cancel booking
      const supabase = createClient();
      const sessionStart = new Date(session.start_time);
      const now = new Date();
      const hoursLeft = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursLeft < session.min_cancel_hours) {
        setBookingError(
          `Annulation impossible : moins de ${session.min_cancel_hours}h avant le cours.`
        );
        setBooking(false);
        return;
      }

      const { data: existingBooking } = await supabase
        .from("class_bookings")
        .select("id, session_debited")
        .eq("member_id", memberId)
        .eq("class_session_id", session.id)
        .eq("status", "confirmed")
        .single();

      if (existingBooking) {
        await supabase
          .from("class_bookings")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("id", existingBooking.id);

        if (existingBooking.session_debited) {
          if (session.session_type === "individual") {
            await supabase.rpc("increment_individual_balance", { p_member_id: memberId });
          } else {
            await supabase.rpc("increment_collective_balance", { p_member_id: memberId });
          }
        }

        await supabase.rpc("decrement_participants", { session_id: session.id });
      }

      setBookings((b) => ({ ...b, [session.id]: "cancelled" }));
      setSessions((s) =>
        s.map((sess) =>
          sess.id === session.id
            ? { ...sess, current_participants: Math.max(0, sess.current_participants - 1) }
            : sess
        )
      );
    } else {
      // Book session — only collective for members
      const balance = session.session_type === "individual" ? individualBalance : collectiveBalance;

      if (balance <= 0 && !isAdmin) {
        setBookingError(
          session.session_type === "individual"
            ? "Solde individuel insuffisant."
            : "Solde collectif insuffisant. Contactez votre coach pour acheter un pack."
        );
        setBooking(false);
        return;
      }

      if (session.current_participants >= session.max_participants) {
        setBookingError("Ce cours est complet.");
        setBooking(false);
        return;
      }

      const supabase = createClient();

      const { error } = await supabase.from("class_bookings").upsert(
        {
          member_id: memberId,
          class_session_id: session.id,
          status: "confirmed",
          session_debited: true,
          booked_at: new Date().toISOString(),
          cancelled_at: null,
        },
        { onConflict: "member_id,class_session_id" }
      );

      if (error) {
        setBookingError("Une erreur est survenue. Réessayez.");
        setBooking(false);
        return;
      }

      if (session.session_type === "individual") {
        await supabase.rpc("decrement_individual_balance", { p_member_id: memberId });
      } else {
        await supabase.rpc("decrement_collective_balance", { p_member_id: memberId });
      }

      await supabase.rpc("increment_participants", { session_id: session.id });

      setBookings((b) => ({ ...b, [session.id]: "confirmed" }));
      setSessions((s) =>
        s.map((sess) =>
          sess.id === session.id
            ? { ...sess, current_participants: sess.current_participants + 1 }
            : sess
        )
      );
    }

    setBooking(false);
  }

  const prevWeek = () => {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() - 7);
    setCurrentWeek(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() + 7);
    setCurrentWeek(d);
  };

  const today = new Date();

  function getSessionBadge(session: ClassSessionWithType) {
    const isBooked = bookings[session.id] === "confirmed";
    const isFull = session.current_participants >= session.max_participants;
    const isIndividual = session.session_type === "individual";

    if (isBooked) return <Badge variant="green">Inscrit</Badge>;
    if (isIndividual) return <Badge variant="blue">Individuel</Badge>;
    if (isFull) return <Badge variant="red">Complet</Badge>;
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={prevWeek}>
          <ChevronLeft size={16} />
        </Button>
        <div className="text-center">
          <p className="text-white font-medium text-sm">
            {formatDate(weekDays[0].toISOString())} —{" "}
            {formatDate(weekDays[6].toISOString())}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={nextWeek}>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Mobile: day list */}
      <div className="lg:hidden space-y-4">
        {weekDays.map((day, dayIdx) => {
          const daySessions = sessions.filter((s) =>
            isSameDay(new Date(s.start_time), day)
          );
          const isToday = isSameDay(day, today);

          return (
            <div key={dayIdx}>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#1f1f1f]">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    isToday ? "bg-[#D4AF37] text-black" : "bg-[#1a1a1a] text-gray-400"
                  }`}
                >
                  {day.getDate()}
                </div>
                <span className="text-sm font-medium text-gray-300">
                  {DAYS_FULL_FR[dayIdx]}
                </span>
                {daySessions.length === 0 && (
                  <span className="text-xs text-gray-600 ml-auto">Pas de cours</span>
                )}
              </div>

              {daySessions.map((session) => {
                const isBooked = bookings[session.id] === "confirmed";
                const isFull = session.current_participants >= session.max_participants;
                const isIndividual = session.session_type === "individual";

                return (
                  <div
                    key={session.id}
                    className={`border rounded-xl p-3 mb-2 cursor-pointer transition-colors ${
                      isBooked
                        ? "bg-[#D4AF37]/10 border-[#D4AF37]/30"
                        : isIndividual
                        ? "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40"
                        : "bg-[#111111] border-[#1f1f1f] hover:border-[#D4AF37]/30"
                    }`}
                    onClick={() => {
                      setSelectedSession(session);
                      setBookingError("");
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-1 min-h-10 rounded-full flex-shrink-0"
                        style={{ backgroundColor: session.class_types.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-white text-sm font-medium truncate">
                            {session.class_types.name}
                          </p>
                          {getSessionBadge(session)}
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {formatTime(session.start_time)} — {formatTime(session.end_time)} •{" "}
                          {session.coach_name}
                        </p>
                        {!isIndividual && (
                          <p className="text-gray-600 text-xs mt-0.5">
                            {session.current_participants}/{session.max_participants} places
                            {isFull && " · Complet"}
                          </p>
                        )}
                        {isIndividual && (
                          <p className="text-blue-400 text-xs mt-0.5 font-medium">
                            Cours individuel
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Desktop: week grid */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, dayIdx) => {
            const isToday = isSameDay(day, today);
            const daySessions = sessions.filter((s) =>
              isSameDay(new Date(s.start_time), day)
            );

            return (
              <div key={dayIdx} className="min-w-0">
                <div
                  className={`text-center mb-2 py-2 rounded-lg ${isToday ? "bg-[#D4AF37]/10" : ""}`}
                >
                  <p className="text-xs text-gray-500">{DAYS_FR[dayIdx]}</p>
                  <p className={`text-sm font-bold mt-0.5 ${isToday ? "text-[#D4AF37]" : "text-white"}`}>
                    {day.getDate()}
                  </p>
                </div>

                <div className="space-y-1.5">
                  {daySessions.map((session) => {
                    const isBooked = bookings[session.id] === "confirmed";
                    const isIndividual = session.session_type === "individual";

                    return (
                      <div
                        key={session.id}
                        className={`rounded-lg p-2 cursor-pointer hover:opacity-90 transition-opacity ${
                          isBooked ? "ring-1 ring-[#D4AF37]/50" : ""
                        } ${isIndividual ? "border border-blue-500/30" : "border border-white/5"}`}
                        style={{
                          backgroundColor: isBooked
                            ? session.class_types.color + "30"
                            : session.class_types.color + "20",
                          borderLeftColor: session.class_types.color,
                          borderLeftWidth: "3px",
                        }}
                        onClick={() => {
                          setSelectedSession(session);
                          setBookingError("");
                        }}
                      >
                        <p
                          className="text-xs font-semibold truncate"
                          style={{ color: session.class_types.color }}
                        >
                          {session.class_types.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatTime(session.start_time)}
                        </p>
                        {isIndividual && (
                          <p className="text-xs text-blue-400 mt-0.5">Individuel</p>
                        )}
                        {isBooked && (
                          <div className="mt-1">
                            <Badge variant="green">✓</Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session detail modal */}
      {selectedSession && (
        <Modal
          open={!!selectedSession}
          onClose={() => {
            setSelectedSession(null);
            setBookingError("");
          }}
          title={selectedSession.class_types.name}
        >
          <div className="space-y-4">
            <div
              className="h-1 rounded-full"
              style={{
                background: `linear-gradient(to right, ${selectedSession.class_types.color}, transparent)`,
              }}
            />

            {/* Session type badge */}
            <div className="flex gap-2">
              {selectedSession.session_type === "collective" ? (
                <Badge variant="gray">Cours collectif</Badge>
              ) : (
                <Badge variant="blue">Cours individuel</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Horaire</p>
                <p className="text-white text-sm font-medium">
                  {formatTime(selectedSession.start_time)} —{" "}
                  {formatTime(selectedSession.end_time)}
                </p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Coach</p>
                <p className="text-white text-sm font-medium flex items-center gap-1">
                  <User size={12} />
                  {selectedSession.coach_name}
                </p>
              </div>
              {selectedSession.session_type === "collective" && (
                <div className="bg-[#1a1a1a] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Places</p>
                  <p className="text-white text-sm font-medium flex items-center gap-1">
                    <Users size={12} />
                    {selectedSession.current_participants}/{selectedSession.max_participants}
                  </p>
                </div>
              )}
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Annulation</p>
                <p className="text-white text-sm font-medium flex items-center gap-1">
                  <Clock size={12} />
                  {selectedSession.min_cancel_hours}h avant
                </p>
              </div>
            </div>

            {selectedSession.class_types.description && (
              <p className="text-gray-400 text-sm">{selectedSession.class_types.description}</p>
            )}

            {bookingError && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{bookingError}</p>
              </div>
            )}

            {memberId && !isAdmin && selectedSession.session_type === "collective" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-3">
                  <Zap size={14} className="text-[#D4AF37]" />
                  <p className="text-xs text-gray-400">
                    Solde collectif :{" "}
                    <span className="text-[#D4AF37] font-semibold">
                      {collectiveBalance} séance(s)
                    </span>
                  </p>
                </div>

                {bookings[selectedSession.id] === "confirmed" ? (
                  <Button
                    variant="outline"
                    className="w-full text-red-400 border-red-400/30 hover:bg-red-400/10"
                    onClick={() => handleBook(selectedSession)}
                    loading={booking}
                  >
                    Se désinscrire
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleBook(selectedSession)}
                    loading={booking}
                    disabled={
                      selectedSession.current_participants >= selectedSession.max_participants ||
                      collectiveBalance <= 0
                    }
                  >
                    {selectedSession.current_participants >= selectedSession.max_participants
                      ? "Cours complet"
                      : "S'inscrire (1 séance collective)"}
                  </Button>
                )}
              </div>
            )}

            {memberId && !isAdmin && selectedSession.session_type === "individual" && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-sm text-blue-400">
                  Ce cours individuel a été planifié par votre coach.
                </p>
                {bookings[selectedSession.id] === "confirmed" && (
                  <Button
                    variant="outline"
                    className="w-full mt-3 text-red-400 border-red-400/30 hover:bg-red-400/10"
                    onClick={() => handleBook(selectedSession)}
                    loading={booking}
                  >
                    Annuler ma participation
                  </Button>
                )}
              </div>
            )}

            {/* Admin view: show booking info only */}
            {isAdmin && (
              <div className="bg-[#1a1a1a] rounded-lg p-3 flex items-center gap-2">
                <Users size={14} className="text-gray-400" />
                <p className="text-xs text-gray-400">
                  {selectedSession.session_type === "collective"
                    ? `${selectedSession.current_participants}/${selectedSession.max_participants} inscrits`
                    : "Cours individuel — géré via la fiche adhérent"}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

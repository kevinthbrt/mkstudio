"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Calendar, Clock, User, AlertTriangle } from "lucide-react";
import { formatDateTime, formatTime } from "@/lib/utils";

interface BookingWithSession {
  id: string;
  status: string;
  booked_at: string;
  cancelled_at: string | null;
  session_debited: boolean;
  class_sessions: {
    id: string;
    start_time: string;
    end_time: string;
    coach_name: string;
    min_cancel_hours: number;
    is_cancelled: boolean;
    class_types: {
      name: string;
      color: string;
    };
  };
}

export default function SessionsPage() {
  const [bookings, setBookings] = useState<BookingWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string>("");
  const [sessionBalance, setSessionBalance] = useState(0);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, session_balance")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;
    setProfileId(profile.id);
    setSessionBalance(profile.session_balance);

    const { data } = await supabase
      .from("class_bookings")
      .select(`
        *,
        class_sessions (
          id, start_time, end_time, coach_name, min_cancel_hours, is_cancelled,
          class_types (name, color)
        )
      `)
      .eq("member_id", profile.id)
      .order("class_sessions(start_time)", { ascending: false });

    setBookings((data as any[]) || []);
    setLoading(false);
  }

  function canCancel(booking: BookingWithSession): boolean {
    if (booking.status !== "confirmed") return false;
    if (booking.class_sessions.is_cancelled) return false;
    const sessionStart = new Date(booking.class_sessions.start_time);
    const now = new Date();
    const hoursUntilSession =
      (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilSession >= booking.class_sessions.min_cancel_hours;
  }

  async function handleCancel(booking: BookingWithSession) {
    setCancellingId(booking.id);
    const supabase = createClient();

    // Cancel booking
    await supabase
      .from("class_bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    // Decrement participants
    await supabase.rpc("decrement_participants", {
      session_id: booking.class_sessions.id,
    });

    // Recrédit session if debited
    if (booking.session_debited) {
      await supabase
        .from("profiles")
        .update({ session_balance: sessionBalance + 1 })
        .eq("id", profileId);
      setSessionBalance((s) => s + 1);
    }

    setCancellingId(null);
    loadBookings();
  }

  const upcomingBookings = bookings.filter(
    (b) =>
      b.status === "confirmed" &&
      new Date(b.class_sessions.start_time) >= new Date()
  );
  const pastBookings = bookings.filter(
    (b) =>
      b.status === "cancelled" ||
      new Date(b.class_sessions.start_time) < new Date()
  );

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
        <h1 className="text-2xl font-bold text-white">Mes séances</h1>
        <p className="text-gray-500 text-sm mt-1">
          Solde actuel :{" "}
          <span className="text-[#D4AF37] font-semibold">
            {sessionBalance} séance(s)
          </span>
        </p>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          À venir ({upcomingBookings.length})
        </h2>

        {upcomingBookings.length === 0 ? (
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-6 text-center">
            <Calendar size={24} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">
              Aucun cours à venir. Inscrivez-vous via le planning !
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => {
              const cancellable = canCancel(booking);
              const sessionStart = new Date(booking.class_sessions.start_time);
              const hoursLeft =
                (sessionStart.getTime() - new Date().getTime()) /
                (1000 * 60 * 60);

              return (
                <div
                  key={booking.id}
                  className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-1.5 h-full min-h-12 rounded-full flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor:
                          booking.class_sessions.class_types?.color ||
                          "#D4AF37",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white font-medium">
                          {booking.class_sessions.class_types?.name}
                        </p>
                        <Badge variant="green">Confirmé</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar size={12} />
                          {formatDateTime(booking.class_sessions.start_time)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          {formatTime(booking.class_sessions.start_time)} -{" "}
                          {formatTime(booking.class_sessions.end_time)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <User size={12} />
                          {booking.class_sessions.coach_name}
                        </span>
                      </div>

                      {!cancellable && hoursLeft > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400">
                          <AlertTriangle size={12} />
                          Annulation impossible (moins de{" "}
                          {booking.class_sessions.min_cancel_hours}h avant le
                          cours)
                        </div>
                      )}
                    </div>
                  </div>

                  {cancellable && (
                    <div className="mt-3 pt-3 border-t border-[#1f1f1f]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(booking)}
                        loading={cancellingId === booking.id}
                        className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                      >
                        Annuler ce cours (séance remboursée)
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past / Cancelled */}
      {pastBookings.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Historique ({pastBookings.length})
          </h2>
          <div className="space-y-2">
            {pastBookings.slice(0, 10).map((booking) => (
              <div
                key={booking.id}
                className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-3 flex items-center gap-3 opacity-60"
              >
                <div
                  className="w-1.5 h-10 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      booking.class_sessions.class_types?.color || "#D4AF37",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">
                    {booking.class_sessions.class_types?.name}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {formatDateTime(booking.class_sessions.start_time)}
                  </p>
                </div>
                <Badge variant={booking.status === "cancelled" ? "red" : "gray"}>
                  {booking.status === "cancelled" ? "Annulé" : "Passé"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

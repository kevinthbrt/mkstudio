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
  Pencil,
  EyeOff,
  Eye,
} from "lucide-react";
import {
  getWeekDays,
  isSameDay,
  formatTime,
  formatDate,
} from "@/lib/utils";

export interface ClassSessionWithType {
  id: string;
  class_type_id: string;
  start_time: string;
  end_time: string;
  coach_name: string;
  max_participants: number;
  current_participants: number;
  min_cancel_hours: number;
  is_cancelled: boolean;
  is_hidden: boolean;
  session_type: "collective" | "individual" | "duo";
  assigned_member_id: string | null;
  assigned_member_name?: string | null;
  recurring_rule: string | null;
  class_types: {
    name: string;
    color: string;
    description: string | null;
  };
}

interface AdminMember {
  id: string;
  first_name: string;
  last_name: string;
  collective_balance: number;
  duo_balance: number;
}

interface CalendarProps {
  memberId?: string;
  memberEmail?: string;
  memberFirstName?: string;
  collectiveBalance?: number;
  individualBalance?: number;
  duoBalance?: number;
  isAdmin?: boolean;
  adminMembers?: AdminMember[];
  onRequestEdit?: (session: ClassSessionWithType) => void;
  onToggleVisibility?: (session: ClassSessionWithType) => Promise<void>;
  onRevealWeek?: (sessionIds: string[]) => Promise<void>;
  onBalanceChange?: (collective: number, individual: number, duo: number) => void;
}

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function WeeklyCalendar({
  memberId,
  memberEmail,
  memberFirstName,
  collectiveBalance = 0,
  individualBalance = 0,
  duoBalance = 0,
  isAdmin = false,
  adminMembers = [],
  onRequestEdit,
  onToggleVisibility,
  onRevealWeek,
  onBalanceChange,
}: CalendarProps) {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<ClassSessionWithType[]>([]);
  const [bookings, setBookings] = useState<Record<string, string>>({});
  const [bookingGuests, setBookingGuests] = useState<Record<string, string | null>>({});
  const [localCollectiveBalance, setLocalCollectiveBalance] = useState(collectiveBalance);
  const [localIndividualBalance, setLocalIndividualBalance] = useState(individualBalance);
  const [localDuoBalance, setLocalDuoBalance] = useState(duoBalance);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ClassSessionWithType | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [revealingWeek, setRevealingWeek] = useState(false);
  const [inviteFriends, setInviteFriends] = useState(false);
  const [friendNames, setFriendNames] = useState("");
  const [sessionBookees, setSessionBookees] = useState<{ name: string; guest_names: string | null }[]>([]);
  const [loadingBookees, setLoadingBookees] = useState(false);
  const [adminBookingMemberId, setAdminBookingMemberId] = useState("");
  const [adminBooking, setAdminBooking] = useState(false);
  const [adminBookingError, setAdminBookingError] = useState("");
  const [waitlists, setWaitlists] = useState<Record<string, number>>({});
  const [waitlistLoading, setWaitlistLoading] = useState(false);

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

    const { data: sessionsData } = await supabase
      .from("class_sessions")
      .select(`*, class_types (name, color, description)`)
      .gte("start_time", start)
      .lte("start_time", end)
      .eq("is_cancelled", false)
      .order("start_time");

    const rawSessions = (sessionsData as unknown as ClassSessionWithType[]) || [];

    // For admin: fetch names for individual sessions' assigned members
    if (isAdmin) {
      const memberIds = [
        ...new Set(
          rawSessions
            .filter((s) => s.session_type === "individual" && s.assigned_member_id)
            .map((s) => s.assigned_member_id as string)
        ),
      ];

      if (memberIds.length > 0) {
        const { data: membersData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", memberIds);

        const memberMap: Record<string, string> = {};
        (membersData || []).forEach((m: any) => {
          memberMap[m.id] = `${m.first_name} ${m.last_name}`;
        });

        setSessions(
          rawSessions.map((s) => ({
            ...s,
            assigned_member_name: s.assigned_member_id
              ? memberMap[s.assigned_member_id] ?? null
              : null,
          }))
        );
      } else {
        setSessions(rawSessions);
      }
    } else {
      if (memberId) {
        const { data: bookingsData } = await supabase
          .from("class_bookings")
          .select("class_session_id, status, guest_names")
          .eq("member_id", memberId);

        const bookingMap: Record<string, string> = {};
        const guestMap: Record<string, string | null> = {};
        (bookingsData || []).forEach((b: any) => {
          bookingMap[b.class_session_id] = b.status;
          guestMap[b.class_session_id] = b.guest_names ?? null;
        });
        setBookings(bookingMap);
        setBookingGuests(guestMap);

        // Load waitlist entries for this member
        const { data: waitlistData } = await supabase
          .from("class_waitlists")
          .select("class_session_id, position")
          .eq("member_id", memberId)
          .eq("status", "waiting");

        const waitlistMap: Record<string, number> = {};
        (waitlistData || []).forEach((w: any) => {
          waitlistMap[w.class_session_id] = w.position;
        });
        setWaitlists(waitlistMap);

        // Members only see individual/duo sessions they are enrolled in
        setSessions(
          rawSessions.filter(
            (s) =>
              s.session_type === "collective" ||
              bookingMap[s.id] === "confirmed"
          )
        );
      } else {
        setSessions(rawSessions);
      }
    }

    setLoading(false);
  }

  async function loadSessionBookees(sessionId: string) {
    setLoadingBookees(true);
    if (isAdmin) {
      // Use server-side API route (service role) to avoid RLS recursion
      const res = await fetch(`/api/admin/sessions/bookees?session_id=${sessionId}`);
      const data = await res.json();
      setSessionBookees(Array.isArray(data) ? data : []);
    } else {
      const supabase = createClient();
      const { data } = await supabase
        .from("class_bookings")
        .select("guest_names, profiles (first_name, last_name)")
        .eq("class_session_id", sessionId)
        .eq("status", "confirmed");
      setSessionBookees(
        ((data as any[]) || []).map((b) => ({
          name: `${b.profiles?.first_name ?? ""} ${b.profiles?.last_name ?? ""}`.trim(),
          guest_names: b.guest_names,
        }))
      );
    }
    setLoadingBookees(false);
  }

  async function handleAdminBookForMember(session: ClassSessionWithType) {
    if (!adminBookingMemberId) return;
    setAdminBooking(true);
    setAdminBookingError("");

    const spotsLeft = session.max_participants - session.current_participants;
    if (spotsLeft < 1) {
      setAdminBookingError("Ce cours est complet.");
      setAdminBooking(false);
      return;
    }

    const member = adminMembers.find((m) => m.id === adminBookingMemberId);
    if (!member) { setAdminBooking(false); return; }

    const isDuo = session.session_type === "duo";
    if (isDuo) {
      if (member.duo_balance < 1) {
        setAdminBookingError(`${member.first_name} ${member.last_name} n'a plus de séances duo.`);
        setAdminBooking(false);
        return;
      }
    } else {
      if (member.collective_balance < 1) {
        setAdminBookingError(`${member.first_name} ${member.last_name} n'a plus de séances collectives.`);
        setAdminBooking(false);
        return;
      }
    }

    const supabase = createClient();

    // Check if already booked
    const { data: existing } = await supabase
      .from("class_bookings")
      .select("id, status")
      .eq("member_id", adminBookingMemberId)
      .eq("class_session_id", session.id)
      .maybeSingle();

    if (existing?.status === "confirmed") {
      setAdminBookingError(`${member.first_name} ${member.last_name} est déjà inscrit(e) à ce cours.`);
      setAdminBooking(false);
      return;
    }

    const { error } = await supabase.from("class_bookings").upsert(
      {
        member_id: adminBookingMemberId,
        class_session_id: session.id,
        status: "confirmed",
        session_debited: true,
        booked_at: new Date().toISOString(),
        cancelled_at: null,
      },
      { onConflict: "member_id,class_session_id" }
    );

    if (error) {
      setAdminBookingError("Une erreur est survenue. Réessayez.");
      setAdminBooking(false);
      return;
    }

    if (isDuo) {
      await supabase.rpc("decrement_duo_balance", { p_member_id: adminBookingMemberId });
    } else {
      await supabase.rpc("decrement_collective_balance", { p_member_id: adminBookingMemberId });
    }
    await supabase.rpc("increment_participants", { session_id: session.id });

    // Refresh bookees list
    await loadSessionBookees(session.id);
    setSessions((s) =>
      s.map((sess) =>
        sess.id === session.id
          ? { ...sess, current_participants: sess.current_participants + 1 }
          : sess
      )
    );
    setSelectedSession((prev) =>
      prev ? { ...prev, current_participants: prev.current_participants + 1 } : null
    );

    // Send email + push for duo (same as individual)
    if (isDuo) {
      fetch("/api/admin/emails/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: adminBookingMemberId,
          sessionName: session.class_types.name,
          sessionDate: formatDate(session.start_time),
          sessionTime: `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`,
          coachName: session.coach_name,
          sessionType: "duo",
        }),
      }).catch(() => {});
    }

    setAdminBookingMemberId("");
    setAdminBooking(false);
  }

  async function handleAdminCancelBookingForMember(session: ClassSessionWithType, targetMemberId: string) {
    setAdminBooking(true);
    setAdminBookingError("");

    const supabase = createClient();

    const { data: existingBooking } = await supabase
      .from("class_bookings")
      .select("id, session_debited, guest_names")
      .eq("member_id", targetMemberId)
      .eq("class_session_id", session.id)
      .eq("status", "confirmed")
      .single();

    if (!existingBooking) {
      setAdminBooking(false);
      return;
    }

    const guests = existingBooking.guest_names
      ? existingBooking.guest_names.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];
    const totalRefund = 1 + guests.length;

    await supabase
      .from("class_bookings")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", existingBooking.id);

    if (existingBooking.session_debited) {
      const refundRpc = session.session_type === "duo"
        ? "increment_duo_balance"
        : "increment_collective_balance";
      for (let i = 0; i < totalRefund; i++) {
        await supabase.rpc(refundRpc, { p_member_id: targetMemberId });
      }
    }

    for (let i = 0; i < totalRefund; i++) {
      await supabase.rpc("decrement_participants", { session_id: session.id });
    }

    await loadSessionBookees(session.id);
    setSessions((s) =>
      s.map((sess) =>
        sess.id === session.id
          ? { ...sess, current_participants: Math.max(0, sess.current_participants - totalRefund) }
          : sess
      )
    );
    setSelectedSession((prev) =>
      prev ? { ...prev, current_participants: Math.max(0, prev.current_participants - totalRefund) } : null
    );

    // Trigger waitlist promotion
    fetch("/api/waitlist/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id }),
    }).catch(() => {});

    setAdminBooking(false);
  }

  async function handleJoinWaitlist(session: ClassSessionWithType) {
    if (!memberId) return;
    setWaitlistLoading(true);
    setBookingError("");

    const supabase = createClient();

    const { data: position, error } = await supabase.rpc("join_waitlist", {
      p_member_id: memberId,
      p_session_id: session.id,
    });

    if (error || position == null) {
      setBookingError("Impossible de rejoindre la liste d'attente. Réessayez.");
      setWaitlistLoading(false);
      return;
    }

    setWaitlists((w) => ({ ...w, [session.id]: position }));

    // Send confirmation email (non-blocking)
    fetch("/api/emails/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionName: session.class_types.name,
        sessionDate: formatDate(session.start_time),
        sessionTime: `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`,
        coachName: session.coach_name,
        position,
      }),
    }).catch(() => {});

    setWaitlistLoading(false);
  }

  async function handleLeaveWaitlist(session: ClassSessionWithType) {
    if (!memberId) return;
    setWaitlistLoading(true);
    setBookingError("");

    const supabase = createClient();

    const { error } = await supabase
      .from("class_waitlists")
      .update({ status: "cancelled" })
      .eq("member_id", memberId)
      .eq("class_session_id", session.id)
      .eq("status", "waiting");

    if (error) {
      setBookingError("Impossible de quitter la liste d'attente. Réessayez.");
      setWaitlistLoading(false);
      return;
    }

    setWaitlists((w) => {
      const next = { ...w };
      delete next[session.id];
      return next;
    });

    setWaitlistLoading(false);
  }

  function parseFriends(raw: string): string[] {
    return raw
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleBook(session: ClassSessionWithType) {
    if (!memberId) return;
    if (!isAdmin && session.session_type === "individual") return;
    // For duo: members can only cancel (not self-book). Block if not already booked.
    if (!isAdmin && session.session_type === "duo" && bookings[session.id] !== "confirmed") return;

    setBooking(true);
    setBookingError("");

    const isBooked = bookings[session.id] === "confirmed";

    if (isBooked) {
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
        .select("id, session_debited, guest_names")
        .eq("member_id", memberId)
        .eq("class_session_id", session.id)
        .eq("status", "confirmed")
        .single();

      if (existingBooking) {
        const guests = existingBooking.guest_names
          ? existingBooking.guest_names.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];
        const totalRefund = 1 + guests.length;

        await supabase
          .from("class_bookings")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("id", existingBooking.id);

        if (existingBooking.session_debited) {
          if (session.session_type === "individual") {
            for (let i = 0; i < totalRefund; i++) {
              await supabase.rpc("increment_individual_balance", { p_member_id: memberId });
            }
            setLocalIndividualBalance((prev) => { const next = prev + totalRefund; onBalanceChange?.(localCollectiveBalance, next, localDuoBalance); return next; });
          } else if (session.session_type === "duo") {
            for (let i = 0; i < totalRefund; i++) {
              await supabase.rpc("increment_duo_balance", { p_member_id: memberId });
            }
            setLocalDuoBalance((prev) => { const next = prev + totalRefund; onBalanceChange?.(localCollectiveBalance, localIndividualBalance, next); return next; });
          } else {
            for (let i = 0; i < totalRefund; i++) {
              await supabase.rpc("increment_collective_balance", { p_member_id: memberId });
            }
            setLocalCollectiveBalance((prev) => { const next = prev + totalRefund; onBalanceChange?.(next, localIndividualBalance, localDuoBalance); return next; });
          }
        }

        for (let i = 0; i < totalRefund; i++) {
          await supabase.rpc("decrement_participants", { session_id: session.id });
        }
      }

      setBookings((b) => ({ ...b, [session.id]: "cancelled" }));
      setBookingGuests((g) => ({ ...g, [session.id]: null }));
      setSessions((s) =>
        s.map((sess) =>
          sess.id === session.id
            ? { ...sess, current_participants: Math.max(0, sess.current_participants - (existingBooking ? 1 + (existingBooking.guest_names ? existingBooking.guest_names.split(",").filter(Boolean).length : 0) : 1)) }
            : sess
        )
      );

      // Send cancellation email (non-blocking) — identity derived server-side from session
      fetch("/api/emails/cancellation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionName: session.class_types.name,
          sessionDate: formatDate(session.start_time),
          sessionTime: `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`,
          refundedSessions: existingBooking ? 1 + (existingBooking.guest_names ? existingBooking.guest_names.split(",").filter(Boolean).length : 0) : 1,
          sessionType: session.session_type,
        }),
      }).catch(() => {});

      // Notify admin via push
      if (memberFirstName) {
        fetch("/api/notifications/push-member-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "cancellation",
            memberName: memberFirstName,
            sessionName: session.class_types.name,
            sessionDate: formatDate(session.start_time),
            sessionTime: formatTime(session.start_time),
          }),
        }).catch(() => {});
      }

      // Trigger waitlist promotion: auto-book next person in queue
      fetch("/api/waitlist/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      }).catch(() => {});
    } else {
      const guests = inviteFriends ? parseFriends(friendNames) : [];
      const totalSpots = 1 + guests.length;
      const balance = session.session_type === "individual"
        ? localIndividualBalance
        : session.session_type === "duo"
        ? localDuoBalance
        : localCollectiveBalance;

      const supabase = createClient();

      // Collective sessions: use atomic RPC to prevent overbooking race conditions
      if (session.session_type === "collective" && !isAdmin) {
        // Light pre-check for balance (UX only — server validates too)
        if (balance < totalSpots) {
          setBookingError(`Solde collectif insuffisant (${balance} séance(s) disponible(s), ${totalSpots} nécessaire(s)).`);
          setBooking(false);
          return;
        }

        const { data: result, error: rpcError } = await supabase.rpc("book_collective_session", {
          p_member_id: memberId,
          p_session_id: session.id,
          p_guest_names: guests.length > 0 ? guests.join(", ") : null,
        });

        if (rpcError || !(result as any)?.success) {
          const err = (result as any)?.error;
          if (err === "no_spots") {
            const left = (result as any)?.spots_left ?? 0;
            setBookingError(`Ce cours est complet (${left} place(s) disponible(s), ${totalSpots} nécessaire(s)).`);
          } else if (err === "insufficient_balance") {
            setBookingError("Solde collectif insuffisant.");
          } else {
            setBookingError("Une erreur est survenue. Réessayez.");
          }
          setBooking(false);
          return;
        }

        const newBalance = (result as any).new_balance ?? (balance - totalSpots);
        setLocalCollectiveBalance(newBalance);
        onBalanceChange?.(newBalance, localIndividualBalance, localDuoBalance);
      } else {
        // Individual / duo / admin paths — keep existing non-atomic flow
        if (balance < totalSpots && !isAdmin) {
          setBookingError(
            session.session_type === "individual"
              ? "Solde individuel insuffisant."
              : "Solde duo insuffisant."
          );
          setBooking(false);
          return;
        }

        const spotsLeft = session.max_participants - session.current_participants;
        if (spotsLeft < totalSpots) {
          setBookingError(`Plus assez de places (${spotsLeft} disponible(s) pour ${totalSpots} personne(s)).`);
          setBooking(false);
          return;
        }

        const { error } = await supabase.from("class_bookings").upsert(
          {
            member_id: memberId,
            class_session_id: session.id,
            status: "confirmed",
            session_debited: true,
            ...(guests.length > 0 ? { guest_names: guests.join(", ") } : {}),
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
          for (let i = 0; i < totalSpots; i++) {
            await supabase.rpc("decrement_individual_balance", { p_member_id: memberId });
          }
          setLocalIndividualBalance((prev) => { const next = prev - totalSpots; onBalanceChange?.(localCollectiveBalance, next, localDuoBalance); return next; });
        } else if (session.session_type === "duo") {
          for (let i = 0; i < totalSpots; i++) {
            await supabase.rpc("decrement_duo_balance", { p_member_id: memberId });
          }
          setLocalDuoBalance((prev) => { const next = prev - totalSpots; onBalanceChange?.(localCollectiveBalance, localIndividualBalance, next); return next; });
        } else {
          for (let i = 0; i < totalSpots; i++) {
            await supabase.rpc("decrement_collective_balance", { p_member_id: memberId });
          }
          setLocalCollectiveBalance((prev) => { const next = prev - totalSpots; onBalanceChange?.(next, localIndividualBalance, localDuoBalance); return next; });
        }

        for (let i = 0; i < totalSpots; i++) {
          await supabase.rpc("increment_participants", { session_id: session.id });
        }
      }

      setBookings((b) => ({ ...b, [session.id]: "confirmed" }));
      setBookingGuests((g) => ({ ...g, [session.id]: guests.length > 0 ? guests.join(", ") : null }));
      setSessions((s) =>
        s.map((sess) =>
          sess.id === session.id
            ? { ...sess, current_participants: sess.current_participants + totalSpots }
            : sess
        )
      );

      // Send booking confirmation email (non-blocking) — identity derived server-side from session
      fetch("/api/emails/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionName: session.class_types.name,
          sessionDate: formatDate(session.start_time),
          sessionTime: `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`,
          coachName: session.coach_name,
          guests: guests.length > 0 ? guests : undefined,
          minCancelHours: session.min_cancel_hours,
        }),
      }).catch(() => {});

      // Notify admin via push
      if (memberFirstName) {
        fetch("/api/notifications/push-member-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "booking",
            memberName: memberFirstName,
            sessionName: session.class_types.name,
            sessionDate: formatDate(session.start_time),
            sessionTime: formatTime(session.start_time),
          }),
        }).catch(() => {});
      }
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

  function isPast(session: ClassSessionWithType) {
    return new Date(session.start_time) < today;
  }

  function getSessionBadge(session: ClassSessionWithType) {
    const isBooked = bookings[session.id] === "confirmed";
    const onWaitlist = waitlists[session.id] != null;
    const isFull = session.current_participants >= session.max_participants;
    const isIndividual = session.session_type === "individual";
    const isDuo = session.session_type === "duo";

    if (isPast(session)) return <Badge variant="gray">Terminé</Badge>;
    if (isBooked) return <Badge variant="green">Inscrit</Badge>;
    if (onWaitlist) return <Badge variant="orange">#{waitlists[session.id]} liste d&apos;attente</Badge>;
    if (isIndividual) return <Badge variant="blue">Solo</Badge>;
    if (isDuo) return <Badge variant="purple">Duo</Badge>;
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
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={prevWeek}>
          <ChevronLeft size={16} />
        </Button>
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <p className="text-white font-medium text-sm">
            {formatDate(weekDays[0].toISOString())} —{" "}
            {formatDate(weekDays[6].toISOString())}
          </p>
          {isAdmin && onRevealWeek && (() => {
            const hiddenIds = sessions
              .filter((s) => s.is_hidden && s.session_type === "collective")
              .map((s) => s.id);
            if (hiddenIds.length === 0) return null;
            return (
              <button
                type="button"
                disabled={revealingWeek}
                onClick={async () => {
                  setRevealingWeek(true);
                  await onRevealWeek(hiddenIds);
                  setSessions((s) =>
                    s.map((sess) =>
                      hiddenIds.includes(sess.id) ? { ...sess, is_hidden: false } : sess
                    )
                  );
                  setRevealingWeek(false);
                }}
                className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 bg-green-400/10 hover:bg-green-400/20 border border-green-400/20 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
              >
                <Eye size={11} />
                {revealingWeek
                  ? "Déblocage..."
                  : `Rendre visible toute la semaine (${hiddenIds.length})`}
              </button>
            );
          })()}
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
                const onWaitlist = waitlists[session.id] != null;
                const isFull = session.current_participants >= session.max_participants;
                const isIndividual = session.session_type === "individual";
                const isDuo = session.session_type === "duo";
                const isHidden = session.is_hidden;
                const past = isPast(session);

                return (
                  <div
                    key={session.id}
                    className={`border rounded-xl p-3 mb-2 cursor-pointer transition-colors ${
                      past
                        ? "bg-[#0d0d0d] border-[#1a1a1a] opacity-50 grayscale"
                        : isHidden && isAdmin
                        ? "bg-[#111111] border-[#2a2a2a] border-dashed opacity-60"
                        : isBooked
                        ? "bg-[#D4AF37]/10 border-[#D4AF37]/30"
                        : onWaitlist
                        ? "bg-orange-500/10 border-orange-500/30"
                        : isIndividual
                        ? "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40"
                        : isDuo
                        ? "bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40"
                        : "bg-[#111111] border-[#1f1f1f] hover:border-[#D4AF37]/30"
                    }`}
                    onClick={() => {
                      setSelectedSession(session);
                      setBookingError("");
                      setSessionBookees([]);
                      if (isAdmin && (session.session_type === "collective" || session.session_type === "duo")) {
                        loadSessionBookees(session.id);
                      }
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
                          <div className="flex items-center gap-1">
                            {isHidden && isAdmin && (
                              <EyeOff size={12} className="text-gray-500" />
                            )}
                            {getSessionBadge(session)}
                          </div>
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {formatTime(session.start_time)} — {formatTime(session.end_time)} •{" "}
                          {session.coach_name}
                        </p>
                        {!isIndividual && (
                          <p className={`text-xs mt-0.5 ${isFull ? "text-red-400" : isAdmin ? "text-gray-400 font-medium" : "text-gray-600"}`}>
                            {session.current_participants}/{session.max_participants} inscrits
                            {isFull && " · Complet"}
                          </p>
                        )}
                        {isIndividual && (
                          <p className="text-blue-400 text-xs mt-0.5 font-medium">
                            {isAdmin && session.assigned_member_name
                              ? session.assigned_member_name
                              : "Coaching solo"}
                          </p>
                        )}
                        {isDuo && (
                          <p className="text-purple-400 text-xs mt-0.5 font-medium">
                            Coaching duo · {session.current_participants}/{session.max_participants}
                          </p>
                        )}
                        {/* Booking / waitlist CTA for members - collective sessions only */}
                        {!isAdmin && memberId && !past && !isBooked && session.session_type === "collective" && (
                          <>
                            {!isFull && !onWaitlist && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSession(session);
                                  setBookingError("");
                                }}
                                className="mt-2 w-full py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                style={{
                                  backgroundColor: session.class_types.color + "20",
                                  color: session.class_types.color,
                                  border: `1px solid ${session.class_types.color}40`,
                                }}
                              >
                                Réserver ma place →
                              </button>
                            )}
                            {isFull && !onWaitlist && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSession(session);
                                  setBookingError("");
                                }}
                                className="mt-2 w-full py-1.5 rounded-lg text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/25 transition-colors hover:bg-orange-500/20"
                              >
                                Liste d&apos;attente →
                              </button>
                            )}
                          </>
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
                    const onWaitlist = waitlists[session.id] != null;
                    const isIndividual = session.session_type === "individual";
                    const isDuo = session.session_type === "duo";
                    const isHidden = session.is_hidden;
                    const past = isPast(session);
                    const isFull = session.current_participants >= session.max_participants;

                    return (
                      <div
                        key={session.id}
                        className={`rounded-lg p-2 cursor-pointer transition-opacity ${
                          past
                            ? "opacity-40 grayscale"
                            : isHidden && isAdmin
                            ? "opacity-50 border-dashed hover:opacity-60"
                            : isBooked
                            ? "ring-1 ring-[#D4AF37]/50 hover:opacity-90"
                            : "hover:opacity-90"
                        } ${isIndividual ? "border border-blue-500/30" : isDuo ? "border border-purple-500/30" : "border border-white/5"}`}
                        style={{
                          backgroundColor: past
                            ? "#111"
                            : isBooked
                            ? session.class_types.color + "30"
                            : session.class_types.color + "20",
                          borderLeftColor: past ? "#333" : session.class_types.color,
                          borderLeftWidth: "3px",
                        }}
                        onClick={() => {
                          setSelectedSession(session);
                          setBookingError("");
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <p
                            className="text-xs font-semibold truncate flex-1"
                            style={{ color: session.class_types.color }}
                          >
                            {session.class_types.name}
                          </p>
                          {isHidden && isAdmin && (
                            <EyeOff size={10} className="text-gray-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatTime(session.start_time)}
                        </p>
                        {isIndividual && (
                          <p className="text-xs text-blue-400 mt-0.5 truncate">
                            {isAdmin && session.assigned_member_name
                              ? session.assigned_member_name
                              : "Individuel"}
                          </p>
                        )}
                        {isAdmin && !isIndividual && (
                          <p className={`text-xs mt-0.5 font-medium ${session.current_participants >= session.max_participants ? "text-red-400" : "text-gray-400"}`}>
                            {session.current_participants}/{session.max_participants}
                          </p>
                        )}
                        {!isAdmin && isBooked && (
                          <div className="mt-1">
                            <Badge variant="green">✓</Badge>
                          </div>
                        )}
                        {!isAdmin && onWaitlist && (
                          <div className="mt-1">
                            <Badge variant="orange">#{waitlists[session.id]}</Badge>
                          </div>
                        )}
                        {!isAdmin && memberId && !past && !isBooked && !onWaitlist && !isFull && session.session_type === "collective" && (
                          <p
                            className="text-xs mt-1 font-semibold"
                            style={{ color: session.class_types.color }}
                          >
                            Réserver →
                          </p>
                        )}
                        {!isAdmin && memberId && !past && !isBooked && !onWaitlist && isFull && session.session_type === "collective" && (
                          <p className="text-xs mt-1 font-semibold text-orange-400">
                            Attente →
                          </p>
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
            setInviteFriends(false);
            setFriendNames("");
            setAdminBookingMemberId("");
            setAdminBookingError("");
            setWaitlistLoading(false);
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
              ) : selectedSession.session_type === "duo" ? (
                <Badge variant="purple">Coaching duo</Badge>
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
              {selectedSession.session_type === "duo" && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Inscrits</p>
                  <p className="text-purple-400 text-sm font-medium flex items-center gap-1">
                    <Users size={12} />
                    {selectedSession.current_participants}/{selectedSession.max_participants}
                  </p>
                </div>
              )}
              {selectedSession.session_type === "individual" && selectedSession.assigned_member_name && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Adhérent</p>
                  <p className="text-blue-400 text-sm font-medium flex items-center gap-1">
                    <User size={12} />
                    {selectedSession.assigned_member_name}
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

            {memberId && !isAdmin && isPast(selectedSession) && (
              <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500">Ce cours est terminé</p>
              </div>
            )}

            {memberId && !isAdmin && !isPast(selectedSession) && selectedSession.session_type === "collective" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-3">
                  <Zap size={14} className="text-[#D4AF37]" />
                  <p className="text-xs text-gray-400">
                    Solde collectif :{" "}
                    <span className="text-[#D4AF37] font-semibold">
                      {localCollectiveBalance} séance(s)
                    </span>
                  </p>
                </div>

                {bookings[selectedSession.id] === "confirmed" ? (
                  <div className="space-y-2">
                    {bookingGuests[selectedSession.id] && (
                      <div className="bg-[#1a1a1a] rounded-lg px-3 py-2 text-xs text-gray-400 border border-[#2a2a2a]">
                        Inscrit(e) avec : <span className="text-white">{bookingGuests[selectedSession.id]}</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full text-red-400 border-red-400/30 hover:bg-red-400/10"
                      onClick={() => handleBook(selectedSession)}
                      loading={booking}
                    >
                      Se désinscrire
                      {bookingGuests[selectedSession.id]
                        ? ` (${1 + bookingGuests[selectedSession.id]!.split(",").filter(Boolean).length} séances remboursées)`
                        : " (1 séance remboursée)"}
                    </Button>
                  </div>
                ) : waitlists[selectedSession.id] != null ? (
                  // Member is on the waitlist
                  <div className="space-y-2">
                    <div className="bg-orange-500/10 border border-orange-500/25 rounded-lg p-3 space-y-1">
                      <p className="text-sm font-semibold text-orange-400">
                        Position #{waitlists[selectedSession.id]} sur la liste d&apos;attente
                      </p>
                      <p className="text-xs text-gray-400">
                        Si une place se libère, tu seras inscrit(e) automatiquement et une séance sera débitée.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full text-gray-400 border-gray-400/30 hover:bg-gray-400/10"
                      onClick={() => handleLeaveWaitlist(selectedSession)}
                      loading={waitlistLoading}
                    >
                      Quitter la liste d&apos;attente
                    </Button>
                  </div>
                ) : selectedSession.current_participants >= selectedSession.max_participants ? (
                  // Session full — offer waitlist
                  <div className="space-y-2">
                    <div className="bg-orange-500/10 border border-orange-500/25 rounded-lg p-3">
                      <p className="text-xs text-orange-400 leading-relaxed">
                        Ce cours est complet. Rejoins la liste d&apos;attente : si une place se libère, tu seras inscrit(e) automatiquement (1 séance débitée).
                      </p>
                    </div>
                    <Button
                      variant="orange"
                      className="w-full"
                      onClick={() => handleJoinWaitlist(selectedSession)}
                      loading={waitlistLoading}
                      disabled={localCollectiveBalance <= 0}
                    >
                      {localCollectiveBalance <= 0
                        ? "Solde insuffisant pour la liste d'attente"
                        : "Rejoindre la liste d'attente"}
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Invite friends */}
                    <div className="bg-[#1a1a1a] rounded-lg p-3 space-y-2 border border-[#2a2a2a]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inviteFriends}
                          onChange={(e) => { setInviteFriends(e.target.checked); if (!e.target.checked) setFriendNames(""); }}
                          className="accent-[#D4AF37] w-4 h-4"
                        />
                        <span className="text-sm text-gray-300">Inviter des ami(e)s</span>
                      </label>
                      {inviteFriends && (
                        <div className="space-y-1.5">
                          <p className="text-xs text-gray-500">Entrez les prénoms, séparés par une virgule ou un saut de ligne</p>
                          <textarea
                            value={friendNames}
                            onChange={(e) => setFriendNames(e.target.value)}
                            placeholder="Alice, Bob..."
                            rows={2}
                            className="w-full bg-[#111] border border-[#3a3a3a] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#D4AF37] resize-none"
                          />
                          {parseFriends(friendNames).length > 0 && (
                            <p className="text-xs text-[#D4AF37]">
                              {1 + parseFriends(friendNames).length} place(s) à débiter
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleBook(selectedSession)}
                      loading={booking}
                      disabled={localCollectiveBalance <= 0}
                    >
                      {inviteFriends && parseFriends(friendNames).length > 0
                        ? `S'inscrire avec ${parseFriends(friendNames).length} ami(e)(s) (${1 + parseFriends(friendNames).length} séances)`
                        : "S'inscrire (1 séance collective)"}
                    </Button>
                  </>
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

            {memberId && !isAdmin && selectedSession.session_type === "duo" && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <p className="text-sm text-purple-400">
                  Ce coaching duo a été planifié par votre coach.
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

            {/* Admin view */}
            {isAdmin && (
              <div className="space-y-2">
                {(selectedSession.session_type === "collective" || selectedSession.session_type === "duo") ? (
                  <div className="space-y-2">
                    {/* Bookees list */}
                    <div className={`rounded-lg p-3 space-y-2 ${selectedSession.session_type === "duo" ? "bg-purple-500/5 border border-purple-500/20" : "bg-[#1a1a1a]"}`}>
                      <div className="flex items-center gap-2">
                        <Users size={14} className={selectedSession.session_type === "duo" ? "text-purple-400" : "text-gray-400"} />
                        <p className={`text-xs font-medium ${selectedSession.session_type === "duo" ? "text-purple-400" : "text-gray-400"}`}>
                          {selectedSession.current_participants}/{selectedSession.max_participants} inscrits
                        </p>
                      </div>
                      {loadingBookees ? (
                        <p className="text-xs text-gray-600">Chargement...</p>
                      ) : sessionBookees.length > 0 ? (
                        <ul className="space-y-1">
                          {sessionBookees.map((b, i) => {
                            const member = adminMembers.find(
                              (m) => `${m.first_name} ${m.last_name}`.trim() === b.name
                            );
                            return (
                              <li key={i} className="text-xs text-white flex items-center justify-between gap-2">
                                <div className="flex flex-col">
                                  <span>• {b.name}</span>
                                  {b.guest_names && (
                                    <span className="text-gray-500 pl-3">
                                      + {b.guest_names}
                                    </span>
                                  )}
                                </div>
                                {member && !isPast(selectedSession) && (
                                  <button
                                    onClick={() => handleAdminCancelBookingForMember(selectedSession, member.id)}
                                    disabled={adminBooking}
                                    className="text-red-400/60 hover:text-red-400 text-[10px] shrink-0 transition-colors disabled:opacity-40"
                                    title="Désinscrire"
                                  >
                                    ✕
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-600 italic">Aucun inscrit</p>
                      )}
                    </div>

                    {/* Admin book for member */}
                    {!isPast(selectedSession) && adminMembers.length > 0 && (
                      <div className={`border rounded-lg p-3 space-y-2 ${selectedSession.session_type === "duo" ? "bg-purple-500/5 border-purple-500/20" : "bg-[#1a1a1a] border-[#2a2a2a]"}`}>
                        <p className="text-xs font-medium text-gray-300">Inscrire un adhérent</p>
                        {adminBookingError && (
                          <p className="text-xs text-red-400">{adminBookingError}</p>
                        )}
                        <div className="flex gap-2">
                          <select
                            value={adminBookingMemberId}
                            onChange={(e) => { setAdminBookingMemberId(e.target.value); setAdminBookingError(""); }}
                            className="flex-1 bg-[#111] border border-[#3a3a3a] text-white rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#D4AF37]"
                          >
                            <option value="">Choisir un adhérent...</option>
                            {adminMembers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {selectedSession.session_type === "duo"
                                  ? `${m.first_name} ${m.last_name} (${m.duo_balance} séance${m.duo_balance !== 1 ? "s" : ""} duo)`
                                  : `${m.first_name} ${m.last_name} (${m.collective_balance} séance${m.collective_balance !== 1 ? "s" : ""})`}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            onClick={() => handleAdminBookForMember(selectedSession)}
                            loading={adminBooking}
                            disabled={!adminBookingMemberId}
                          >
                            Inscrire
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] rounded-lg p-3 flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    <p className="text-xs text-gray-400">
                      {selectedSession.assigned_member_name
                        ? `Adhérent : ${selectedSession.assigned_member_name}`
                        : "Cours individuel — aucun adhérent assigné"}
                    </p>
                  </div>
                )}

                {onToggleVisibility && selectedSession.session_type === "collective" && (
                  <Button
                    variant="outline"
                    className={`w-full ${
                      selectedSession.is_hidden
                        ? "text-green-400 border-green-400/30 hover:bg-green-400/10"
                        : "text-gray-400 border-gray-400/30 hover:bg-gray-400/10"
                    }`}
                    loading={togglingVisibility}
                    onClick={async () => {
                      setTogglingVisibility(true);
                      await onToggleVisibility(selectedSession);
                      setSessions((s) =>
                        s.map((sess) =>
                          sess.id === selectedSession.id
                            ? { ...sess, is_hidden: !sess.is_hidden }
                            : sess
                        )
                      );
                      setSelectedSession((prev) =>
                        prev ? { ...prev, is_hidden: !prev.is_hidden } : null
                      );
                      setTogglingVisibility(false);
                    }}
                  >
                    {selectedSession.is_hidden ? (
                      <>
                        <Eye size={14} />
                        Rendre visible aux membres
                      </>
                    ) : (
                      <>
                        <EyeOff size={14} />
                        Masquer aux membres
                      </>
                    )}
                  </Button>
                )}

                {onRequestEdit && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedSession(null);
                      onRequestEdit(selectedSession);
                    }}
                  >
                    <Pencil size={14} />
                    Modifier ce cours
                  </Button>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

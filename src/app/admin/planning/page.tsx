"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { WeeklyCalendar, ClassSessionWithType } from "@/components/planning/WeeklyCalendar";
import { Plus, Palette, Trash2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import type { ClassType, Profile } from "@/types/database";

const COLOR_PRESETS = [
  "#D4AF37", "#ef4444", "#3b82f6", "#22c55e",
  "#a855f7", "#f97316", "#06b6d4", "#ec4899",
];

export default function AdminPlanningPage() {
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showManageTypes, setShowManageTypes] = useState(false);
  const [showEditSession, setShowEditSession] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSessionWithType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [sessionForm, setSessionForm] = useState({
    class_type_id: "",
    session_type: "collective" as "collective" | "individual" | "duo",
    assigned_member_id: "",
    assigned_member_ids: [] as string[],
    coach_name: "Manon",
    date: "",
    start_hour: "09:00",
    end_hour: "10:00",
    max_participants: "10",
    min_cancel_hours: "3",
    recurring: false,
    infinite_recurrence: false,
    hide_weeks: true,
    weeks: "4",
  });

  const [editForm, setEditForm] = useState({
    class_type_id: "",
    session_type: "collective" as "collective" | "individual" | "duo",
    assigned_member_id: "",
    coach_name: "",
    date: "",
    start_hour: "09:00",
    end_hour: "10:00",
    max_participants: "10",
    min_cancel_hours: "3",
    is_hidden: false,
  });

  const [typeForm, setTypeForm] = useState({
    name: "",
    description: "",
    color: "#D4AF37",
    duration_minutes: "60",
  });

  const [duoMemberSearch, setDuoMemberSearch] = useState("");
  const [soloMemberSearch, setSoloMemberSearch] = useState("");
  const [editSoloMemberSearch, setEditSoloMemberSearch] = useState("");
  const [savingSession, setSavingSession] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [cancellingSession, setCancellingSession] = useState(false);
  const [savingType, setSavingType] = useState(false);

  useEffect(() => {
    loadClassTypes();
    loadMembers();
  }, []);

  async function loadClassTypes() {
    const supabase = createClient();
    const { data } = await supabase.from("class_types").select("*").order("name");
    setClassTypes(data || []);
  }

  async function loadMembers() {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "member")
      .order("last_name");
    setMembers(data || []);
  }

  function openEditModal(session: ClassSessionWithType) {
    const startDate = new Date(session.start_time);
    const endDate = new Date(session.end_time);
    const dateStr = startDate.toISOString().slice(0, 10);
    const startHour = startDate.toTimeString().slice(0, 5);
    const endHour = endDate.toTimeString().slice(0, 5);

    setEditingSession(session);
    setEditForm({
      class_type_id: session.class_type_id,
      session_type: session.session_type as "collective" | "individual" | "duo",
      assigned_member_id: session.assigned_member_id ?? "",
      coach_name: session.coach_name,
      date: dateStr,
      start_hour: startHour,
      end_hour: endHour,
      max_participants: String(session.max_participants),
      min_cancel_hours: String(session.min_cancel_hours),
      is_hidden: session.is_hidden,
    });
    setShowEditSession(true);
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setSavingSession(true);

    const supabase = createClient();
    const startTime = new Date(`${sessionForm.date}T${sessionForm.start_hour}:00`);
    const endTime = new Date(`${sessionForm.date}T${sessionForm.end_hour}:00`);

    const isIndividual = sessionForm.session_type === "individual";
    const isDuo = sessionForm.session_type === "duo";

    const sessions = [];

    if (sessionForm.recurring) {
      const isInfinite = sessionForm.infinite_recurrence;
      const weeks = isInfinite ? 104 : parseInt(sessionForm.weeks);
      const recurringRule = isInfinite ? "weekly:infinite" : `weekly:${weeks}`;
      const shouldHide = isInfinite && sessionForm.hide_weeks;

      for (let i = 0; i < weeks; i++) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        start.setDate(start.getDate() + i * 7);
        end.setDate(end.getDate() + i * 7);
        sessions.push({
          class_type_id: sessionForm.class_type_id,
          session_type: sessionForm.session_type,
          assigned_member_id: isIndividual ? sessionForm.assigned_member_id || null : null,
          coach_name: sessionForm.coach_name,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          max_participants: isIndividual ? 1 : parseInt(sessionForm.max_participants),
          min_cancel_hours: parseInt(sessionForm.min_cancel_hours),
          recurring_rule: recurringRule,
          is_hidden: shouldHide,
        });
      }
    } else {
      sessions.push({
        class_type_id: sessionForm.class_type_id,
        session_type: sessionForm.session_type,
        assigned_member_id: isIndividual ? sessionForm.assigned_member_id || null : null,
        coach_name: sessionForm.coach_name,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        max_participants: isIndividual ? 1 : parseInt(sessionForm.max_participants),
        min_cancel_hours: parseInt(sessionForm.min_cancel_hours),
        recurring_rule: null,
        is_hidden: false,
      });
    }

    const { data: createdSessions } = await supabase
      .from("class_sessions")
      .insert(sessions)
      .select("id");

    if (isIndividual && sessionForm.assigned_member_id && createdSessions) {
      const bookings = createdSessions.map((s) => ({
        member_id: sessionForm.assigned_member_id,
        class_session_id: s.id,
        status: "confirmed" as const,
        session_debited: true,
        booked_at: new Date().toISOString(),
      }));

      await supabase.from("class_bookings").insert(bookings);

      for (let i = 0; i < createdSessions.length; i++) {
        await supabase.rpc("decrement_individual_balance", {
          p_member_id: sessionForm.assigned_member_id,
        });
      }

      // Send booking confirmation email to member
      const sessionName = classTypes.find((t) => t.id === sessionForm.class_type_id)?.name ?? "Séance individuelle";
      const dateObj = new Date(`${sessionForm.date}T${sessionForm.start_hour}:00`);
      const sessionDate = dateObj.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const sessionTime = `${sessionForm.start_hour} – ${sessionForm.end_hour}`;
      fetch("/api/admin/emails/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: sessionForm.assigned_member_id,
          sessionName,
          sessionDate,
          sessionTime,
          coachName: sessionForm.coach_name,
          recurring: sessionForm.recurring,
        }),
      }).catch(() => {});
    }

    if (isDuo && sessionForm.assigned_member_ids.length > 0 && createdSessions) {
      for (const memberId of sessionForm.assigned_member_ids) {
        const duoBookings = createdSessions.map((s) => ({
          member_id: memberId,
          class_session_id: s.id,
          status: "confirmed" as const,
          session_debited: true,
          booked_at: new Date().toISOString(),
        }));
        await supabase.from("class_bookings").insert(duoBookings);

        for (const s of createdSessions) {
          await supabase.rpc("decrement_duo_balance", { p_member_id: memberId });
          await supabase.rpc("increment_participants", { session_id: s.id });
        }
      }

      // Send booking confirmation emails to all enrolled members
      const sessionName = classTypes.find((t) => t.id === sessionForm.class_type_id)?.name ?? "Coaching duo";
      const dateObj = new Date(`${sessionForm.date}T${sessionForm.start_hour}:00`);
      const sessionDate = dateObj.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const sessionTime = `${sessionForm.start_hour} – ${sessionForm.end_hour}`;
      for (const memberId of sessionForm.assigned_member_ids) {
        fetch("/api/admin/emails/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId,
            sessionName,
            sessionDate,
            sessionTime,
            coachName: sessionForm.coach_name,
            recurring: sessionForm.recurring,
          }),
        }).catch(() => {});
      }
    }

    setSavingSession(false);
    setShowCreateSession(false);
    setDuoMemberSearch("");
    setSoloMemberSearch("");
    setRefreshKey((k) => k + 1);
    setSessionForm({
      class_type_id: "",
      session_type: "collective",
      assigned_member_id: "",
      assigned_member_ids: [],
      coach_name: "Manon",
      date: "",
      start_hour: "09:00",
      end_hour: "10:00",
      max_participants: "10",
      min_cancel_hours: "3",
      recurring: false,
      infinite_recurrence: false,
      hide_weeks: true,
      weeks: "4",
    });
  }

  async function handleEditSession(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSession) return;
    setSavingEdit(true);

    const supabase = createClient();
    const startTime = new Date(`${editForm.date}T${editForm.start_hour}:00`);
    const endTime = new Date(`${editForm.date}T${editForm.end_hour}:00`);
    const isIndividual = editForm.session_type === "individual";

    await supabase
      .from("class_sessions")
      .update({
        class_type_id: editForm.class_type_id,
        coach_name: editForm.coach_name,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        max_participants: isIndividual ? 1 : parseInt(editForm.max_participants),
        min_cancel_hours: parseInt(editForm.min_cancel_hours),
        assigned_member_id: isIndividual ? editForm.assigned_member_id || null : null,
        is_hidden: editForm.is_hidden,
      })
      .eq("id", editingSession.id);

    // Note: for duo sessions, member management is handled via the calendar bookees panel

    // If individual session's member changed, update the booking
    if (isIndividual && editForm.assigned_member_id !== (editingSession.assigned_member_id ?? "")) {
      // Cancel old booking if exists
      if (editingSession.assigned_member_id) {
        const { data: oldBooking } = await supabase
          .from("class_bookings")
          .select("id, session_debited")
          .eq("class_session_id", editingSession.id)
          .eq("member_id", editingSession.assigned_member_id)
          .eq("status", "confirmed")
          .single();

        if (oldBooking) {
          await supabase
            .from("class_bookings")
            .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
            .eq("id", oldBooking.id);

          if (oldBooking.session_debited) {
            await supabase.rpc("increment_individual_balance", {
              p_member_id: editingSession.assigned_member_id,
            });
          }
        }
      }

      // Create new booking for new member
      if (editForm.assigned_member_id) {
        await supabase.from("class_bookings").upsert(
          {
            member_id: editForm.assigned_member_id,
            class_session_id: editingSession.id,
            status: "confirmed",
            session_debited: true,
            booked_at: new Date().toISOString(),
            cancelled_at: null,
          },
          { onConflict: "member_id,class_session_id" }
        );
        await supabase.rpc("decrement_individual_balance", {
          p_member_id: editForm.assigned_member_id,
        });

        // Email the new member
        const sessionName = editingSession.class_types.name;
        const dateObj = new Date(editingSession.start_time);
        const sessionDate = dateObj.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        const startHour = dateObj.toTimeString().slice(0, 5);
        const endHour = new Date(editingSession.end_time).toTimeString().slice(0, 5);
        fetch("/api/admin/emails/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId: editForm.assigned_member_id,
            sessionName,
            sessionDate,
            sessionTime: `${startHour} – ${endHour}`,
            coachName: editForm.coach_name,
            recurring: false,
          }),
        }).catch(() => {});
      }
    }

    setSavingEdit(false);
    setEditSoloMemberSearch("");
    setShowEditSession(false);
    setEditingSession(null);
    setRefreshKey((k) => k + 1);
  }

  async function handleCancelSession() {
    if (!editingSession) return;
    setCancellingSession(true);

    const supabase = createClient();

    // Refund all confirmed bookings
    const { data: confirmedBookings } = await supabase
      .from("class_bookings")
      .select("id, member_id, session_debited")
      .eq("class_session_id", editingSession.id)
      .eq("status", "confirmed");

    if (confirmedBookings && confirmedBookings.length > 0) {
      await supabase
        .from("class_bookings")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("class_session_id", editingSession.id)
        .eq("status", "confirmed");

      for (const b of confirmedBookings) {
        if (b.session_debited) {
          const rpcFn = editingSession.session_type === "individual"
            ? "increment_individual_balance"
            : editingSession.session_type === "duo"
            ? "increment_duo_balance"
            : "increment_collective_balance";
          await supabase.rpc(rpcFn, { p_member_id: b.member_id });
        }
      }

      // Send cancellation emails to all booked members
      const memberIds = [...new Set(confirmedBookings.map((b) => b.member_id))];
      const sessionName = editingSession.class_types.name;
      const dateObj = new Date(editingSession.start_time);
      const sessionDate = dateObj.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const startHour = dateObj.toTimeString().slice(0, 5);
      const endHour = new Date(editingSession.end_time).toTimeString().slice(0, 5);
      fetch("/api/admin/emails/cancellation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberIds,
          sessionName,
          sessionDate,
          sessionTime: `${startHour} – ${endHour}`,
          sessionType: editingSession.session_type,
        }),
      }).catch(() => {});
    }

    await supabase
      .from("class_sessions")
      .update({ is_cancelled: true })
      .eq("id", editingSession.id);

    setCancellingSession(false);
    setShowEditSession(false);
    setEditingSession(null);
    setRefreshKey((k) => k + 1);
  }

  async function handleCreateType(e: React.FormEvent) {
    e.preventDefault();
    setSavingType(true);

    const supabase = createClient();
    await supabase.from("class_types").insert({
      name: typeForm.name,
      description: typeForm.description || null,
      color: typeForm.color,
      duration_minutes: parseInt(typeForm.duration_minutes),
    });

    setSavingType(false);
    setTypeForm({ name: "", description: "", color: "#D4AF37", duration_minutes: "60" });
    loadClassTypes();
  }

  async function deleteClassType(id: string) {
    const supabase = createClient();
    await supabase.from("class_types").delete().eq("id", id);
    loadClassTypes();
  }

  async function handleToggleVisibility(session: ClassSessionWithType) {
    const supabase = createClient();
    await supabase
      .from("class_sessions")
      .update({ is_hidden: !session.is_hidden })
      .eq("id", session.id);
    setRefreshKey((k) => k + 1);
  }

  async function handleRevealWeek(sessionIds: string[]) {
    const supabase = createClient();
    await supabase
      .from("class_sessions")
      .update({ is_hidden: false })
      .in("id", sessionIds);
    setRefreshKey((k) => k + 1);
  }

  const isIndividual = sessionForm.session_type === "individual";
  const isDuo = sessionForm.session_type === "duo";
  const isPrivate = isIndividual || isDuo;
  const editIsIndividual = editForm.session_type === "individual";
  const editIsDuo = editForm.session_type === "duo";
  const editIsPrivate = editIsIndividual || editIsDuo;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Planning</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez les cours collectifs et individuels (solo & duo)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowManageTypes(true)}>
            <Palette size={14} />
            Types
          </Button>
          <Button size="sm" onClick={() => setShowCreateSession(true)}>
            <Plus size={14} />
            Ajouter un cours
          </Button>
        </div>
      </div>

      <WeeklyCalendar
        key={refreshKey}
        isAdmin
        adminMembers={members.map((m) => ({
          id: m.id,
          first_name: m.first_name,
          last_name: m.last_name,
          collective_balance: m.collective_balance,
          duo_balance: m.duo_balance ?? 0,
        }))}
        onRequestEdit={openEditModal}
        onToggleVisibility={handleToggleVisibility}
        onRevealWeek={handleRevealWeek}
      />

      {/* Create session modal */}
      <Modal
        open={showCreateSession}
        onClose={() => setShowCreateSession(false)}
        title="Créer un cours"
        size="lg"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          {/* Session type */}
          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">Type de séance</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSessionForm({ ...sessionForm, session_type: "collective" })}
                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                  sessionForm.session_type === "collective"
                    ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]"
                    : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
                }`}
              >
                Collectif
              </button>
              <button
                type="button"
                onClick={() => setSessionForm({ ...sessionForm, session_type: "individual", assigned_member_ids: [] })}
                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                  isIndividual
                    ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                    : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
                }`}
              >
                Solo
              </button>
              <button
                type="button"
                onClick={() => setSessionForm({ ...sessionForm, session_type: "duo", assigned_member_id: "" })}
                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                  isDuo
                    ? "bg-purple-500/10 border-purple-500/40 text-purple-400"
                    : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
                }`}
              >
                Duo
              </button>
            </div>
          </div>

          {isIndividual && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Adhérent concerné</p>
              {sessionForm.assigned_member_id ? (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="flex items-center gap-1 bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs rounded-full px-2.5 py-1">
                    {(() => { const m = members.find((m) => m.id === sessionForm.assigned_member_id); return m ? `${m.first_name} ${m.last_name}` : ""; })()}
                    <button
                      type="button"
                      onClick={() => { setSessionForm({ ...sessionForm, assigned_member_id: "" }); setSoloMemberSearch(""); }}
                      className="text-blue-400/60 hover:text-blue-300 ml-0.5 leading-none"
                    >×</button>
                  </span>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={soloMemberSearch}
                    onChange={(e) => setSoloMemberSearch(e.target.value)}
                    placeholder="Rechercher un adhérent..."
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500/50 placeholder:text-gray-600"
                  />
                  {soloMemberSearch.trim().length > 0 && (
                    <div className="mt-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                      {members
                        .filter((m) => (`${m.first_name} ${m.last_name}`).toLowerCase().includes(soloMemberSearch.toLowerCase()))
                        .slice(0, 8)
                        .map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setSessionForm({ ...sessionForm, assigned_member_id: m.id }); setSoloMemberSearch(""); }}
                            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-blue-500/10 transition-colors"
                          >
                            {m.first_name} {m.last_name}
                          </button>
                        ))}
                      {members.filter((m) => (`${m.first_name} ${m.last_name}`).toLowerCase().includes(soloMemberSearch.toLowerCase())).length === 0 && (
                        <p className="px-3 py-2 text-xs text-gray-600 italic">Aucun résultat</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {isDuo && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Adhérents à inscrire</p>
              {/* Selected members chips */}
              {sessionForm.assigned_member_ids.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {sessionForm.assigned_member_ids.map((id) => {
                    const m = members.find((m) => m.id === id);
                    if (!m) return null;
                    return (
                      <span key={id} className="flex items-center gap-1 bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs rounded-full px-2.5 py-1">
                        {m.first_name} {m.last_name}
                        <button
                          type="button"
                          onClick={() => setSessionForm({ ...sessionForm, assigned_member_ids: sessionForm.assigned_member_ids.filter((i) => i !== id) })}
                          className="text-purple-400/60 hover:text-purple-300 ml-0.5 leading-none"
                        >×</button>
                      </span>
                    );
                  })}
                </div>
              )}
              {/* Search input */}
              <input
                type="text"
                value={duoMemberSearch}
                onChange={(e) => setDuoMemberSearch(e.target.value)}
                placeholder="Rechercher un adhérent..."
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500/50 placeholder:text-gray-600"
              />
              {/* Filtered results */}
              {duoMemberSearch.trim().length > 0 && (
                <div className="mt-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                  {members
                    .filter((m) => {
                      const q = duoMemberSearch.toLowerCase();
                      return (
                        !sessionForm.assigned_member_ids.includes(m.id) &&
                        (`${m.first_name} ${m.last_name}`).toLowerCase().includes(q)
                      );
                    })
                    .slice(0, 8)
                    .map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSessionForm({ ...sessionForm, assigned_member_ids: [...sessionForm.assigned_member_ids, m.id] });
                          setDuoMemberSearch("");
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-purple-500/10 transition-colors"
                      >
                        {m.first_name} {m.last_name}
                      </button>
                    ))}
                  {members.filter((m) => {
                    const q = duoMemberSearch.toLowerCase();
                    return !sessionForm.assigned_member_ids.includes(m.id) && (`${m.first_name} ${m.last_name}`).toLowerCase().includes(q);
                  }).length === 0 && (
                    <p className="px-3 py-2 text-xs text-gray-600 italic">Aucun résultat</p>
                  )}
                </div>
              )}
            </div>
          )}

          <Select
            label="Type de cours"
            value={sessionForm.class_type_id}
            onChange={(e) =>
              setSessionForm({ ...sessionForm, class_type_id: e.target.value })
            }
            options={[
              { value: "", label: "Sélectionner un type..." },
              ...classTypes.map((t) => ({ value: t.id, label: t.name })),
            ]}
            required
          />
          <Input
            label="Nom du coach"
            value={sessionForm.coach_name}
            onChange={(e) =>
              setSessionForm({ ...sessionForm, coach_name: e.target.value })
            }
            placeholder="Ex: Marie Dupont"
            required
          />
          <Input
            label="Date"
            type="date"
            value={sessionForm.date}
            onChange={(e) =>
              setSessionForm({ ...sessionForm, date: e.target.value })
            }
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Heure de début"
              type="time"
              value={sessionForm.start_hour}
              onChange={(e) =>
                setSessionForm({ ...sessionForm, start_hour: e.target.value })
              }
              required
            />
            <Input
              label="Heure de fin"
              type="time"
              value={sessionForm.end_hour}
              onChange={(e) =>
                setSessionForm({ ...sessionForm, end_hour: e.target.value })
              }
              required
            />
          </div>

          {!isIndividual && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Places max"
                type="number"
                min="1"
                value={sessionForm.max_participants}
                onChange={(e) =>
                  setSessionForm({ ...sessionForm, max_participants: e.target.value })
                }
                required
              />
              <Input
                label="Annulation min (heures)"
                type="number"
                min="0"
                value={sessionForm.min_cancel_hours}
                onChange={(e) =>
                  setSessionForm({ ...sessionForm, min_cancel_hours: e.target.value })
                }
              />
            </div>
          )}

          {isIndividual && (
            <Input
              label="Annulation min (heures)"
              type="number"
              min="0"
              value={sessionForm.min_cancel_hours}
              onChange={(e) =>
                setSessionForm({ ...sessionForm, min_cancel_hours: e.target.value })
              }
            />
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sessionForm.recurring}
              onChange={(e) =>
                setSessionForm({ ...sessionForm, recurring: e.target.checked, infinite_recurrence: false })
              }
              className="w-4 h-4 accent-[#D4AF37]"
            />
            <span className="text-sm text-gray-300">
              Cours récurrent (même jour chaque semaine)
            </span>
          </label>

          {sessionForm.recurring && (
            <div className="space-y-3 pl-4 border-l-2 border-[#D4AF37]/20">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSessionForm({ ...sessionForm, infinite_recurrence: false })}
                  className={`flex-1 p-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    !sessionForm.infinite_recurrence
                      ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]"
                      : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
                  }`}
                >
                  Nombre fixe
                </button>
                <button
                  type="button"
                  onClick={() => setSessionForm({ ...sessionForm, infinite_recurrence: true, hide_weeks: true })}
                  className={`flex-1 p-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    sessionForm.infinite_recurrence
                      ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]"
                      : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
                  }`}
                >
                  Récurrence infinie
                </button>
              </div>

              {!sessionForm.infinite_recurrence && (
                <Input
                  label="Nombre de semaines"
                  type="number"
                  min="1"
                  max="52"
                  value={sessionForm.weeks}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, weeks: e.target.value })
                  }
                />
              )}

              {sessionForm.infinite_recurrence && (
                <div className="space-y-2">
                  <div className="bg-[#1a1a1a] rounded-lg p-3">
                    <p className="text-xs text-gray-400">
                      104 séances seront générées (2 ans), puis renouvelables.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sessionForm.hide_weeks}
                      onChange={(e) =>
                        setSessionForm({ ...sessionForm, hide_weeks: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#D4AF37]"
                    />
                    <span className="text-sm text-gray-300 flex items-center gap-1.5">
                      <EyeOff size={14} className="text-gray-500" />
                      Masquer les semaines (débloquer manuellement)
                    </span>
                  </label>
                  {sessionForm.hide_weeks && (
                    <p className="text-xs text-gray-500 pl-6">
                      Les membres ne verront les séances que lorsque vous les débloquez depuis le calendrier.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {isIndividual && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-400">
                ✓ L&apos;adhérent sera automatiquement inscrit et son solde solo débité
                {sessionForm.recurring
                  ? sessionForm.infinite_recurrence
                    ? " pour 104 séances (récurrence infinie)"
                    : ` pour ${sessionForm.weeks} séances`
                  : ""}.
              </p>
            </div>
          )}

          {isDuo && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <p className="text-xs text-purple-400">
                ✓ Les adhérents sélectionnés seront automatiquement inscrits et leur solde duo débité
                {sessionForm.recurring
                  ? sessionForm.infinite_recurrence
                    ? " pour 104 séances (récurrence infinie)"
                    : ` pour ${sessionForm.weeks} séances`
                  : ""}.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setShowCreateSession(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={savingSession} className="flex-1">
              {sessionForm.recurring
                ? sessionForm.infinite_recurrence
                  ? "Créer la récurrence infinie"
                  : `Créer ${sessionForm.weeks} cours`
                : "Créer le cours"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit session modal */}
      <Modal
        open={showEditSession}
        onClose={() => {
          setShowEditSession(false);
          setEditingSession(null);
        }}
        title="Modifier le cours"
        size="lg"
      >
        {editingSession && (
          <form onSubmit={handleEditSession} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                editIsIndividual
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                  : editIsDuo
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                  : "bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]"
              }`}>
                {editIsIndividual ? "Coaching solo" : editIsDuo ? "Coaching duo" : "Cours collectif"}
              </span>
            </div>

            {editIsIndividual && (
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">Adhérent concerné</p>
                {editForm.assigned_member_id ? (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="flex items-center gap-1 bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs rounded-full px-2.5 py-1">
                      {(() => { const m = members.find((m) => m.id === editForm.assigned_member_id); return m ? `${m.first_name} ${m.last_name}` : ""; })()}
                      <button
                        type="button"
                        onClick={() => { setEditForm({ ...editForm, assigned_member_id: "" }); setEditSoloMemberSearch(""); }}
                        className="text-blue-400/60 hover:text-blue-300 ml-0.5 leading-none"
                      >×</button>
                    </span>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={editSoloMemberSearch}
                      onChange={(e) => setEditSoloMemberSearch(e.target.value)}
                      placeholder="Rechercher un adhérent..."
                      className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500/50 placeholder:text-gray-600"
                    />
                    {editSoloMemberSearch.trim().length > 0 && (
                      <div className="mt-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                        {members
                          .filter((m) => (`${m.first_name} ${m.last_name}`).toLowerCase().includes(editSoloMemberSearch.toLowerCase()))
                          .slice(0, 8)
                          .map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => { setEditForm({ ...editForm, assigned_member_id: m.id }); setEditSoloMemberSearch(""); }}
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-blue-500/10 transition-colors"
                            >
                              {m.first_name} {m.last_name}
                            </button>
                          ))}
                        {members.filter((m) => (`${m.first_name} ${m.last_name}`).toLowerCase().includes(editSoloMemberSearch.toLowerCase())).length === 0 && (
                          <p className="px-3 py-2 text-xs text-gray-600 italic">Aucun résultat</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {editIsDuo && (
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                <p className="text-xs text-purple-400">
                  Coaching duo — les inscriptions sont gérées depuis le calendrier.
                </p>
              </div>
            )}

            <Select
              label="Type de cours"
              value={editForm.class_type_id}
              onChange={(e) =>
                setEditForm({ ...editForm, class_type_id: e.target.value })
              }
              options={[
                { value: "", label: "Sélectionner un type..." },
                ...classTypes.map((t) => ({ value: t.id, label: t.name })),
              ]}
              required
            />

            <Input
              label="Nom du coach"
              value={editForm.coach_name}
              onChange={(e) =>
                setEditForm({ ...editForm, coach_name: e.target.value })
              }
              placeholder="Ex: Marie Dupont"
              required
            />

            <Input
              label="Date"
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Heure de début"
                type="time"
                value={editForm.start_hour}
                onChange={(e) =>
                  setEditForm({ ...editForm, start_hour: e.target.value })
                }
                required
              />
              <Input
                label="Heure de fin"
                type="time"
                value={editForm.end_hour}
                onChange={(e) =>
                  setEditForm({ ...editForm, end_hour: e.target.value })
                }
                required
              />
            </div>

            {!editIsIndividual && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Places max"
                  type="number"
                  min="1"
                  value={editForm.max_participants}
                  onChange={(e) =>
                    setEditForm({ ...editForm, max_participants: e.target.value })
                  }
                  required
                />
                <Input
                  label="Annulation min (heures)"
                  type="number"
                  min="0"
                  value={editForm.min_cancel_hours}
                  onChange={(e) =>
                    setEditForm({ ...editForm, min_cancel_hours: e.target.value })
                  }
                />
              </div>
            )}

            {editIsIndividual && (
              <Input
                label="Annulation min (heures)"
                type="number"
                min="0"
                value={editForm.min_cancel_hours}
                onChange={(e) =>
                  setEditForm({ ...editForm, min_cancel_hours: e.target.value })
                }
              />
            )}

            {!editIsPrivate && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.is_hidden}
                  onChange={(e) =>
                    setEditForm({ ...editForm, is_hidden: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#D4AF37]"
                />
                <span className="text-sm text-gray-300 flex items-center gap-1.5">
                  {editForm.is_hidden ? (
                    <EyeOff size={14} className="text-gray-500" />
                  ) : (
                    <Eye size={14} className="text-green-400" />
                  )}
                  {editForm.is_hidden ? "Masqué aux membres" : "Visible aux membres"}
                </span>
              </label>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setShowEditSession(false);
                  setEditingSession(null);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" loading={savingEdit} className="flex-1">
                Enregistrer
              </Button>
            </div>

            {/* Danger zone */}
            <div className="border-t border-[#1f1f1f] pt-4">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <AlertTriangle size={12} />
                Zone dangereuse — action irréversible
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full text-red-400 border-red-400/30 hover:bg-red-400/10"
                onClick={handleCancelSession}
                loading={cancellingSession}
              >
                Annuler et supprimer ce cours
              </Button>
              <p className="text-xs text-gray-600 text-center mt-1">
                Les inscriptions seront annulées et les soldes remboursés automatiquement.
              </p>
            </div>
          </form>
        )}
      </Modal>

      {/* Manage class types modal */}
      <Modal
        open={showManageTypes}
        onClose={() => setShowManageTypes(false)}
        title="Types de cours"
        size="lg"
      >
        <div className="space-y-4">
          {classTypes.length > 0 && (
            <div className="space-y-2">
              {classTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-3"
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: type.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{type.name}</p>
                    <p className="text-gray-500 text-xs">{type.duration_minutes} min</p>
                  </div>
                  <button
                    onClick={() => deleteClassType(type.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-[#1f1f1f] pt-4">
            <p className="text-sm font-medium text-gray-300 mb-3">Ajouter un type</p>
            <form onSubmit={handleCreateType} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Nom"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  placeholder="Ex: Yoga, Pilates..."
                  required
                />
                <Input
                  label="Durée (min)"
                  type="number"
                  min="15"
                  value={typeForm.duration_minutes}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, duration_minutes: e.target.value })
                  }
                />
              </div>
              <Textarea
                label="Description (optionnel)"
                value={typeForm.description}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, description: e.target.value })
                }
                placeholder="Décrivez ce type de cours..."
              />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Couleur
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTypeForm({ ...typeForm, color })}
                      className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                        typeForm.color === color
                          ? "ring-2 ring-white ring-offset-2 ring-offset-[#111] scale-110"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" loading={savingType} className="w-full">
                <Plus size={14} />
                Ajouter ce type
              </Button>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}

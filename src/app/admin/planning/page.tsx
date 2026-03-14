"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { WeeklyCalendar, ClassSessionWithType } from "@/components/planning/WeeklyCalendar";
import { Plus, Palette, Trash2, AlertTriangle } from "lucide-react";
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
    session_type: "collective" as "collective" | "individual",
    assigned_member_id: "",
    coach_name: "",
    date: "",
    start_hour: "09:00",
    end_hour: "10:00",
    max_participants: "10",
    min_cancel_hours: "2",
    recurring: false,
    weeks: "4",
  });

  const [editForm, setEditForm] = useState({
    class_type_id: "",
    session_type: "collective" as "collective" | "individual",
    assigned_member_id: "",
    coach_name: "",
    date: "",
    start_hour: "09:00",
    end_hour: "10:00",
    max_participants: "10",
    min_cancel_hours: "2",
  });

  const [typeForm, setTypeForm] = useState({
    name: "",
    description: "",
    color: "#D4AF37",
    duration_minutes: "60",
  });

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
      session_type: session.session_type,
      assigned_member_id: session.assigned_member_id ?? "",
      coach_name: session.coach_name,
      date: dateStr,
      start_hour: startHour,
      end_hour: endHour,
      max_participants: String(session.max_participants),
      min_cancel_hours: String(session.min_cancel_hours),
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

    const sessions = [];

    if (sessionForm.recurring) {
      const weeks = parseInt(sessionForm.weeks);
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
          recurring_rule: `weekly:${weeks}`,
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
    }

    setSavingSession(false);
    setShowCreateSession(false);
    setRefreshKey((k) => k + 1);
    setSessionForm({
      class_type_id: "",
      session_type: "collective",
      assigned_member_id: "",
      coach_name: "",
      date: "",
      start_hour: "09:00",
      end_hour: "10:00",
      max_participants: "10",
      min_cancel_hours: "2",
      recurring: false,
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
      })
      .eq("id", editingSession.id);

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
      }
    }

    setSavingEdit(false);
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
            : "increment_collective_balance";
          await supabase.rpc(rpcFn, { p_member_id: b.member_id });
        }
      }
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

  const isIndividual = sessionForm.session_type === "individual";
  const editIsIndividual = editForm.session_type === "individual";

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Planning</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez les cours collectifs et individuels
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
        onRequestEdit={openEditModal}
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
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSessionForm({ ...sessionForm, session_type: "collective" })}
                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                  !isIndividual
                    ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]"
                    : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
                }`}
              >
                Cours collectif
              </button>
              <button
                type="button"
                onClick={() => setSessionForm({ ...sessionForm, session_type: "individual" })}
                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                  isIndividual
                    ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                    : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
                }`}
              >
                Cours individuel
              </button>
            </div>
          </div>

          {isIndividual && (
            <Select
              label="Adhérent concerné"
              value={sessionForm.assigned_member_id}
              onChange={(e) =>
                setSessionForm({ ...sessionForm, assigned_member_id: e.target.value })
              }
              options={[
                { value: "", label: "Sélectionner un adhérent..." },
                ...members.map((m) => ({
                  value: m.id,
                  label: `${m.first_name} ${m.last_name}`,
                })),
              ]}
              required={isIndividual}
            />
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
                setSessionForm({ ...sessionForm, recurring: e.target.checked })
              }
              className="w-4 h-4 accent-[#D4AF37]"
            />
            <span className="text-sm text-gray-300">
              Cours récurrent (même jour chaque semaine)
            </span>
          </label>

          {sessionForm.recurring && (
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

          {isIndividual && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-400">
                ✓ L&apos;adhérent sera automatiquement inscrit et son solde individuel débité
                {sessionForm.recurring ? ` pour ${sessionForm.weeks} séances` : ""}.
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
                ? `Créer ${sessionForm.weeks} cours`
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
            {editIsIndividual && (
              <Select
                label="Adhérent concerné"
                value={editForm.assigned_member_id}
                onChange={(e) =>
                  setEditForm({ ...editForm, assigned_member_id: e.target.value })
                }
                options={[
                  { value: "", label: "Aucun adhérent..." },
                  ...members.map((m) => ({
                    value: m.id,
                    label: `${m.first_name} ${m.last_name}`,
                  })),
                ]}
              />
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

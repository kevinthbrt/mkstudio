"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import {
  Users,
  Plus,
  Search,
  Zap,
  UserPlus,
  Mail,
  Phone,
  PlusCircle,
  MinusCircle,
  Gift,
  FileText,
  Calendar,
  XCircle,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface OrderWithProduct {
  id: string;
  amount: number;
  sessions_purchased: number;
  invoice_number: string;
  status: string;
  created_at: string;
  products: { name: string; session_type: string } | null;
}

interface BookingWithDetails {
  id: string;
  status: "confirmed" | "cancelled";
  booked_at: string;
  cancelled_at: string | null;
  class_sessions: {
    start_time: string;
    session_type: "collective" | "individual" | "duo";
    class_types: { name: string } | null;
  } | null;
}

type HistoryItem =
  | { kind: "purchase"; date: string; data: OrderWithProduct }
  | { kind: "booking"; date: string; data: BookingWithDetails };

function formatDatetime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MembersPage() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);

  // Adjust balance state
  const [adjustMode, setAdjustMode] = useState<"none" | "collective" | "individual" | "duo" | "credit">("none");
  const [adjustDelta, setAdjustDelta] = useState(1);
  const [adjusting, setAdjusting] = useState(false);

  // Member history
  const [memberHistory, setMemberHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "history">("info");

  // Legal status editing
  const [editingLegalStatus, setEditingLegalStatus] = useState(false);
  const [legalStatusValue, setLegalStatusValue] = useState("");
  const [savingLegalStatus, setSavingLegalStatus] = useState(false);

  const [newMember, setNewMember] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "member")
      .order("last_name");
    setMembers(data || []);
    setLoading(false);
  }

  async function loadMemberHistory(memberId: string) {
    setHistoryLoading(true);
    const supabase = createClient();

    const [{ data: ordersData }, { data: bookingsData }] = await Promise.all([
      supabase
        .from("orders")
        .select(`id, amount, sessions_purchased, invoice_number, status, created_at, products (name, session_type)`)
        .eq("member_id", memberId)
        .order("created_at", { ascending: false }),
      supabase
        .from("class_bookings")
        .select(`id, status, booked_at, cancelled_at, class_sessions (start_time, session_type, class_types (name))`)
        .eq("member_id", memberId)
        .order("booked_at", { ascending: false }),
    ]);

    const purchaseItems: HistoryItem[] = ((ordersData as any[]) || []).map((o) => ({
      kind: "purchase",
      date: o.created_at,
      data: o,
    }));

    const bookingItems: HistoryItem[] = ((bookingsData as any[]) || []).map((b) => ({
      kind: "booking",
      date: b.booked_at,
      data: b,
    }));

    const merged = [...purchaseItems, ...bookingItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setMemberHistory(merged);
    setHistoryLoading(false);
  }

  async function handleCreateMember(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMember),
    });

    const data = await res.json();
    if (!res.ok) {
      setCreateError(data.error || "Erreur lors de la création");
    } else {
      setShowCreate(false);
      setNewMember({ first_name: "", last_name: "", email: "", phone: "", password: "" });
      loadMembers();
    }
    setCreating(false);
  }

  // Direct balance adjustment (no invoice)
  async function handleAdjustBalance(type: "collective" | "individual" | "duo") {
    if (!selectedMember) return;
    setAdjusting(true);

    const field = type === "individual" ? "individual_balance" : type === "duo" ? "duo_balance" : "collective_balance";
    const current = type === "individual"
      ? selectedMember.individual_balance
      : type === "duo"
      ? selectedMember.duo_balance
      : selectedMember.collective_balance;
    const newBalance = Math.max(0, current + adjustDelta);

    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ [field]: newBalance })
      .eq("id", selectedMember.id);

    const updated = {
      ...selectedMember,
      [field]: newBalance,
    };
    setMembers((m) => m.map((mb) => (mb.id === selectedMember.id ? updated : mb)));
    setSelectedMember(updated);
    setAdjusting(false);
    setAdjustMode("none");
    setAdjustDelta(1);
  }

  // Credit without invoice via API
  async function handleDirectCredit(type: "collective" | "individual" | "duo") {
    if (!selectedMember) return;
    setAdjusting(true);

    const res = await fetch("/api/admin/credit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: selectedMember.id,
        session_type: type,
        amount: adjustDelta,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const field = type === "individual" ? "individual_balance" : type === "duo" ? "duo_balance" : "collective_balance";
      const updated = { ...selectedMember, [field]: data.new_balance };
      setMembers((m) => m.map((mb) => (mb.id === selectedMember.id ? updated : mb)));
      setSelectedMember(updated);
    }

    setAdjusting(false);
    setAdjustMode("none");
    setAdjustDelta(1);
  }

  function openMemberModal(member: Profile) {
    setSelectedMember(member);
    setAdjustMode("none");
    setAdjustDelta(1);
    setActiveTab("info");
    setMemberHistory([]);
    setEditingLegalStatus(false);
    setLegalStatusValue(member.legal_status || "");
  }

  async function handleSaveLegalStatus() {
    if (!selectedMember) return;
    setSavingLegalStatus(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ legal_status: legalStatusValue || null })
      .eq("id", selectedMember.id);
    const updated = { ...selectedMember, legal_status: legalStatusValue || null };
    setMembers((m) => m.map((mb) => (mb.id === selectedMember.id ? updated : mb)));
    setSelectedMember(updated);
    setEditingLegalStatus(false);
    setSavingLegalStatus(false);
  }

  function handleTabChange(tab: "info" | "history") {
    setActiveTab(tab);
    if (tab === "history" && selectedMember && memberHistory.length === 0) {
      loadMemberHistory(selectedMember.id);
    }
  }

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.first_name.toLowerCase().includes(q) ||
      m.last_name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Adhérents</h1>
          <p className="text-gray-500 text-sm mt-1">
            {members.length} adhérent(s) inscrit(s)
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Nouvel adhérent
        </Button>
      </div>

      <Input
        placeholder="Rechercher un adhérent..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search size={16} />}
      />

      {filtered.length === 0 ? (
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-10 text-center">
          <Users size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            {search ? "Aucun résultat" : "Aucun adhérent"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <Card
              key={member.id}
              hover
              className="p-4"
              onClick={() => openMemberModal(member)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-bold text-sm">
                    {member.first_name[0]}
                    {member.last_name[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">
                    {member.first_name} {member.last_name}
                  </p>
                  <p className="text-gray-500 text-xs truncate">{member.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Users size={11} className="text-[#D4AF37]" />
                      <span className="text-[#D4AF37] text-xs font-semibold">
                        {member.collective_balance}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap size={11} className="text-blue-400" />
                      <span className="text-blue-400 text-xs font-semibold">
                        {member.individual_balance}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UserPlus size={11} className="text-purple-400" />
                      <span className="text-purple-400 text-xs font-semibold">
                        {member.duo_balance}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#1f1f1f]">
                <p className="text-xs text-gray-600">
                  Inscrit le {formatDate(member.created_at)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create member modal */}
      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setCreateError("");
        }}
        title="Créer un adhérent"
      >
        <form onSubmit={handleCreateMember} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              value={newMember.first_name}
              onChange={(e) => setNewMember({ ...newMember, first_name: e.target.value })}
              required
            />
            <Input
              label="Nom"
              value={newMember.last_name}
              onChange={(e) => setNewMember({ ...newMember, last_name: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={newMember.email}
            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
            icon={<Mail size={14} />}
            required
          />
          <Input
            label="Téléphone (optionnel)"
            type="tel"
            value={newMember.phone}
            onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
            icon={<Phone size={14} />}
          />
          <Input
            label="Mot de passe temporaire"
            type="password"
            value={newMember.password}
            onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
            required
          />

          {createError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              <p className="text-sm text-red-400">{createError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowCreate(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={creating} className="flex-1">
              Créer l&apos;adhérent
            </Button>
          </div>
        </form>
      </Modal>

      {/* Member detail modal */}
      {selectedMember && (
        <Modal
          open={!!selectedMember}
          onClose={() => {
            setSelectedMember(null);
            setAdjustMode("none");
            setAdjustDelta(1);
          }}
          title="Fiche adhérent"
          size="lg"
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center">
                <span className="text-black font-bold text-lg">
                  {selectedMember.first_name[0]}
                  {selectedMember.last_name[0]}
                </span>
              </div>
              <div>
                <p className="text-white font-bold text-lg">
                  {selectedMember.first_name} {selectedMember.last_name}
                </p>
                <p className="text-gray-500 text-sm">{selectedMember.email}</p>
                {selectedMember.phone && (
                  <p className="text-gray-500 text-sm">{selectedMember.phone}</p>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-1">
              <button
                onClick={() => handleTabChange("info")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "info"
                    ? "bg-[#1a1a1a] text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Soldes & Actions
              </button>
              <button
                onClick={() => handleTabChange("history")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "history"
                    ? "bg-[#1a1a1a] text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Historique
              </button>
            </div>

            {/* Info tab */}
            {activeTab === "info" && (
              <>
                {/* Three balances */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#1a1a1a] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users size={12} className="text-[#D4AF37]" />
                      <p className="text-gray-400 text-xs">Collectif</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {selectedMember.collective_balance}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">séances</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap size={12} className="text-blue-400" />
                      <p className="text-gray-400 text-xs">Solo</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {selectedMember.individual_balance}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">séances</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <UserPlus size={12} className="text-purple-400" />
                      <p className="text-gray-400 text-xs">Duo</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {selectedMember.duo_balance}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">séances</p>
                  </div>
                </div>

                {/* Legal status */}
                <div className="bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a]">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-gray-500 font-medium">Statut juridique</p>
                    {!editingLegalStatus && (
                      <button
                        type="button"
                        onClick={() => { setEditingLegalStatus(true); setLegalStatusValue(selectedMember.legal_status || ""); }}
                        className="text-xs text-[#D4AF37] hover:text-[#B8941E]"
                      >
                        Modifier
                      </button>
                    )}
                  </div>
                  {editingLegalStatus ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={legalStatusValue}
                        onChange={(e) => setLegalStatusValue(e.target.value)}
                        placeholder="Ex: Particulier, Auto-entrepreneur..."
                        className="flex-1 bg-[#111] border border-[#3a3a3a] text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#D4AF37]"
                      />
                      <Button size="sm" loading={savingLegalStatus} onClick={handleSaveLegalStatus}>OK</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingLegalStatus(false)}>✕</Button>
                    </div>
                  ) : (
                    <p className="text-sm text-white">
                      {selectedMember.legal_status || <span className="text-gray-600 italic">Non renseigné</span>}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                {adjustMode === "none" && (
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#D4AF37] border-[#D4AF37]/30"
                      onClick={() => { setAdjustMode("collective"); setAdjustDelta(1); }}
                    >
                      <Users size={14} />
                      Collectif
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-400 border-blue-400/30"
                      onClick={() => { setAdjustMode("individual"); setAdjustDelta(1); }}
                    >
                      <Zap size={14} />
                      Solo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-purple-400 border-purple-400/30"
                      onClick={() => { setAdjustMode("duo"); setAdjustDelta(1); }}
                    >
                      <UserPlus size={14} />
                      Duo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-400 border-green-400/30 col-span-3"
                      onClick={() => { setAdjustMode("credit"); setAdjustDelta(1); }}
                    >
                      <Gift size={14} />
                      Crédit direct (sans vente)
                    </Button>
                  </div>
                )}

                {/* Adjust collective/individual/duo balance */}
                {(adjustMode === "collective" || adjustMode === "individual" || adjustMode === "duo") && (
                  <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-3">
                    <p className="text-sm text-gray-300 font-medium">
                      Ajustement du solde{" "}
                      <span className={adjustMode === "individual" ? "text-blue-400" : adjustMode === "duo" ? "text-purple-400" : "text-[#D4AF37]"}>
                        {adjustMode === "individual" ? "solo" : adjustMode === "duo" ? "duo" : "collectif"}
                      </span>
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setAdjustDelta((d) => Math.max(-20, d - 1))}
                        className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#333] transition-colors"
                      >
                        <MinusCircle size={18} />
                      </button>
                      <div className="flex-1 text-center">
                        <p className={`text-2xl font-bold ${adjustDelta >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {adjustDelta > 0 ? "+" : ""}
                          {adjustDelta}
                        </p>
                        <p className="text-xs text-gray-500">
                          Nouveau solde :{" "}
                          {Math.max(
                            0,
                            (adjustMode === "individual"
                              ? selectedMember.individual_balance
                              : adjustMode === "duo"
                              ? selectedMember.duo_balance
                              : selectedMember.collective_balance) + adjustDelta
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => setAdjustDelta((d) => Math.min(20, d + 1))}
                        className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#333] transition-colors"
                      >
                        <PlusCircle size={18} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => { setAdjustMode("none"); setAdjustDelta(1); }}
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAdjustBalance(adjustMode as "collective" | "individual" | "duo")}
                        loading={adjusting}
                      >
                        Confirmer
                      </Button>
                    </div>
                  </div>
                )}

                {/* Credit direct (no invoice) */}
                {adjustMode === "credit" && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-300 font-medium mb-0.5">Crédit direct sans vente</p>
                      <p className="text-xs text-gray-500">Aucune facture générée</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setAdjustDelta((d) => Math.max(1, d - 1))}
                        className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#333] transition-colors"
                      >
                        <MinusCircle size={18} />
                      </button>
                      <div className="flex-1 text-center">
                        <p className="text-2xl font-bold text-green-400">+{adjustDelta}</p>
                        <p className="text-xs text-gray-500">séance(s) à créditer</p>
                      </div>
                      <button
                        onClick={() => setAdjustDelta((d) => Math.min(50, d + 1))}
                        className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#333] transition-colors"
                      >
                        <PlusCircle size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#D4AF37] border-[#D4AF37]/30"
                        onClick={() => handleDirectCredit("collective")}
                        loading={adjusting}
                      >
                        <Users size={12} />
                        Collectif
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-400 border-blue-400/30"
                        onClick={() => handleDirectCredit("individual")}
                        loading={adjusting}
                      >
                        <Zap size={12} />
                        Solo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-purple-400 border-purple-400/30"
                        onClick={() => handleDirectCredit("duo")}
                        loading={adjusting}
                      >
                        <UserPlus size={12} />
                        Duo
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => { setAdjustMode("none"); setAdjustDelta(1); }}
                    >
                      Annuler
                    </Button>
                  </div>
                )}

                <div className="text-xs text-gray-600 text-center">
                  Inscrit le {formatDate(selectedMember.created_at)}
                </div>
              </>
            )}

            {/* History tab */}
            {activeTab === "history" && (
              <div className="space-y-2">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : memberHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock size={28} className="text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Aucune activité enregistrée</p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto space-y-0 pr-1">
                    {memberHistory.map((item, index) => (
                      <div key={`${item.kind}-${item.data.id}`} className="flex gap-3">
                        {/* Timeline */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-3 ${
                              item.kind === "purchase"
                                ? "bg-[#D4AF37]/10 border border-[#D4AF37]/30"
                                : item.kind === "booking" &&
                                  (item.data as BookingWithDetails).status === "cancelled"
                                ? "bg-red-500/10 border border-red-500/30"
                                : (item.data as BookingWithDetails).class_sessions
                                    ?.session_type === "individual"
                                ? "bg-blue-500/10 border border-blue-500/30"
                                : (item.data as BookingWithDetails).class_sessions
                                    ?.session_type === "duo"
                                ? "bg-purple-500/10 border border-purple-500/30"
                                : "bg-green-500/10 border border-green-500/30"
                            }`}
                          >
                            {item.kind === "purchase" ? (
                              <FileText size={12} className="text-[#D4AF37]" />
                            ) : (item.data as BookingWithDetails).status === "cancelled" ? (
                              <XCircle size={12} className="text-red-400" />
                            ) : (item.data as BookingWithDetails).class_sessions
                                ?.session_type === "individual" ? (
                              <Zap size={12} className="text-blue-400" />
                            ) : (item.data as BookingWithDetails).class_sessions
                                ?.session_type === "duo" ? (
                              <UserPlus size={12} className="text-purple-400" />
                            ) : (
                              <Users size={12} className="text-green-400" />
                            )}
                          </div>
                          {index < memberHistory.length - 1 && (
                            <div className="w-px flex-1 bg-[#1f1f1f] my-1" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-3 pt-2.5">
                          {item.kind === "purchase" ? (
                            <AdminPurchaseRow order={item.data as OrderWithProduct} />
                          ) : (
                            <AdminBookingRow booking={item.data as BookingWithDetails} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function AdminPurchaseRow({ order }: { order: OrderWithProduct }) {
  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-white font-medium text-xs">{order.products?.name}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {new Date(order.created_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-xs text-gray-400">+{order.sessions_purchased} séance(s)</span>
            {order.products?.session_type === "individual" ? (
              <Badge variant="blue">Solo</Badge>
            ) : order.products?.session_type === "duo" ? (
              <Badge variant="purple">Duo</Badge>
            ) : (
              <Badge variant="gold">Collectif</Badge>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[#D4AF37] font-bold text-xs">{order.amount} €</p>
          <p className="text-gray-600 text-xs mt-0.5">{order.invoice_number}</p>
        </div>
      </div>
    </div>
  );
}

function AdminBookingRow({ booking }: { booking: BookingWithDetails }) {
  const session = booking.class_sessions;
  const isIndividual = session?.session_type === "individual";
  const isDuo = session?.session_type === "duo";
  const isCancelled = booking.status === "cancelled";

  return (
    <div
      className={`border rounded-lg p-3 ${
        isCancelled
          ? "bg-red-500/5 border-red-500/20"
          : isIndividual
          ? "bg-blue-500/5 border-blue-500/20"
          : isDuo
          ? "bg-purple-500/5 border-purple-500/20"
          : "bg-[#111111] border-[#1f1f1f]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`font-medium text-xs ${isCancelled ? "text-gray-500 line-through" : "text-white"}`}>
            {session?.class_types?.name || "Séance"}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            Réservé le{" "}
            {new Date(booking.booked_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {session?.start_time && (
            <p className="text-gray-600 text-xs flex items-center gap-1 mt-0.5">
              <Calendar size={10} />
              Séance :{" "}
              {new Date(session.start_time).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {isIndividual ? (
              <Badge variant="blue">Solo</Badge>
            ) : isDuo ? (
              <Badge variant="purple">Duo</Badge>
            ) : (
              <Badge variant="gold">Collectif</Badge>
            )}
            {isCancelled ? (
              <Badge variant="red">Annulé</Badge>
            ) : (
              <Badge variant="green">Confirmé</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

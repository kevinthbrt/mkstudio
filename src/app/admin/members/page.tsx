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
  User,
  Phone,
  Mail,
  PlusCircle,
  MinusCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";

export default function MembersPage() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [adjustBalance, setAdjustBalance] = useState({ show: false, delta: 1 });

  const [newMember, setNewMember] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [adjusting, setAdjusting] = useState(false);

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
      setNewMember({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
      });
      loadMembers();
    }
    setCreating(false);
  }

  async function handleAdjustBalance() {
    if (!selectedMember) return;
    setAdjusting(true);

    const supabase = createClient();
    const newBalance = Math.max(
      0,
      selectedMember.session_balance + adjustBalance.delta
    );

    await supabase
      .from("profiles")
      .update({ session_balance: newBalance })
      .eq("id", selectedMember.id);

    setMembers((m) =>
      m.map((member) =>
        member.id === selectedMember.id
          ? { ...member, session_balance: newBalance }
          : member
      )
    );
    setSelectedMember({ ...selectedMember, session_balance: newBalance });
    setAdjusting(false);
    setAdjustBalance({ show: false, delta: 1 });
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

      {/* Search */}
      <Input
        placeholder="Rechercher un adhérent..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search size={16} />}
      />

      {/* Members list */}
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
              onClick={() => setSelectedMember(member)}
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
                  <p className="text-gray-500 text-xs truncate">
                    {member.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Zap size={12} className="text-[#D4AF37]" />
                    <span className="text-[#D4AF37] text-xs font-semibold">
                      {member.session_balance} séance(s)
                    </span>
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
              onChange={(e) =>
                setNewMember({ ...newMember, first_name: e.target.value })
              }
              required
            />
            <Input
              label="Nom"
              value={newMember.last_name}
              onChange={(e) =>
                setNewMember({ ...newMember, last_name: e.target.value })
              }
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={newMember.email}
            onChange={(e) =>
              setNewMember({ ...newMember, email: e.target.value })
            }
            icon={<Mail size={14} />}
            required
          />
          <Input
            label="Téléphone (optionnel)"
            type="tel"
            value={newMember.phone}
            onChange={(e) =>
              setNewMember({ ...newMember, phone: e.target.value })
            }
            icon={<Phone size={14} />}
          />
          <Input
            label="Mot de passe temporaire"
            type="password"
            value={newMember.password}
            onChange={(e) =>
              setNewMember({ ...newMember, password: e.target.value })
            }
            required
          />

          {createError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              <p className="text-sm text-red-400">{createError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setShowCreate(false)}
            >
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
            setAdjustBalance({ show: false, delta: 1 });
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
                <p className="text-gray-500 text-sm">
                  {selectedMember.email}
                </p>
                {selectedMember.phone && (
                  <p className="text-gray-500 text-sm">
                    {selectedMember.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Balance */}
            <div className="bg-[#1a1a1a] rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Solde de séances</p>
                <p className="text-4xl font-bold text-white mt-1">
                  {selectedMember.session_balance}
                </p>
              </div>
              <Zap size={32} className="text-[#D4AF37]" />
            </div>

            {/* Adjust balance */}
            {!adjustBalance.show ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setAdjustBalance({ show: true, delta: 1 })}
              >
                <Zap size={16} />
                Ajuster le solde manuellement
              </Button>
            ) : (
              <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-3">
                <p className="text-sm text-gray-300 font-medium">
                  Ajustement du solde
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setAdjustBalance((a) => ({
                        ...a,
                        delta: Math.max(-20, a.delta - 1),
                      }))
                    }
                    className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#333] transition-colors"
                  >
                    <MinusCircle size={18} />
                  </button>
                  <div className="flex-1 text-center">
                    <p
                      className={`text-2xl font-bold ${
                        adjustBalance.delta >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {adjustBalance.delta > 0 ? "+" : ""}
                      {adjustBalance.delta}
                    </p>
                    <p className="text-xs text-gray-500">
                      Nouveau solde :{" "}
                      {Math.max(
                        0,
                        selectedMember.session_balance + adjustBalance.delta
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setAdjustBalance((a) => ({
                        ...a,
                        delta: Math.min(20, a.delta + 1),
                      }))
                    }
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
                    onClick={() =>
                      setAdjustBalance({ show: false, delta: 1 })
                    }
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleAdjustBalance}
                    loading={adjusting}
                  >
                    Confirmer
                  </Button>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-600 text-center">
              Inscrit le {formatDate(selectedMember.created_at)}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

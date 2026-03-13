"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { User, Phone, Mail, Save, CheckCircle } from "lucide-react";
import type { Profile } from "@/types/database";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile(data);
      setForm({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || "",
      });
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || null,
      })
      .eq("id", profile.id);

    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setProfile({ ...profile, ...form });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mon profil</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gérez vos informations personnelles
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center shadow-[0_4px_20px_rgba(212,175,55,0.3)]">
          <span className="text-black font-bold text-xl">
            {profile?.first_name?.[0]}
            {profile?.last_name?.[0]}
          </span>
        </div>
        <div>
          <p className="text-white font-semibold">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-gray-500 text-sm">{profile?.email}</p>
          <p className="text-[#D4AF37] text-xs font-medium mt-0.5">Adhérent</p>
        </div>
      </div>

      {/* Session balance */}
      <Card className="p-5 border-[#D4AF37]/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Solde de séances</p>
            <p className="text-4xl font-bold text-white mt-1">
              {profile?.session_balance}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">séances disponibles</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
        </div>
      </Card>

      {/* Edit form */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-white mb-4">
          Informations personnelles
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              value={form.first_name}
              onChange={(e) =>
                setForm({ ...form, first_name: e.target.value })
              }
              icon={<User size={14} />}
              required
            />
            <Input
              label="Nom"
              value={form.last_name}
              onChange={(e) =>
                setForm({ ...form, last_name: e.target.value })
              }
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={profile?.email || ""}
            icon={<Mail size={14} />}
            disabled
            className="opacity-50 cursor-not-allowed"
          />
          <Input
            label="Téléphone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+33 6 00 00 00 00"
            icon={<Phone size={14} />}
          />

          {success && (
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5">
              <CheckCircle size={16} />
              <span className="text-sm">Profil mis à jour avec succès !</span>
            </div>
          )}

          <Button type="submit" loading={saving} className="w-full">
            <Save size={16} />
            Enregistrer
          </Button>
        </form>
      </Card>
    </div>
  );
}

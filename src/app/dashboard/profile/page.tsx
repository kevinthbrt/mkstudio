"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { User, Phone, Mail, Save, CheckCircle, Users, Zap, Lock, AlertTriangle } from "lucide-react";
import { PushNotificationSetup } from "@/components/PushNotificationSetup";
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

  const [passwordForm, setPasswordForm] = useState({
    new_password: "",
    confirm_password: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

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

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (passwordForm.new_password.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: passwordForm.new_password });

    if (error) {
      setPasswordError(error.message || "Erreur lors de la mise à jour du mot de passe.");
    } else {
      setPasswordSuccess(true);
      setPasswordForm({ new_password: "", confirm_password: "" });
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
    setSavingPassword(false);
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

      {/* Session balances */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 border-[#D4AF37]/20">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-[#D4AF37]" />
            <p className="text-gray-400 text-xs">Solde collectif</p>
          </div>
          <p className="text-3xl font-bold text-white">{profile?.collective_balance}</p>
          <p className="text-gray-600 text-xs mt-0.5">séances</p>
        </Card>
        <Card className="p-4 border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-blue-400" />
            <p className="text-gray-400 text-xs">Solde individuel</p>
          </div>
          <p className="text-3xl font-bold text-white">{profile?.individual_balance}</p>
          <p className="text-gray-600 text-xs mt-0.5">séances</p>
        </Card>
      </div>

      {/* Push notifications */}
      <Card className="p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">Notifications push</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Rappel 24h et 1h avant vos cours, confirmation d&apos;achat
          </p>
        </div>
        <PushNotificationSetup />
      </Card>

      {/* Password change */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Lock size={14} className="text-gray-400" />
          Changer le mot de passe
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            label="Nouveau mot de passe"
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            placeholder="Minimum 8 caractères"
            icon={<Lock size={14} />}
            required
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            value={passwordForm.confirm_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
            placeholder="Répétez le mot de passe"
            icon={<Lock size={14} />}
            required
          />
          {passwordError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{passwordError}</p>
            </div>
          )}
          {passwordSuccess && (
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5">
              <CheckCircle size={16} />
              <span className="text-sm">Mot de passe mis à jour !</span>
            </div>
          )}
          <Button type="submit" loading={savingPassword} variant="outline" className="w-full">
            <Lock size={16} />
            Mettre à jour le mot de passe
          </Button>
        </form>
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

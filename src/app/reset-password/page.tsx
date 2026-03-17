"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, CheckCircle, AlertTriangle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // The code exchange is handled server-side by /api/auth/callback
    // Here we just need to check if the session is ready
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || "Erreur lors de la mise à jour.");
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,175,55,0.12) 0%, transparent 60%), linear-gradient(180deg, #0b0a12 0%, #0e0d14 100%)",
      }}
    >
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 rounded-3xl blur-xl bg-[#D4AF37]/30" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E8C84A] via-[#D4AF37] to-[#B8941E] flex items-center justify-center shadow-[0_12px_40px_rgba(212,175,55,0.45)]">
              <span className="text-black font-black text-2xl tracking-tight">MK</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Nouveau mot de passe</h1>
          <p className="text-gray-500 text-sm mt-1.5">Choisissez un nouveau mot de passe sécurisé</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
          style={{
            background: "linear-gradient(135deg, rgba(30,28,45,0.9) 0%, rgba(22,21,38,0.95) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
          }}
        >
          {checking ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-400 text-sm mt-4">Vérification en cours...</p>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Mot de passe mis à jour !</p>
                <p className="text-gray-400 text-sm mt-1">
                  Redirection vers la connexion...
                </p>
              </div>
            </div>
          ) : !ready ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                <AlertTriangle size={28} className="text-amber-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Lien invalide ou expiré</p>
                <p className="text-gray-400 text-sm mt-1">
                  Ce lien est invalide ou a expiré. Veuillez refaire une demande de réinitialisation.
                </p>
              </div>
              <Link href="/forgot-password">
                <Button className="w-full" variant="outline">
                  Réessayer
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nouveau mot de passe"
                type="password"
                placeholder="Minimum 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={16} />}
                required
                autoComplete="new-password"
              />
              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="Répétez le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock size={16} />}
                required
                autoComplete="new-password"
              />

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                Enregistrer le nouveau mot de passe
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-700 mt-5">
          MK Studio © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}

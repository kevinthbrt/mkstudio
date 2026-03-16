"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError("Une erreur est survenue. Vérifiez l'adresse email.");
    } else {
      setSent(true);
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
          <h1 className="text-3xl font-black text-white tracking-tight">Mot de passe oublié</h1>
          <p className="text-gray-500 text-sm mt-1.5">
            {sent ? "Email envoyé !" : "Entrez votre email pour réinitialiser votre mot de passe"}
          </p>
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
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Email envoyé !</p>
                <p className="text-gray-400 text-sm mt-1">
                  Vérifiez votre boîte mail et suivez le lien pour réinitialiser votre mot de passe.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={16} />}
                required
                autoComplete="email"
              />

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                Envoyer le lien de réinitialisation
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-600 mt-5">
          <Link
            href="/login"
            className="text-[#D4AF37] font-semibold hover:text-[#F5E06B] transition-colors flex items-center justify-center gap-1"
          >
            <ArrowLeft size={14} />
            Retour à la connexion
          </Link>
        </p>

        <p className="text-center text-xs text-gray-700 mt-3">
          MK Studio © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#D4AF37]/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-[#D4AF37]/3 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center mx-auto mb-4 shadow-[0_8px_40px_rgba(212,175,55,0.4)]">
            <span className="text-black font-bold text-xl">MK</span>
          </div>
          <h1 className="text-2xl font-bold text-white">MK Studio</h1>
          <p className="text-gray-500 text-sm mt-1">Connectez-vous à votre espace</p>
        </div>

        {/* Form */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
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
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Se connecter
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          MK Studio © {new Date().getFullYear()} — Tous droits réservés
        </p>
      </div>
    </div>
  );
}

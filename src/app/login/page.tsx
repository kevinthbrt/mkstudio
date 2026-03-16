"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,175,55,0.12) 0%, transparent 60%), linear-gradient(180deg, #0b0a12 0%, #0e0d14 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)" }}
      />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)" }}
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
          <h1 className="text-3xl font-black text-white tracking-tight">MK Studio</h1>
          <p className="text-gray-500 text-sm mt-1.5">Connectez-vous à votre espace</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
          style={{
            background: "linear-gradient(135deg, rgba(30,28,45,0.9) 0%, rgba(22,21,38,0.95) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
          }}
        >
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
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-[#D4AF37] transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Se connecter
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-5">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-[#D4AF37] font-semibold hover:text-[#F5E06B] transition-colors">
            S&apos;inscrire
          </Link>
        </p>

        <p className="text-center text-xs text-gray-700 mt-3">
          MK Studio © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

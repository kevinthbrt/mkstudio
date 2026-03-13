"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertTriangle, Loader } from "lucide-react";

type Step = "checking" | "no_db" | "no_profile" | "creating" | "done" | "error";

export default function SetupPage() {
  const [step, setStep] = useState<Step>("checking");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkAndFix();
  }, []);

  async function checkAndFix() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Check if profiles table exists by querying it
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (error?.code === "42P01") {
      // Table doesn't exist
      setStep("no_db");
      return;
    }

    if (error || !profile) {
      // Table exists but profile missing or RLS error — auto-fix via API
      await createProfile();
      return;
    }

    // Profile exists, redirect
    if (profile.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  }

  async function createProfile() {
    setStep("creating");
    const res = await fetch("/api/setup/create-profile", { method: "POST" });
    const data = await res.json();

    if (res.ok) {
      setStep("done");
      setMessage(data.message || "Profil créé !");
      setTimeout(() => {
        if (data.role === "admin") router.push("/admin");
        else router.push("/dashboard");
      }, 2000);
    } else {
      setStep("error");
      setMessage(data.error || "Erreur inconnue");
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center mx-auto mb-4">
          <span className="text-black font-bold text-lg">MK</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Configuration MK Studio</h1>

        {step === "checking" && (
          <div className="space-y-3 mt-4">
            <Loader size={24} className="text-[#D4AF37] animate-spin mx-auto" />
            <p className="text-gray-400 text-sm">Vérification de la base de données...</p>
          </div>
        )}

        {step === "no_db" && (
          <div className="space-y-4 mt-4">
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left">
              <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 font-semibold text-sm">Base de données non configurée</p>
                <p className="text-gray-400 text-xs mt-1">
                  Les tables SQL n&apos;ont pas encore été créées dans Supabase.
                </p>
              </div>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4 text-left">
              <p className="text-white text-sm font-semibold mb-2">Action requise :</p>
              <ol className="text-gray-400 text-xs space-y-1.5 list-decimal list-inside">
                <li>Ouvre le SQL Editor Supabase</li>
                <li>Colle le fichier <code className="text-[#D4AF37]">FULL_SETUP.sql</code></li>
                <li>Clique Run, puis reviens ici</li>
              </ol>
              <a
                href="https://supabase.com/dashboard/project/fjzzylksthpnunrqazdg/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-[#D4AF37] text-xs font-semibold hover:underline"
              >
                Ouvrir le SQL Editor →
              </a>
            </div>
            <Button variant="outline" className="w-full" onClick={checkAndFix}>
              Vérifier à nouveau
            </Button>
          </div>
        )}

        {step === "no_profile" && (
          <div className="space-y-4 mt-4">
            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-left">
              <AlertTriangle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-400 font-semibold text-sm">Profil manquant</p>
                <p className="text-gray-400 text-xs mt-1">
                  Ton compte a été créé avant l&apos;installation du schéma. Clique ci-dessous pour créer ton profil.
                </p>
              </div>
            </div>
            <Button className="w-full" onClick={createProfile}>
              Créer mon profil
            </Button>
          </div>
        )}

        {step === "creating" && (
          <div className="space-y-3 mt-4">
            <Loader size={24} className="text-[#D4AF37] animate-spin mx-auto" />
            <p className="text-gray-400 text-sm">Création du profil en cours...</p>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-3 mt-4">
            <CheckCircle size={32} className="text-green-400 mx-auto" />
            <p className="text-green-400 font-semibold">{message}</p>
            <p className="text-gray-500 text-sm">Redirection en cours...</p>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4 mt-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-sm">{message}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={checkAndFix}>
              Réessayer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

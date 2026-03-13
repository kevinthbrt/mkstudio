import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WeeklyCalendar } from "@/components/planning/WeeklyCalendar";
import { Zap } from "lucide-react";
import Link from "next/link";

export default async function MemberPlanningPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, session_balance, first_name")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Planning des cours</h1>
          <p className="text-gray-500 text-sm mt-1">
            Inscrivez-vous aux cours collectifs
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-4 py-2.5 flex-shrink-0">
          <Zap size={16} className="text-[#D4AF37]" />
          <div>
            <p className="text-[#D4AF37] font-bold text-sm">
              {profile.session_balance}
            </p>
            <p className="text-gray-500 text-xs">séances</p>
          </div>
        </div>
      </div>

      {profile.session_balance === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-amber-400 text-sm">
            Solde vide — achetez un pack pour vous inscrire aux cours
          </p>
          <Link
            href="/dashboard/shop"
            className="text-[#D4AF37] text-sm font-semibold hover:underline flex-shrink-0 ml-3"
          >
            Acheter →
          </Link>
        </div>
      )}

      <WeeklyCalendar
        memberId={profile.id}
        sessionBalance={profile.session_balance}
      />
    </div>
  );
}

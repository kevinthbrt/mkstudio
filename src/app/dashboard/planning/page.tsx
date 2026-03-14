import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WeeklyCalendar } from "@/components/planning/WeeklyCalendar";
import { Zap, Users } from "lucide-react";

export default async function MemberPlanningPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, collective_balance, individual_balance, first_name")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Planning des cours</h1>
          <p className="text-gray-500 text-sm mt-1">
            Inscrivez-vous aux cours collectifs
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-[#111111] border border-[#D4AF37]/20 rounded-xl px-3 py-2">
            <Users size={14} className="text-[#D4AF37]" />
            <div>
              <p className="text-[#D4AF37] font-bold text-sm">{profile.collective_balance}</p>
              <p className="text-gray-500 text-xs">collectif</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#111111] border border-blue-500/20 rounded-xl px-3 py-2">
            <Zap size={14} className="text-blue-400" />
            <div>
              <p className="text-blue-400 font-bold text-sm">{profile.individual_balance}</p>
              <p className="text-gray-500 text-xs">individuel</p>
            </div>
          </div>
        </div>
      </div>

      {profile.collective_balance === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 text-sm">
            Solde collectif vide — contactez votre coach pour acheter un pack de séances.
          </p>
        </div>
      )}

      <WeeklyCalendar
        memberId={profile.id}
        collectiveBalance={profile.collective_balance}
        individualBalance={profile.individual_balance}
      />
    </div>
  );
}

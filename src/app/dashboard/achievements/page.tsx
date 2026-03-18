import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { XPBar } from "@/components/gamification/XPBar";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { createAdminClient } from "@/lib/supabase/admin";

async function getGamificationData(memberId: string) {
  const admin = createAdminClient();

  const [xpRes, streakRes, achievementsRes, allAchievementsRes] = await Promise.all([
    admin.from("user_xp").select("*").eq("member_id", memberId).maybeSingle(),
    admin.from("user_streaks").select("*").eq("member_id", memberId).maybeSingle(),
    admin.from("user_achievements").select("achievement_id, earned_at").eq("member_id", memberId),
    admin.from("achievements").select("*").order("sort_order"),
  ]);

  const xp = xpRes.data ?? { total_xp: 0, level: 1, title: "Novice" };
  const streak = streakRes.data ?? { current_streak_weeks: 0, longest_streak_weeks: 0 };
  const earnedIds = new Set((achievementsRes.data ?? []).map((a) => a.achievement_id));
  const earnedMap = Object.fromEntries(
    (achievementsRes.data ?? []).map((a) => [a.achievement_id, a.earned_at])
  );

  const xpThresholds = [0, 100, 300, 700, 1500, 3000, 6000, 12000, Infinity];
  const currentLevel = xp.level as number;
  const xpForCurrentLevel = xpThresholds[currentLevel - 1];
  const xpForNextLevel = xpThresholds[currentLevel];
  const progressPercent =
    xpForNextLevel === Infinity
      ? 100
      : Math.round(
          ((xp.total_xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100
        );

  const achievements = (allAchievementsRes.data ?? []).map((a) => ({
    ...a,
    earned: earnedIds.has(a.id),
    earned_at: earnedMap[a.id] ?? null,
  }));

  return {
    xp: {
      total_xp: xp.total_xp as number,
      level: currentLevel,
      title: xp.title as string,
      xp_for_current_level: xpForCurrentLevel,
      xp_for_next_level: xpForNextLevel === Infinity ? null : xpForNextLevel,
      progress_percent: progressPercent,
    },
    streak: {
      current: streak.current_streak_weeks as number,
      longest: streak.longest_streak_weeks as number,
    },
    achievements,
  };
}

async function getLeaderboard(memberId: string) {
  const admin = createAdminClient();

  const { data: allXp } = await admin
    .from("user_xp")
    .select("member_id, level, title, total_xp")
    .order("total_xp", { ascending: false });

  if (!allXp || allXp.length === 0) {
    return { leaderboard: [], my_rank: null, show_my_rank: null, total_members: 0 };
  }

  const memberIds = allXp.map((x) => x.member_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", memberIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const ranked = allXp.map((x, index) => {
    const p = profileMap[x.member_id as string];
    return {
      rank: index + 1,
      member_id: x.member_id as string,
      display_name: p ? `${p.first_name} ${p.last_name?.charAt(0) ?? ""}.` : "Membre",
      level: x.level as number,
      title: x.title as string,
      is_me: x.member_id === memberId,
    };
  });

  const top10 = ranked.slice(0, 10);
  const myRankEntry = ranked.find((r) => r.is_me) ?? null;
  const showMyRank = myRankEntry && myRankEntry.rank > 10 ? myRankEntry : null;

  return { leaderboard: top10, my_rank: myRankEntry, show_my_rank: showMyRank, total_members: ranked.length };
}

export default async function AchievementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  const [gamification, leaderboardData] = await Promise.all([
    getGamificationData(profile.id),
    getLeaderboard(profile.id),
  ]);

  const earnedCount = gamification.achievements.filter((a) => a.earned).length;
  const totalCount = gamification.achievements.length;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-3xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.03) 60%, transparent 100%)",
          border: "1px solid rgba(212,175,55,0.15)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <p className="text-xs font-semibold text-[#D4AF37]/70 uppercase tracking-widest mb-1">
          Progression
        </p>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Mes Badges & Niveau
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {earnedCount} badge{earnedCount !== 1 ? "s" : ""} débloqué{earnedCount !== 1 ? "s" : ""} sur {totalCount}
        </p>
      </div>

      {/* XP & Level */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, rgba(30,28,45,0.8) 0%, rgba(22,21,38,0.9) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <XPBar
          level={gamification.xp.level}
          title={gamification.xp.title}
          totalXp={gamification.xp.total_xp}
          xpForCurrentLevel={gamification.xp.xp_for_current_level}
          xpForNextLevel={gamification.xp.xp_for_next_level}
          progressPercent={gamification.xp.progress_percent}
        />
      </div>

      {/* Streak */}
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Assiduité
        </h2>
        <StreakDisplay
          current={gamification.streak.current}
          longest={gamification.streak.longest}
        />
      </div>

      {/* Badges */}
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Badges
        </h2>
        <div
          className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, rgba(30,28,45,0.8) 0%, rgba(22,21,38,0.9) 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <BadgeGrid achievements={gamification.achievements} />
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Classement
          </h2>
          <span className="text-xs text-gray-600">Top {Math.min(10, leaderboardData.total_members)}</span>
        </div>
        <div
          className="rounded-2xl p-4"
          style={{
            background: "linear-gradient(135deg, rgba(30,28,45,0.8) 0%, rgba(22,21,38,0.9) 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Leaderboard
            leaderboard={leaderboardData.leaderboard}
            my_rank={leaderboardData.my_rank}
            show_my_rank={leaderboardData.show_my_rank}
            total_members={leaderboardData.total_members}
          />
        </div>
      </div>
    </div>
  );
}

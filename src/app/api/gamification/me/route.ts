import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const [xpRes, streakRes, achievementsRes, allAchievementsRes] = await Promise.all([
    admin.from("user_xp").select("*").eq("member_id", profile.id).maybeSingle(),
    admin.from("user_streaks").select("*").eq("member_id", profile.id).maybeSingle(),
    admin
      .from("user_achievements")
      .select("achievement_id, earned_at")
      .eq("member_id", profile.id),
    admin.from("achievements").select("*").order("sort_order"),
  ]);

  const xp = xpRes.data ?? { total_xp: 0, level: 1, title: "Novice" };
  const streak = streakRes.data ?? { current_streak_weeks: 0, longest_streak_weeks: 0 };
  const earnedIds = new Set((achievementsRes.data ?? []).map((a) => a.achievement_id));
  const earnedMap = Object.fromEntries(
    (achievementsRes.data ?? []).map((a) => [a.achievement_id, a.earned_at])
  );

  // XP thresholds for level progress bar
  const xpThresholds = [0, 100, 300, 700, 1500, 3000, 6000, 12000, Infinity];
  const currentLevel = xp.level;
  const xpForCurrentLevel = xpThresholds[currentLevel - 1];
  const xpForNextLevel = xpThresholds[currentLevel];
  const xpProgress = xpForNextLevel === Infinity
    ? 100
    : Math.round(((xp.total_xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100);

  const achievements = (allAchievementsRes.data ?? []).map((a) => ({
    ...a,
    earned: earnedIds.has(a.id),
    earned_at: earnedMap[a.id] ?? null,
  }));

  return NextResponse.json({
    xp: {
      total_xp: xp.total_xp,
      level: currentLevel,
      title: xp.title,
      xp_for_current_level: xpForCurrentLevel,
      xp_for_next_level: xpForNextLevel === Infinity ? null : xpForNextLevel,
      progress_percent: xpProgress,
    },
    streak: {
      current: streak.current_streak_weeks,
      longest: streak.longest_streak_weeks,
    },
    achievements,
  });
}

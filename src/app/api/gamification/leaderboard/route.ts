import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data: allXp } = await db
    .from("user_xp")
    .select("member_id, level, title, total_xp")
    .order("total_xp", { ascending: false });

  if (!allXp || allXp.length === 0) {
    return NextResponse.json({ leaderboard: [], my_rank: null, total_members: 0 });
  }

  const memberIds = allXp.map((x: any) => x.member_id);

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name, last_name, is_test_account")
    .in("id", memberIds)
    .eq("is_test_account", false);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  );

  const ranked = allXp
    .filter((x: any) => profileMap[x.member_id])
    .map((x: any, index: number) => {
      const p = profileMap[x.member_id] as any;
      return {
        rank: index + 1,
        member_id: x.member_id,
        display_name: `${p.first_name} ${p.last_name?.charAt(0) ?? ""}.`,
        level: x.level,
        title: x.title,
        is_me: x.member_id === profile.id,
      };
    });

  const myRankEntry = ranked.find((r: any) => r.is_me);
  const top10 = ranked.slice(0, 10);
  const showMyRank = myRankEntry && myRankEntry.rank > 10 ? myRankEntry : null;

  return NextResponse.json({
    leaderboard: top10,
    my_rank: myRankEntry ?? null,
    show_my_rank: showMyRank,
    total_members: ranked.length,
  });
}

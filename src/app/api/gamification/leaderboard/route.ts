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

  // Get all members with XP, joined with profiles for name
  const { data: allXp } = await admin
    .from("user_xp")
    .select("member_id, level, title, total_xp")
    .order("total_xp", { ascending: false });

  if (!allXp || allXp.length === 0) {
    return NextResponse.json({ leaderboard: [], my_rank: null, total_members: 0 });
  }

  const memberIds = allXp.map((x) => x.member_id);

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", memberIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  );

  const ranked = allXp.map((x, index) => {
    const p = profileMap[x.member_id];
    const isMe = x.member_id === profile.id;
    return {
      rank: index + 1,
      member_id: x.member_id,
      // Show first name + last initial for privacy
      display_name: p ? `${p.first_name} ${p.last_name?.charAt(0) ?? ""}.` : "Membre",
      level: x.level,
      title: x.title,
      is_me: isMe,
    };
  });

  const myRankEntry = ranked.find((r) => r.is_me);
  const top10 = ranked.slice(0, 10);

  // If current user is not in top 10, add them at the end for reference
  const showMyRank =
    myRankEntry && myRankEntry.rank > 10 ? myRankEntry : null;

  return NextResponse.json({
    leaderboard: top10,
    my_rank: myRankEntry ?? null,
    show_my_rank: showMyRank,
    total_members: ranked.length,
  });
}

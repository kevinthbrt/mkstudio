"use client";

const LEVEL_COLORS: Record<number, string> = {
  1: "#9ca3af", 2: "#4ade80", 3: "#60a5fa",
  4: "#c084fc", 5: "#fb923c", 6: "#E8C84A",
  7: "#f87171", 8: "#f472b6",
};

const PODIUM_STYLES = [
  { icon: "🥇", bg: "rgba(212,175,55,0.12)", border: "rgba(212,175,55,0.3)" },
  { icon: "🥈", bg: "rgba(156,163,175,0.08)", border: "rgba(156,163,175,0.2)" },
  { icon: "🥉", bg: "rgba(180,83,9,0.08)", border: "rgba(180,83,9,0.2)" },
];

interface LeaderboardEntry {
  rank: number;
  member_id: string;
  display_name: string;
  level: number;
  title: string;
  is_me: boolean;
}

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  my_rank: LeaderboardEntry | null;
  show_my_rank: LeaderboardEntry | null;
  total_members: number;
}

export function Leaderboard({ leaderboard, my_rank, show_my_rank, total_members }: LeaderboardProps) {
  if (leaderboard.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)" }}>
        <p className="text-4xl mb-3">🌱</p>
        <p className="text-gray-400 text-sm font-medium">Le classement se construit au fil des séances.</p>
        <p className="text-gray-600 text-xs mt-1">Sois le premier à y figurer !</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Motivational header */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.1)" }}>
        <p className="text-xs text-gray-500 leading-relaxed">
          ✨ Chaque séance compte — le classement reflète votre assiduité. Progressez à votre rythme, l&apos;essentiel c&apos;est de revenir !
        </p>
      </div>

      {/* Top entries */}
      <div className="space-y-2">
        {leaderboard.map((entry) => {
          const podium = PODIUM_STYLES[entry.rank - 1];
          const levelColor = LEVEL_COLORS[entry.level] ?? "#9ca3af";

          return (
            <div
              key={entry.member_id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
              style={{
                background: entry.is_me
                  ? "rgba(212,175,55,0.08)"
                  : podium
                  ? podium.bg
                  : "rgba(255,255,255,0.02)",
                border: entry.is_me
                  ? "1px solid rgba(212,175,55,0.25)"
                  : podium
                  ? `1px solid ${podium.border}`
                  : "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {/* Rank */}
              <div className="w-7 text-center flex-shrink-0">
                {podium ? (
                  <span className="text-lg">{podium.icon}</span>
                ) : (
                  <span className="text-xs font-bold text-gray-600">#{entry.rank}</span>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {entry.display_name}
                  {entry.is_me && (
                    <span className="ml-2 text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded-md">
                      Toi
                    </span>
                  )}
                </p>
              </div>

              {/* Level badge */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ background: `${levelColor}15`, border: `1px solid ${levelColor}30` }}
              >
                <span className="text-[10px] font-black" style={{ color: levelColor }}>
                  Niv. {entry.level}
                </span>
                <span className="text-[10px] text-gray-500">·</span>
                <span className="text-[10px] font-semibold text-gray-400">{entry.title}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show current user's position if outside top 10 */}
      {show_my_rank && (
        <div>
          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[10px] text-gray-700">···</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)" }}
          >
            <div className="w-7 text-center flex-shrink-0">
              <span className="text-xs font-bold text-gray-600">#{show_my_rank.rank}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {show_my_rank.display_name}
                <span className="ml-2 text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded-md">
                  Toi
                </span>
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0"
              style={{
                background: `${LEVEL_COLORS[show_my_rank.level] ?? "#9ca3af"}15`,
                border: `1px solid ${LEVEL_COLORS[show_my_rank.level] ?? "#9ca3af"}30`,
              }}
            >
              <span className="text-[10px] font-black" style={{ color: LEVEL_COLORS[show_my_rank.level] ?? "#9ca3af" }}>
                Niv. {show_my_rank.level}
              </span>
              <span className="text-[10px] text-gray-500">·</span>
              <span className="text-[10px] font-semibold text-gray-400">{show_my_rank.title}</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 text-center mt-2">
            Tu es #{show_my_rank.rank} sur {total_members} membres — continue comme ça !
          </p>
        </div>
      )}

      {/* If in top 10 and not first */}
      {my_rank && !show_my_rank && my_rank.rank > 1 && (
        <p className="text-[10px] text-gray-600 text-center">
          Tu es #{my_rank.rank} sur {total_members} membres — félicitations !
        </p>
      )}
    </div>
  );
}

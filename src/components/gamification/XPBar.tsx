"use client";

const LEVEL_COLORS: Record<number, { bg: string; text: string; glow: string }> = {
  1: { bg: "#6b7280", text: "#9ca3af", glow: "rgba(107,114,128,0.3)" },
  2: { bg: "#22c55e", text: "#4ade80", glow: "rgba(34,197,94,0.3)" },
  3: { bg: "#3b82f6", text: "#60a5fa", glow: "rgba(59,130,246,0.3)" },
  4: { bg: "#a855f7", text: "#c084fc", glow: "rgba(168,85,247,0.3)" },
  5: { bg: "#f97316", text: "#fb923c", glow: "rgba(249,115,22,0.3)" },
  6: { bg: "#D4AF37", text: "#E8C84A", glow: "rgba(212,175,55,0.4)" },
  7: { bg: "#ef4444", text: "#f87171", glow: "rgba(239,68,68,0.35)" },
  8: { bg: "#ec4899", text: "#f472b6", glow: "rgba(236,72,153,0.4)" },
};

interface XPBarProps {
  level: number;
  title: string;
  totalXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number | null;
  progressPercent: number;
  compact?: boolean;
}

export function XPBar({
  level,
  title,
  totalXp,
  xpForCurrentLevel,
  xpForNextLevel,
  progressPercent,
  compact = false,
}: XPBarProps) {
  const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS[8];
  const isMaxLevel = xpForNextLevel === null;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Level badge */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
          style={{
            background: `${colors.bg}20`,
            border: `1px solid ${colors.bg}40`,
            color: colors.text,
            boxShadow: `0 0 12px ${colors.glow}`,
          }}
        >
          {level}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold" style={{ color: colors.text }}>
              {title}
            </span>
            <span className="text-[10px] text-gray-600">
              {isMaxLevel ? `${totalXp} XP` : `${totalXp - xpForCurrentLevel} / ${xpForNextLevel! - xpForCurrentLevel} XP`}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${colors.bg}, ${colors.text})`,
                boxShadow: `0 0 8px ${colors.glow}`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Large level badge */}
        <div
          className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
          style={{
            background: `${colors.bg}15`,
            border: `1.5px solid ${colors.bg}35`,
            boxShadow: `0 0 24px ${colors.glow}`,
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.text }}>
            Niv.
          </span>
          <span className="text-2xl font-black leading-none" style={{ color: colors.text }}>
            {level}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-lg leading-tight">{title}</p>
          <p className="text-gray-500 text-sm">{totalXp} XP au total</p>
        </div>
      </div>

      {/* Progress bar */}
      {!isMaxLevel && (
        <div>
          <div className="flex justify-between text-[11px] text-gray-600 mb-2">
            <span>Niveau {level}</span>
            <span>
              {totalXp - xpForCurrentLevel} / {xpForNextLevel! - xpForCurrentLevel} XP → Niveau {level + 1}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${colors.bg}, ${colors.text})`,
                boxShadow: `0 0 10px ${colors.glow}`,
              }}
            />
          </div>
        </div>
      )}
      {isMaxLevel && (
        <p className="text-xs font-semibold" style={{ color: colors.text }}>
          🏆 Niveau maximum atteint — Tu es une légende !
        </p>
      )}
    </div>
  );
}

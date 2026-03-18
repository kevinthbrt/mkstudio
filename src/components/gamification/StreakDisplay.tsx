"use client";

interface StreakDisplayProps {
  current: number;
  longest: number;
  compact?: boolean;
}

export function StreakDisplay({ current, longest, compact = false }: StreakDisplayProps) {
  const getStreakMessage = (weeks: number) => {
    if (weeks === 0) return "Fais ta première séance cette semaine !";
    if (weeks === 1) return "C'est parti ! Reviens la semaine prochaine.";
    if (weeks < 4) return "Tu prends de bonnes habitudes !";
    if (weeks < 8) return "Incroyable régularité !";
    if (weeks < 16) return "Tu es inarrêtable !";
    return "Une machine à séances !";
  };

  const flameColor = current === 0
    ? "#4b5563"
    : current >= 8
    ? "#f97316"
    : current >= 4
    ? "#fb923c"
    : "#fbbf24";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span style={{ color: flameColor, fontSize: "18px" }}>🔥</span>
        <div>
          <p className="text-white font-bold text-sm leading-none">
            {current} semaine{current !== 1 ? "s" : ""}
          </p>
          <p className="text-gray-600 text-[10px] mt-0.5">streak actuel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {/* Current streak */}
      <div
        className="flex-1 rounded-2xl p-4 text-center"
        style={{
          background: current > 0
            ? `rgba(249,115,22,0.08)`
            : "rgba(255,255,255,0.03)",
          border: current > 0
            ? "1px solid rgba(249,115,22,0.2)"
            : "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="text-3xl mb-1 transition-all duration-300"
          style={{ filter: current === 0 ? "grayscale(1)" : "none" }}
        >
          🔥
        </div>
        <p
          className="text-2xl font-black"
          style={{ color: current > 0 ? flameColor : "#374151" }}
        >
          {current}
        </p>
        <p className="text-gray-500 text-xs mt-0.5">
          semaine{current !== 1 ? "s" : ""} consécutive{current !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Best streak */}
      <div
        className="flex-1 rounded-2xl p-4 text-center"
        style={{
          background: "rgba(212,175,55,0.06)",
          border: "1px solid rgba(212,175,55,0.12)",
        }}
      >
        <div className="text-3xl mb-1">🏅</div>
        <p className="text-2xl font-black text-[#D4AF37]">{longest}</p>
        <p className="text-gray-500 text-xs mt-0.5">
          record personnel
        </p>
      </div>
    </div>
  );
}

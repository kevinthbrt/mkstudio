"use client";

import { useState } from "react";

const RARITY_STYLES: Record<string, { border: string; glow: string; label: string; labelColor: string }> = {
  common:    { border: "rgba(107,114,128,0.3)",  glow: "rgba(107,114,128,0.1)",  label: "Commun",     labelColor: "#9ca3af" },
  rare:      { border: "rgba(59,130,246,0.4)",   glow: "rgba(59,130,246,0.12)",  label: "Rare",       labelColor: "#60a5fa" },
  epic:      { border: "rgba(168,85,247,0.4)",   glow: "rgba(168,85,247,0.12)",  label: "Épique",     labelColor: "#c084fc" },
  legendary: { border: "rgba(212,175,55,0.5)",   glow: "rgba(212,175,55,0.15)",  label: "Légendaire", labelColor: "#D4AF37" },
};

const CATEGORY_LABELS: Record<string, string> = {
  sessions: "Séances",
  streaks:  "Assiduité",
  explorer: "Explorateur",
  social:   "Social",
  loyalty:  "Fidélité",
  special:  "Spécial",
};

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  rarity: string;
  earned: boolean;
  earned_at: string | null;
}

interface BadgeGridProps {
  achievements: Achievement[];
}

export function BadgeGrid({ achievements }: BadgeGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const categories = ["all", ...Array.from(new Set(achievements.map((a) => a.category)))];
  const filtered =
    selectedCategory === "all"
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  const earned = filtered.filter((a) => a.earned).length;
  const total = filtered.length;

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150"
            style={
              selectedCategory === cat
                ? { background: "rgba(212,175,55,0.15)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.3)" }
                : { background: "rgba(255,255,255,0.04)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.06)" }
            }
          >
            {cat === "all" ? "Tous" : CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Progress */}
      <p className="text-xs text-gray-600">
        {earned} / {total} badge{total > 1 ? "s" : ""} débloqué{earned > 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((achievement) => {
          const rarity = RARITY_STYLES[achievement.rarity] ?? RARITY_STYLES.common;
          const isHovered = hoveredId === achievement.id;

          return (
            <div
              key={achievement.id}
              className="relative flex flex-col items-center gap-2 p-3 rounded-2xl cursor-default transition-all duration-200"
              style={{
                background: achievement.earned
                  ? `rgba(30,28,45,0.9)`
                  : "rgba(15,14,24,0.6)",
                border: `1px solid ${achievement.earned ? rarity.border : "rgba(255,255,255,0.05)"}`,
                boxShadow: achievement.earned && isHovered ? `0 0 20px ${rarity.glow}` : "none",
                opacity: achievement.earned ? 1 : 0.45,
              }}
              onMouseEnter={() => setHoveredId(achievement.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Icon */}
              <span
                className="text-2xl leading-none transition-transform duration-200"
                style={{
                  filter: achievement.earned ? "none" : "grayscale(1)",
                  transform: isHovered && achievement.earned ? "scale(1.15)" : "scale(1)",
                }}
              >
                {achievement.icon}
              </span>

              {/* Name */}
              <p
                className="text-[10px] font-semibold text-center leading-tight"
                style={{ color: achievement.earned ? "#e5e7eb" : "#4b5563" }}
              >
                {achievement.name}
              </p>

              {/* Rarity dot */}
              {achievement.earned && (
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: rarity.labelColor }}
                />
              )}

              {/* Lock icon for locked */}
              {!achievement.earned && (
                <div className="text-gray-700 text-[10px]">🔒</div>
              )}

              {/* Tooltip on hover */}
              {isHovered && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 rounded-xl text-xs z-50 pointer-events-none"
                  style={{
                    background: "rgba(14,13,20,0.97)",
                    border: `1px solid ${rarity.border}`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.6)`,
                  }}
                >
                  <p className="font-bold text-white mb-1">{achievement.icon} {achievement.name}</p>
                  <p className="text-gray-400 leading-snug mb-2">{achievement.description}</p>
                  <div className="flex items-center justify-between">
                    <span style={{ color: rarity.labelColor }} className="font-semibold">
                      {rarity.label}
                    </span>
                    <span className="text-[#D4AF37] font-bold">+{achievement.xp_reward} XP</span>
                  </div>
                  {achievement.earned && achievement.earned_at && (
                    <p className="text-gray-600 text-[10px] mt-1.5 border-t border-white/5 pt-1.5">
                      Obtenu le {new Date(achievement.earned_at).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

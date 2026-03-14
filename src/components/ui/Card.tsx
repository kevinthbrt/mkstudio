import { cn } from "@/lib/utils";
import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gold?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, gold, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-gradient-to-br from-[#1e1c2d] to-[#191828] border border-[#2d2b40] rounded-2xl",
        hover &&
          "transition-all duration-200 hover:border-[#D4AF37]/40 hover:shadow-[0_8px_30px_rgba(212,175,55,0.12)] hover:-translate-y-0.5 cursor-pointer",
        gold && "border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.12)]",
        className
      )}
    >
      {children}
    </div>
  );
}

type StatColor = "gold" | "blue" | "green" | "purple" | "gray";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: StatColor;
}

const statColorMap: Record<StatColor, { icon: string; gradient: string; border: string }> = {
  gold: {
    icon: "bg-[#D4AF37]/15 text-[#D4AF37]",
    gradient: "from-[#D4AF37]/8 to-transparent",
    border: "border-[#D4AF37]/20",
  },
  blue: {
    icon: "bg-blue-500/15 text-blue-400",
    gradient: "from-blue-500/8 to-transparent",
    border: "border-blue-500/20",
  },
  green: {
    icon: "bg-green-500/15 text-green-400",
    gradient: "from-green-500/8 to-transparent",
    border: "border-green-500/20",
  },
  purple: {
    icon: "bg-purple-500/15 text-purple-400",
    gradient: "from-purple-500/8 to-transparent",
    border: "border-purple-500/20",
  },
  gray: {
    icon: "bg-[#2d2b40] text-gray-400",
    gradient: "from-white/3 to-transparent",
    border: "border-[#2d2b40]",
  },
};

export function StatCard({ title, value, subtitle, icon, trend, trendUp, color = "gray" }: StatCardProps) {
  const c = statColorMap[color];
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-5",
      "bg-gradient-to-br from-[#1e1c2d] to-[#191828]",
      c.border
    )}>
      {/* Gradient accent */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", c.gradient)} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-white mt-1.5 leading-none">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            {trend && (
              <p className={cn("text-xs font-medium mt-1.5", trendUp ? "text-green-400" : "text-red-400")}>
                {trend}
              </p>
            )}
          </div>
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", c.icon)}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

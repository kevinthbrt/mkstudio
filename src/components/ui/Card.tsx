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
        "bg-[#111111] border border-[#1f1f1f] rounded-xl",
        hover &&
          "transition-all duration-200 hover:border-[#D4AF37] hover:shadow-[0_4px_20px_rgba(212,175,55,0.15)] cursor-pointer",
        gold && "border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ title, value, subtitle, icon, trend, trendUp }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          {trend && (
            <p
              className={cn(
                "text-xs font-medium mt-1",
                trendUp ? "text-green-400" : "text-red-400"
              )}
            >
              {trend}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#D4AF37]">
          {icon}
        </div>
      </div>
    </Card>
  );
}

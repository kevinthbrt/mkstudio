"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "gold",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0e0d14] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none";

  const variants = {
    gold: "bg-gradient-to-r from-[#C9A227] via-[#E8C84A] to-[#C9A227] bg-size-200 text-[#0a0a0a] font-bold hover:shadow-[0_4px_24px_rgba(212,175,55,0.5)] hover:-translate-y-0.5 active:translate-y-0 focus:ring-[#D4AF37]",
    outline:
      "bg-transparent border border-[#2d2b40] text-gray-300 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 focus:ring-[#D4AF37]/30",
    ghost:
      "bg-transparent text-gray-400 hover:text-white hover:bg-white/5 focus:ring-white/10",
    danger:
      "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-400/50 focus:ring-red-500/30",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-sm",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

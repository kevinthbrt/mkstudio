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
    "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

  const variants = {
    gold: "bg-gradient-to-r from-[#D4AF37] via-[#F5E06B] to-[#D4AF37] text-[#0a0a0a] hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:-translate-y-0.5 focus:ring-[#D4AF37]",
    outline:
      "bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[rgba(212,175,55,0.1)] focus:ring-[#D4AF37]",
    ghost:
      "bg-transparent text-white hover:bg-[#1a1a1a] focus:ring-white/20",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

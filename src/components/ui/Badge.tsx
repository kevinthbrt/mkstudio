import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "green" | "red" | "gray" | "blue" | "purple";
  className?: string;
}

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  const variants = {
    gold: "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25 font-semibold",
    green: "bg-green-500/10 text-green-400 border border-green-500/25 font-semibold",
    red: "bg-red-500/10 text-red-400 border border-red-500/25 font-semibold",
    gray: "bg-white/5 text-gray-400 border border-white/8",
    blue: "bg-blue-500/10 text-blue-400 border border-blue-500/25 font-semibold",
    purple: "bg-purple-500/10 text-purple-400 border border-purple-500/25 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-lg text-xs",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

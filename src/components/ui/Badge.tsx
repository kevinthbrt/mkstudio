import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "green" | "red" | "gray" | "blue";
  className?: string;
}

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  const variants = {
    gold: "bg-[rgba(212,175,55,0.15)] text-[#D4AF37] border border-[rgba(212,175,55,0.3)]",
    green: "bg-[rgba(34,197,94,0.15)] text-green-400 border border-[rgba(34,197,94,0.3)]",
    red: "bg-[rgba(239,68,68,0.15)] text-red-400 border border-[rgba(239,68,68,0.3)]",
    gray: "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]",
    blue: "bg-[rgba(59,130,246,0.15)] text-blue-400 border border-[rgba(59,130,246,0.3)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

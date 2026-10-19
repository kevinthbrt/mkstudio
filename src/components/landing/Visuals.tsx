import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Visuels de remplacement de la landing, affichés tant qu'aucune photo
 * n'a été déposée dans public/photos/. Ils remplissent leur conteneur
 * (position absolute) : c'est <Illustration /> qui fixe le ratio.
 */

const pattern = {
  backgroundImage:
    "repeating-linear-gradient(135deg, rgba(201,162,39,0.06) 0px, rgba(201,162,39,0.06) 1px, transparent 1px, transparent 12px)",
};

export function IconVisual({
  icon: Icon,
  caption,
  dark,
  size = "md",
}: {
  icon: LucideIcon;
  caption?: string;
  dark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const disc = { sm: "h-12 w-12", md: "h-16 w-16", lg: "h-20 w-20" }[size];
  const glyph = { sm: 20, md: 26, lg: 32 }[size];

  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-3 text-center",
        dark
          ? "bg-[radial-gradient(ellipse_at_top,#2A2620_0%,#14131A_70%)]"
          : "bg-[radial-gradient(ellipse_at_top,#FBF4DE_0%,#F4EFE3_75%)]"
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0" style={pattern} />
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full",
          disc,
          dark
            ? "bg-gradient-to-br from-[#E8C84A] via-[#D4AF37] to-[#B8941E] text-[#14131A] shadow-[0_8px_30px_rgba(212,175,55,0.35)]"
            : "bg-white text-[#B8941E] shadow-[0_8px_24px_rgba(20,19,26,0.08)]"
        )}
      >
        <Icon size={glyph} strokeWidth={1.6} />
      </div>
      {caption && (
        <p
          className={cn(
            "relative text-[11px] font-semibold uppercase tracking-[0.18em]",
            dark ? "text-[#D4AF37]" : "text-[#8A7A34]"
          )}
        >
          {caption}
        </p>
      )}
    </div>
  );
}

export function LogoVisual() {
  // Le logo est livré en carré sur fond noir : on le fait couvrir tout le bloc
  // pour qu'aucun bord du carré d'origine ne soit visible.
  return (
    <div className="absolute inset-0 bg-[#0A0A0A]">
      <Image
        src="/android-chrome-512x512.png"
        alt="MK Studio"
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 45vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(212,175,55,0.12) 0%, transparent 55%)" }}
      />
    </div>
  );
}

export function InitialsVisual({ name, small }: { name: string; small?: boolean }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#E8C84A] via-[#D4AF37] to-[#B8941E]">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={pattern} />
      <span
        className={cn(
          "relative font-bold tracking-tight text-[#14131A]",
          small ? "text-lg" : "text-4xl"
        )}
      >
        {initials}
      </span>
    </div>
  );
}

export function MapVisual({ lines, href }: { lines: string[]; href: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#F4EFE3]">
      {/* Quadrillage façon plan */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(20,19,26,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(20,19,26,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[58%] h-6 w-[120%] -rotate-[8deg] bg-white/80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[38%] top-[-10%] h-[120%] w-4 rotate-[14deg] bg-white/70"
      />

      <div className="relative flex flex-col items-center gap-4 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#14131A] text-[#D4AF37] shadow-[0_10px_30px_rgba(20,19,26,0.25)]">
          <MapPin size={24} />
        </div>
        <div className="rounded-xl bg-white/90 px-4 py-2.5 shadow-sm">
          {lines.map((line, i) => (
            <p
              key={line}
              className={i === 0 ? "text-sm font-semibold text-[#14131A]" : "text-xs text-[#55524A]"}
            >
              {line}
            </p>
          ))}
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#14131A] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#2A2823]"
        >
          <Navigation size={14} />
          Itinéraire
        </a>
      </div>
    </div>
  );
}

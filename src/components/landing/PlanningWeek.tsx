import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { coaching } from "@/content/landing";
import { cn } from "@/lib/utils";

type Kind = (typeof coaching.planning.disciplines)[number]["kind"];

/** Teinte de chaque discipline : fond, texte, et pastille de la légende. */
const KIND_STYLES: Record<Kind, { card: string; time: string; dot: string }> = {
  cross: {
    card: "bg-[#14131A] text-white border-[#14131A]",
    time: "text-[#E8C84A]",
    dot: "bg-[#14131A]",
  },
  pilates: {
    card: "bg-[#EEF3EC] text-[#2F4A36] border-[#D9E5D5]",
    time: "text-[#4E7A58]",
    dot: "bg-[#7FA585]",
  },
  renfo: {
    card: "bg-[#FBF4DE] text-[#5C4F1C] border-[#F0E3B8]",
    time: "text-[#A88A22]",
    dot: "bg-[#D4AF37]",
  },
  seniors: {
    card: "bg-[#EFEEF8] text-[#3E3C70] border-[#DEDCF0]",
    time: "text-[#6461A8]",
    dot: "bg-[#8E8BC7]",
  },
};

export function PlanningWeek() {
  const { planning } = coaching;

  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-[#ECEAE3] bg-white shadow-[0_20px_60px_rgba(20,19,26,0.06)]">
      {/* En-tête */}
      <div className="flex flex-col gap-4 border-b border-[#ECEAE3] bg-[#FBFAF7] px-6 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#14131A]">
            <CalendarDays size={19} className="text-[#C9A227]" />
            {planning.title}
          </h3>
          <p className="mt-1 text-sm text-[#55524A]">{planning.intro}</p>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {planning.disciplines.map((d) => (
              <li key={d.kind} className="flex items-center gap-1.5 text-xs font-medium text-[#55524A]">
                <span className={cn("h-2.5 w-2.5 rounded-full", KIND_STYLES[d.kind].dot)} />
                {d.label}
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/register"
          className="inline-flex flex-shrink-0 items-center gap-2 self-start rounded-xl bg-[#14131A] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2A2823] sm:self-auto"
        >
          {planning.cta}
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Semaine : une colonne par jour sur grand écran, une ligne par jour sur mobile */}
      <div className="grid lg:grid-cols-6 lg:divide-x lg:divide-[#F0EEE7]">
        {planning.jours.map((jour) => (
          <div
            key={jour.day}
            className="flex gap-4 border-b border-[#F0EEE7] px-5 py-4 last:border-b-0 lg:flex-col lg:gap-3 lg:border-b-0 lg:px-3 lg:py-5"
          >
            <div className="w-12 flex-shrink-0 pt-1 lg:w-auto lg:pt-0 lg:text-center">
              <p className="text-sm font-bold text-[#14131A] lg:hidden">{jour.short}</p>
              <p className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8470] lg:block">
                {jour.day}
              </p>
            </div>

            <ul className="grid flex-1 content-start gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {jour.cours.map((cours) => {
                const style = KIND_STYLES[cours.kind as Kind];
                const detail = "detail" in cours ? cours.detail : undefined;
                return (
                  <li
                    key={`${jour.day}-${cours.time}`}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 transition-transform hover:-translate-y-0.5",
                      style.card
                    )}
                  >
                    <p className={cn("flex items-center gap-1 text-sm font-bold tabular-nums", style.time)}>
                      <Clock size={12} strokeWidth={2.5} />
                      {cours.time}
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-snug">{cours.name}</p>
                    {detail && <p className="mt-0.5 text-xs leading-snug opacity-70">{detail}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Photos d'un article : défilement au doigt sur mobile, flèches au survol sur
 * ordinateur, points pour savoir où l'on en est.
 */
export function ItemGallery({ images, alt, className }: { images: string[]; alt: string; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className={cn("relative flex items-center justify-center bg-[#13121e] text-[#D4AF37]/30", className)}>
        <Package size={44} strokeWidth={1.4} />
      </div>
    );
  }

  function goTo(target: number) {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const el = track.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div className={cn("group relative bg-[#13121e]", className)}>
      <div
        ref={track}
        onScroll={handleScroll}
        className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <div key={src} className="relative h-full w-full flex-shrink-0 snap-center">
            <Image
              src={src}
              alt={images.length > 1 ? `${alt} (photo ${i + 1} sur ${images.length})` : alt}
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Photo précédente"
            className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black group-hover:opacity-100 disabled:!opacity-0 sm:flex"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === images.length - 1}
            aria-label="Photo suivante"
            className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black group-hover:opacity-100 disabled:!opacity-0 sm:flex"
          >
            <ChevronRight size={16} />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {images.map((src, i) => (
              <span
                key={src}
                className={cn(
                  "h-1.5 rounded-full shadow transition-all",
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/55"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

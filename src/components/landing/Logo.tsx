import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo MK Studio. Le fichier source est le logo doré sur fond noir
 * (public/android-chrome-512x512.png), affiché ici en pastille arrondie.
 */
export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/android-chrome-512x512.png"
      alt="MK Studio"
      width={size}
      height={size}
      priority
      className={cn("rounded-xl object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}

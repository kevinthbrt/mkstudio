import Image from "next/image";
import { findPhoto } from "@/lib/photos";
import { Placeholder } from "@/components/landing/Placeholder";
import { cn } from "@/lib/utils";

interface IllustrationProps {
  /** Nom du fichier attendu dans public/photos/, sans extension. */
  name: string;
  /** Ce que la photo doit montrer. Sert de brief et de texte alternatif. */
  label: string;
  ratio?: string;
  className?: string;
  compact?: boolean;
  priority?: boolean;
  sizes?: string;
}

/**
 * Affiche la photo déposée dans public/photos/ si elle existe,
 * sinon un emplacement réservé indiquant le nom de fichier attendu.
 */
export function Illustration({
  name,
  label,
  ratio = "4/3",
  className,
  compact,
  priority,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: IllustrationProps) {
  const src = findPhoto(name);

  if (!src) {
    return (
      <Placeholder label={label} fileName={name} ratio={ratio} className={className} compact={compact} />
    );
  }

  return (
    <div
      style={{ aspectRatio: ratio }}
      className={cn("relative w-full overflow-hidden rounded-2xl bg-[#F7F5EF]", className)}
    >
      <Image src={src} alt={label} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}

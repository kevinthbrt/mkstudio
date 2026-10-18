import Image from "next/image";
import { findPhoto } from "@/lib/photos";
import { cn } from "@/lib/utils";

interface IllustrationProps {
  /** Nom du fichier attendu dans public/photos/, sans extension. */
  name: string;
  /** Ce que la photo montre. Sert de texte alternatif. */
  label: string;
  /** Visuel affiché tant que la photo n'a pas été déposée. */
  fallback: React.ReactNode;
  ratio?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** Point de cadrage de la photo (object-position), ex. "center 35%". */
  position?: string;
}

/**
 * Affiche la photo déposée dans public/photos/ si elle existe,
 * sinon le visuel de remplacement fourni.
 */
export function Illustration({
  name,
  label,
  fallback,
  ratio = "4/3",
  className,
  priority,
  sizes = "(max-width: 768px) 100vw, 50vw",
  position,
}: IllustrationProps) {
  const src = findPhoto(name);

  return (
    <div
      style={{ aspectRatio: ratio }}
      className={cn("relative w-full overflow-hidden rounded-2xl bg-[#F4EFE3]", className)}
    >
      {src ? (
        <Image
          src={src}
          alt={label}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          style={position ? { objectPosition: position } : undefined}
        />
      ) : (
        fallback
      )}
    </div>
  );
}

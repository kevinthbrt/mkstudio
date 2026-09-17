import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaceholderProps {
  /** Ce que la photo devra montrer : sert de brief au photographe. */
  label: string;
  /** Nom de fichier attendu dans public/photos/, affiché dans le cadre. */
  fileName?: string;
  /** Ratio CSS, ex. "4/3", "16/9", "1/1". */
  ratio?: string;
  className?: string;
  /** Format compact pour les petites vignettes. */
  compact?: boolean;
}

/**
 * Emplacement réservé pour une photo à venir.
 * Dès qu'un fichier du bon nom est déposé dans public/photos/,
 * <Illustration /> affiche la photo à la place de ce cadre.
 */
export function Placeholder({ label, fileName, ratio = "4/3", className, compact }: PlaceholderProps) {
  return (
    <div
      style={{ aspectRatio: ratio }}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-dashed border-[#D9D3C4] bg-[#F7F5EF]",
        "flex flex-col items-center justify-center gap-2 text-center",
        compact ? "p-3" : "p-6",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(201,162,39,0.07) 0px, rgba(201,162,39,0.07) 1px, transparent 1px, transparent 10px)",
        }}
      />
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#C9A227] shadow-sm">
        <ImageIcon size={16} />
      </div>
      {label && (
        <p
          className={cn(
            "relative max-w-[26ch] font-medium leading-snug text-[#8A8470]",
            compact ? "text-[11px]" : "text-xs"
          )}
        >
          {label}
        </p>
      )}
      {fileName && (
        <code
          className={cn(
            "relative rounded-md bg-white px-2 py-0.5 font-mono text-[#A39A7C] shadow-sm",
            compact ? "text-[9px]" : "text-[10px]"
          )}
        >
          {fileName}.jpg
        </code>
      )}
    </div>
  );
}

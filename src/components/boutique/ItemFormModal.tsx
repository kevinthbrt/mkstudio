"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImagePlus, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { MERCH_MAX_IMAGES, merchItemImages } from "@/lib/merch";
import type { MerchItem } from "@/types/database";

export interface ItemFormValues {
  name: string;
  description: string | null;
  price: number;
  variants: string[];
  image_url: string | null;
  images: string[];
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** "XS, S , M,,L" → ["XS", "S", "M", "L"], sans doublon, dans l'ordre saisi. */
function parseVariants(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .split(/[,;\n]/)
    .map((v) => v.trim())
    .filter((v) => v && !seen.has(v) && seen.add(v));
}

export function ItemFormModal({
  open,
  saleId,
  item,
  onClose,
  onSubmit,
}: {
  open: boolean;
  saleId: string;
  item: MerchItem | null;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => Promise<string | null>;
}) {
  // Le parent ne monte la modale que lorsqu'elle est ouverte : l'état part
  // donc toujours des valeurs de l'article édité.
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [variants, setVariants] = useState(item?.variants.join(", ") ?? "");
  const [images, setImages] = useState<string[]>(item ? merchItemImages(item) : []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);


  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = MERCH_MAX_IMAGES - images.length;
    if (files.length > room) {
      setError(`${MERCH_MAX_IMAGES} photos maximum par article.`);
      return;
    }
    if (files.some((f) => !f.type.startsWith("image/"))) {
      setError("Choisissez des fichiers image (JPG, PNG, WebP).");
      return;
    }
    if (files.some((f) => f.size > MAX_IMAGE_BYTES)) {
      setError("Image trop lourde : 4 Mo maximum par photo.");
      return;
    }

    setUploading(true);
    setError("");
    // Une requête par photo : chaque envoi reste sous la limite de taille de Vercel.
    for (const file of files) {
      const body = new FormData();
      body.append("file", file);
      body.append("saleId", saleId);
      const res = await fetch("/api/admin/boutique/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error || "Une photo n'a pas pu être envoyée.");
        break;
      }
      setImages((prev) => [...prev, data.url]);
    }
    setUploading(false);
  }

  function moveImage(index: number, delta: number) {
    setImages((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedPrice = parseFloat(price.replace(",", "."));
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Prix invalide.");
      return;
    }
    setSaving(true);
    const message = await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      price: Math.round(parsedPrice * 100) / 100,
      variants: parseVariants(variants),
      image_url: images[0] ?? null,
      images,
    });
    setSaving(false);
    if (message) setError(message);
  }

  const parsed = parseVariants(variants);

  return (
    <Modal open={open} onClose={onClose} title={item ? "Modifier l'article" : "Nouvel article"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photos */}
        <div>
          <p className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Photos (facultatif, {MERCH_MAX_IMAGES} maximum)
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((url, index) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-[#2d2b40] bg-[#13121e]">
                <Image src={url} alt="" fill sizes="140px" className="object-cover" />
                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-[#D4AF37] px-1.5 py-0.5 text-[10px] font-bold text-black">
                    Principale
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                  aria-label="Retirer la photo"
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/70 text-white hover:bg-black"
                >
                  <X size={12} />
                </button>
                {images.length > 1 && (
                  <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                    <button
                      type="button"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0}
                      aria-label="Déplacer vers la gauche"
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-black/70 text-white hover:bg-black disabled:invisible"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === images.length - 1}
                      aria-label="Déplacer vers la droite"
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-black/70 text-white hover:bg-black disabled:invisible"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {images.length < MERCH_MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#2d2b40] bg-[#13121e] text-gray-500 transition-colors hover:border-[#D4AF37]/50 hover:text-[#D4AF37] disabled:opacity-50"
              >
                <ImagePlus size={20} />
                <span className="text-[11px] font-medium">{uploading ? "Envoi…" : "Ajouter"}</span>
              </button>
            )}
          </div>
          {images.length > 1 && (
            <p className="mt-1.5 text-xs text-gray-500">
              La première photo est celle affichée en premier et dans l&apos;email d&apos;annonce. Utilisez les flèches pour changer l&apos;ordre.
            </p>
          )}
          <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        </div>

        <Input label="Nom" placeholder="Sweat brodé MK Studio" value={name} onChange={(e) => setName(e.target.value)} required />
        <Textarea
          label="Description (facultatif)"
          placeholder="Coton bio 350 g, broderie dorée sur le cœur."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <Input
          label="Prix (€)"
          inputMode="decimal"
          placeholder="35"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <div>
          <Input
            label="Tailles ou variantes (facultatif)"
            placeholder="XS, S, M, L, XL"
            value={variants}
            onChange={(e) => setVariants(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Séparées par des virgules, dans l&apos;ordre d&apos;affichage. Laissez vide pour un article sans taille (gourde, sac…).
          </p>
          {parsed.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {parsed.map((v) => (
                <span key={v} className="rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-2 py-0.5 text-xs font-semibold text-[#D4AF37]">
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>

        {item && (
          <p className="text-xs text-gray-500">
            Modifier le prix n&apos;affecte pas les commandes déjà passées : elles gardent le prix au moment de la commande.
          </p>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={saving} className="flex-1" disabled={!name.trim() || uploading}>
            {item ? "Enregistrer" : "Ajouter l'article"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

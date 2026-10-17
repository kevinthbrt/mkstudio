"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import type { MerchItem } from "@/types/database";

export interface ItemFormValues {
  name: string;
  description: string | null;
  price: number;
  variants: string[];
  image_url: string | null;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
  const [imageUrl, setImageUrl] = useState<string | null>(item?.image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);


  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choisissez un fichier image (JPG, PNG, WebP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image trop lourde : 5 Mo maximum.");
      return;
    }

    setUploading(true);
    setError("");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${saleId}/${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage.from("merch").upload(path, file, {
      contentType: file.type,
    });
    setUploading(false);

    if (uploadError) {
      setError("L'image n'a pas pu être envoyée.");
      return;
    }
    const { data } = supabase.storage.from("merch").getPublicUrl(path);
    setImageUrl(data.publicUrl);
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
      image_url: imageUrl,
    });
    setSaving(false);
    if (message) setError(message);
  }

  const parsed = parseVariants(variants);

  return (
    <Modal open={open} onClose={onClose} title={item ? "Modifier l'article" : "Nouvel article"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image */}
        <div>
          <p className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Photo (facultatif)</p>
          {imageUrl ? (
            <div className="relative h-44 w-44 overflow-hidden rounded-xl border border-[#2d2b40] bg-[#13121e]">
              <Image src={imageUrl} alt="" fill sizes="176px" className="object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                aria-label="Retirer la photo"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white hover:bg-black"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#2d2b40] bg-[#13121e] text-gray-500 transition-colors hover:border-[#D4AF37]/50 hover:text-[#D4AF37] disabled:opacity-50"
            >
              <ImagePlus size={22} />
              <span className="text-xs font-medium">{uploading ? "Envoi…" : "Ajouter une photo"}</span>
            </button>
          )}
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleFile} />
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

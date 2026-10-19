"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { MERCH_SALE_STATUS_LABELS } from "@/lib/merch";
import type { MerchSale } from "@/types/database";

/** Convertit une date ISO en valeur pour <input type="datetime-local"> (heure locale). */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  d.setHours(20, 0, 0, 0);
  return d.toISOString();
}

export interface SaleFormValues {
  title: string;
  description: string | null;
  closes_at: string;
  payment_instructions: string | null;
  status: MerchSale["status"];
}

export function SaleFormModal({
  open,
  sale,
  onClose,
  onSubmit,
}: {
  open: boolean;
  sale: MerchSale | null;
  onClose: () => void;
  onSubmit: (values: SaleFormValues) => Promise<string | null>;
}) {
  // Le parent ne monte la modale que lorsqu'elle est ouverte : l'état part
  // donc toujours des valeurs de la vente éditée.
  const [title, setTitle] = useState(sale?.title ?? "");
  const [description, setDescription] = useState(sale?.description ?? "");
  const [closesAt, setClosesAt] = useState(() => toLocalInputValue(sale?.closes_at ?? defaultDeadline()));
  const [instructions, setInstructions] = useState(sale?.payment_instructions ?? "");
  const [status, setStatus] = useState<MerchSale["status"]>(sale?.status ?? "draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!closesAt) {
      setError("Indiquez une date butoir.");
      return;
    }
    setSaving(true);
    const message = await onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      closes_at: new Date(closesAt).toISOString(),
      payment_instructions: instructions.trim() || null,
      status,
    });
    setSaving(false);
    if (message) setError(message);
  }

  return (
    <Modal open={open} onClose={onClose} title={sale ? "Modifier la vente" : "Nouvelle vente"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titre"
          placeholder="Collection hiver 2026"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          label="Présentation (facultatif)"
          placeholder="Sweats et t-shirts brodés MK Studio, livrés mi-décembre."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Input
          label="Date butoir des commandes"
          type="datetime-local"
          value={closesAt}
          onChange={(e) => setClosesAt(e.target.value)}
          required
        />
        <Textarea
          label="Instructions de paiement (facultatif)"
          placeholder={"Chèque à l'ordre de MK Studio.\nVirement : IBAN FR76 ...\nEspèces à la salle."}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
        />
        <Select
          label="Statut"
          value={status}
          onChange={(e) => setStatus(e.target.value as MerchSale["status"])}
          options={Object.entries(MERCH_SALE_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <p className="text-xs text-gray-500">
          Les adhérents ne voient la vente qu&apos;à partir du statut « Commandes ouvertes ». Les commandes se ferment
          automatiquement à la date butoir.
        </p>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={saving} className="flex-1" disabled={!title.trim()}>
            {sale ? "Enregistrer" : "Créer la vente"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

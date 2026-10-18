"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { MERCH_PAYMENT_METHODS, type MerchPaymentMethod } from "@/lib/merch";
import { cn, formatPriceFromEuros } from "@/lib/utils";
import type { MerchItem, MerchOrder, MerchOrderLine } from "@/types/database";

type MemberOption = { id: string; first_name: string; last_name: string; email: string; is_test_account: boolean };
type EditableOrder = MerchOrder & { lines: MerchOrderLine[]; memberName: string };

interface Row {
  key: number;
  itemId: string;
  variant: string;
  quantity: number;
}

let nextKey = 1;
const newRow = (itemId = "", variant = "", quantity = 1): Row => ({ key: nextKey++, itemId, variant, quantity });

/**
 * Création d'une commande pour un adhérent, ou modification d'une commande
 * existante, par l'admin. Le serveur recalcule les prix au tarif actuel.
 */
export function AdminOrderModal({
  saleId,
  items,
  order,
  onClose,
  onSaved,
}: {
  saleId: string;
  items: MerchItem[];
  order: EditableOrder | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = order !== null;
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [search, setSearch] = useState("");
  const [memberId, setMemberId] = useState(order?.member_id ?? "");
  const [rows, setRows] = useState<Row[]>(() =>
    order
      ? order.lines.filter((l) => l.item_id).map((l) => newRow(l.item_id ?? "", l.variant ?? "", l.quantity))
      : [newRow()]
  );
  const droppedLines = order ? order.lines.filter((l) => !l.item_id) : [];
  const [paymentMethod, setPaymentMethod] = useState<MerchPaymentMethod | null>(order?.payment_method ?? null);
  const [note, setNote] = useState(order?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) return;
    let active = true;
    createClient()
      .from("profiles")
      .select("id, first_name, last_name, email, is_test_account")
      .eq("role", "member")
      .order("last_name")
      .then(({ data }) => {
        if (active) setMembers(data ?? []);
      });
    return () => {
      active = false;
    };
  }, [editing]);

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(q));
  }, [members, search]);

  const total = rows.reduce((sum, r) => {
    const item = itemById.get(r.itemId);
    return item ? sum + Number(item.price) * r.quantity : sum;
  }, 0);

  const paidAmount = order?.paid_at && order.paid_amount !== null ? Number(order.paid_amount) : null;
  const gap = paidAmount === null ? 0 : Math.round((total - paidAmount) * 100) / 100;

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  const rowsValid =
    rows.length > 0 &&
    rows.every((r) => {
      const item = itemById.get(r.itemId);
      return item && (item.variants.length === 0 || item.variants.includes(r.variant));
    });

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/boutique/${saleId}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order?.id ?? null,
        memberId,
        paymentMethod,
        note,
        lines: rows.map((r) => ({ item_id: r.itemId, variant: r.variant || null, quantity: r.quantity })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "La commande n'a pas pu être enregistrée.");
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? `Modifier la commande de ${order.memberName}` : "Commander pour un adhérent"}
      size="lg"
    >
      <div className="space-y-5">
        {/* Adhérent */}
        {!editing && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Adhérent</p>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un nom ou un email"
                className="w-full rounded-xl border border-[#2d2b40] bg-[#13121e] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-[#D4AF37]/60"
              />
            </div>
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-[#2d2b40] bg-[#13121e]">
              {filteredMembers.length === 0 ? (
                <p className="px-3 py-3 text-sm text-gray-600">Aucun adhérent trouvé.</p>
              ) : (
                filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMemberId(m.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                      memberId === m.id ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "text-gray-300 hover:bg-white/5"
                    )}
                  >
                    <span className="truncate">
                      {m.first_name} {m.last_name}
                      {m.is_test_account && <span className="ml-1.5 text-xs text-gray-600">(test)</span>}
                    </span>
                    <span className="truncate text-xs text-gray-600">{m.email}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Articles */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Articles</p>
          <div className="space-y-2">
            {rows.map((row) => {
              const item = itemById.get(row.itemId);
              return (
                <div key={row.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2">
                  <select
                    value={row.itemId}
                    onChange={(e) => updateRow(row.key, { itemId: e.target.value, variant: "" })}
                    className="min-w-0 flex-1 rounded-lg border border-[#2d2b40] bg-[#13121e] px-2.5 py-2 text-sm text-white outline-none"
                  >
                    <option value="">Choisir un article</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} · {formatPriceFromEuros(Number(i.price))}
                        {i.active ? "" : " (masqué)"}
                      </option>
                    ))}
                  </select>
                  {item && item.variants.length > 0 && (
                    <select
                      value={row.variant}
                      onChange={(e) => updateRow(row.key, { variant: e.target.value })}
                      className="w-24 rounded-lg border border-[#2d2b40] bg-[#13121e] px-2.5 py-2 text-sm text-white outline-none"
                    >
                      <option value="">Taille</option>
                      {item.variants.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex items-center rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => updateRow(row.key, { quantity: Math.max(1, row.quantity - 1) })}
                      aria-label="Diminuer la quantité"
                      className="flex h-8 w-8 items-center justify-center text-gray-400 hover:text-white"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-white">{row.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateRow(row.key, { quantity: Math.min(50, row.quantity + 1) })}
                      aria-label="Augmenter la quantité"
                      className="flex h-8 w-8 items-center justify-center text-gray-400 hover:text-white"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                    aria-label="Retirer cet article"
                    className="flex h-8 w-8 items-center justify-center text-gray-600 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setRows((current) => [...current, newRow()])}
            className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#D4AF37] hover:text-[#E8C84A]"
          >
            <Plus size={14} />
            Ajouter un article
          </button>
          {droppedLines.length > 0 && (
            <p className="mt-2 text-xs text-orange-300">
              {droppedLines.map((l) => l.item_name).join(", ")} : article supprimé de la vente, il sera retiré de la commande.
            </p>
          )}
        </div>

        {/* Règlement */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Règlement</p>
          <div className="grid grid-cols-3 gap-2">
            {MERCH_PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setPaymentMethod(m.value)}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors",
                  paymentMethod === m.value
                    ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]"
                    : "border-white/10 text-gray-400 hover:text-white"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <Textarea label="Remarque (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} />

        {/* Total */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Nouveau total</span>
            <span className="text-lg font-bold text-[#D4AF37]">{formatPriceFromEuros(total)}</span>
          </div>
          {editing && (
            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <span>Total actuel</span>
              <span>{formatPriceFromEuros(Number(order.total))}</span>
            </div>
          )}
          {paidAmount !== null && gap !== 0 && (
            <p className={cn("mt-2 text-xs", gap > 0 ? "text-orange-300" : "text-blue-300")}>
              Déjà réglé : {formatPriceFromEuros(paidAmount)}.{" "}
              {gap > 0
                ? `Il restera ${formatPriceFromEuros(gap)} à encaisser.`
                : `Il faudra rembourser ${formatPriceFromEuros(-gap)}.`}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-600">
            {editing
              ? "L'adhérent recevra un email avec sa commande modifiée. Les prix appliqués sont les prix actuels."
              : "L'adhérent recevra l'email de confirmation de commande."}
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button
            className="flex-1"
            loading={saving}
            disabled={!memberId || !paymentMethod || !rowsValid}
            onClick={save}
          >
            {editing ? "Enregistrer la modification" : "Enregistrer la commande"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

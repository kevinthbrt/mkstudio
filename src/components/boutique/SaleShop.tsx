"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CalendarClock, ChevronDown, Minus, Package, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { MERCH_PAYMENT_METHODS, timeLeftLabel, type MerchPaymentMethod } from "@/lib/merch";
import { cn, formatDateTime, formatPriceFromEuros } from "@/lib/utils";
import type { MerchItem, MerchSale } from "@/types/database";

interface CartLine {
  item: MerchItem;
  variant: string | null;
  quantity: number;
}

function cartKey(itemId: string, variant: string | null) {
  return `${itemId}::${variant ?? ""}`;
}

function ItemCard({ item, onAdd }: { item: MerchItem; onAdd: (variant: string | null, quantity: number) => void }) {
  const [variant, setVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const needsVariant = item.variants.length > 0;

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] bg-[#13121e] sm:aspect-square">
        {item.image_url ? (
          <Image src={item.image_url} alt={item.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[#D4AF37]/30">
            <Package size={44} strokeWidth={1.4} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold text-white">{item.name}</p>
          <p className="font-bold text-[#D4AF37]">{formatPriceFromEuros(Number(item.price))}</p>
        </div>
        {item.description && <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.description}</p>}

        {needsVariant && (
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Taille</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.variants.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  aria-pressed={variant === v}
                  className={cn(
                    "min-w-9 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    variant === v
                      ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]"
                      : "border-white/10 text-gray-400 hover:border-white/25 hover:text-white"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-4">
          <div className="flex items-center rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Diminuer la quantité"
              className="flex h-9 w-9 items-center justify-center text-gray-400 hover:text-white"
            >
              <Minus size={14} />
            </button>
            <span className="w-6 text-center text-sm font-semibold text-white">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              aria-label="Augmenter la quantité"
              className="flex h-9 w-9 items-center justify-center text-gray-400 hover:text-white"
            >
              <Plus size={14} />
            </button>
          </div>
          <Button
            size="sm"
            className="flex-1"
            disabled={needsVariant && !variant}
            onClick={() => {
              onAdd(needsVariant ? variant : null, quantity);
              setQuantity(1);
            }}
          >
            {needsVariant && !variant ? "Choisir une taille" : "Ajouter"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function SaleShop({
  sale,
  items,
  onOrdered,
}: {
  sale: MerchSale;
  items: MerchItem[];
  onOrdered: () => void;
}) {
  const [cart, setCart] = useState<Map<string, CartLine>>(new Map());
  const [paymentMethod, setPaymentMethod] = useState<MerchPaymentMethod | null>(null);
  const [note, setNote] = useState("");
  const [committed, setCommitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const cartRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => [...cart.values()], [cart]);
  const total = lines.reduce((sum, l) => sum + Number(l.item.price) * l.quantity, 0);
  const articleCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const paymentLabel = MERCH_PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label.toLowerCase();

  function addToCart(item: MerchItem, variant: string | null, quantity: number) {
    setSuccess("");
    setCart((current) => {
      const next = new Map(current);
      const key = cartKey(item.id, variant);
      const existing = next.get(key);
      next.set(key, { item, variant, quantity: Math.min(50, (existing?.quantity ?? 0) + quantity) });
      return next;
    });
  }

  function removeFromCart(key: string) {
    setCart((current) => {
      const next = new Map(current);
      next.delete(key);
      return next;
    });
  }

  async function submit() {
    if (!paymentMethod || !committed || lines.length === 0) return;
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/boutique/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        saleId: sale.id,
        paymentMethod,
        note,
        lines: lines.map((l) => ({ item_id: l.item.id, variant: l.variant, quantity: l.quantity })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "La commande n'a pas pu être enregistrée.");
      return;
    }

    setCart(new Map());
    setPaymentMethod(null);
    setNote("");
    setCommitted(false);
    setSuccess("Commande enregistrée. Un récapitulatif vous a été envoyé par email.");
    onOrdered();
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 to-transparent p-5">
        <h2 className="text-xl font-bold text-white">{sale.title}</h2>
        {sale.description && <p className="mt-1.5 max-w-2xl text-sm text-gray-400">{sale.description}</p>}
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-black/30 px-2.5 py-1.5 text-xs font-medium text-[#D4AF37]">
          <CalendarClock size={13} />
          Commandes jusqu&apos;au {formatDateTime(sale.closes_at)} · {timeLeftLabel(sale.closes_at)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onAdd={(variant, quantity) => addToCart(item, variant, quantity)} />
          ))}
        </div>

        {/* Panier */}
        <div ref={cartRef} className="h-fit scroll-mt-4 lg:sticky lg:top-6">
        <Card className="p-5">
          <p className="flex items-center gap-2 font-semibold text-white">
            <ShoppingBag size={17} className="text-[#D4AF37]" />
            Ma commande
          </p>

          {success && (
            <p className="mt-3 rounded-xl border border-green-500/25 bg-green-500/10 px-3 py-2.5 text-sm text-green-300">{success}</p>
          )}

          {lines.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Votre panier est vide.</p>
          ) : (
            <>
              <ul className="mt-3 divide-y divide-white/5">
                {[...cart.entries()].map(([key, line]) => (
                  <li key={key} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">
                        {line.quantity} × {line.item.name}
                      </p>
                      {line.variant && <p className="text-xs text-gray-500">Taille {line.variant}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-300">
                        {formatPriceFromEuros(Number(line.item.price) * line.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(key)}
                        aria-label={`Retirer ${line.item.name}`}
                        className="text-gray-600 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-lg font-bold text-[#D4AF37]">{formatPriceFromEuros(total)}</span>
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Je règle par</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {MERCH_PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      aria-pressed={paymentMethod === m.value}
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
                {sale.payment_instructions && (
                  <p className="mt-3 whitespace-pre-line rounded-xl bg-white/[0.03] px-3 py-2.5 text-xs leading-relaxed text-gray-400">
                    {sale.payment_instructions}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <Textarea
                  label="Remarque (facultatif)"
                  placeholder="Ex. je passe récupérer jeudi soir"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  maxLength={500}
                />
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-gray-400">
                <input
                  type="checkbox"
                  checked={committed}
                  onChange={(e) => setCommitted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#D4AF37]"
                />
                <span>
                  Je m&apos;engage à régler {formatPriceFromEuros(total)}
                  {paymentLabel ? ` par ${paymentLabel}` : ""}. Les articles sont commandés auprès du fournisseur après la
                  date butoir, puis remis à la salle.
                </span>
              </label>

              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

              <Button
                className="mt-4 w-full"
                size="lg"
                loading={submitting}
                disabled={!paymentMethod || !committed}
                onClick={submit}
              >
                Valider ma commande
              </Button>
              {!paymentMethod && <p className="mt-2 text-center text-xs text-gray-600">Choisissez un moyen de paiement.</p>}
            </>
          )}
        </Card>
        </div>
      </div>

      {/* Mobile : le panier est en bas de page, cette barre rappelle son contenu. */}
      {lines.length > 0 && (
        <button
          type="button"
          onClick={() => cartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="fixed inset-x-3 z-40 flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#C9A227] via-[#E8C84A] to-[#C9A227] px-4 py-3 text-[#0a0a0a] shadow-[0_8px_30px_rgba(212,175,55,0.35)] lg:hidden"
          style={{ bottom: "calc(5.75rem + env(safe-area-inset-bottom))" }}
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <ShoppingBag size={16} />
            Ma commande · {articleCount} article{articleCount > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1 text-sm font-bold">
            {formatPriceFromEuros(total)}
            <ChevronDown size={16} />
          </span>
        </button>
      )}
    </section>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Download,
  Edit,
  PencilLine,
  EyeOff,
  Eye,
  Megaphone,
  Package,
  PackageCheck,
  Plus,
  UserPlus,
  ShoppingBag,
  Trash2,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SaleFormModal, type SaleFormValues } from "@/components/boutique/SaleFormModal";
import { ItemFormModal, type ItemFormValues } from "@/components/boutique/ItemFormModal";
import { AnnounceModal } from "@/components/boutique/AnnounceModal";
import { AdminOrderModal } from "@/components/boutique/AdminOrderModal";
import {
  buildMerchRecap,
  isMerchSaleOpen,
  merchPaymentGap,
  merchPaymentLabel,
  merchSaleStatusLabel,
} from "@/lib/merch";
import { cn, formatDateTime, formatPriceFromEuros } from "@/lib/utils";
import type { Database, MerchItem, MerchOrder, MerchOrderLine, MerchSale, Profile } from "@/types/database";

type Member = Pick<Profile, "id" | "first_name" | "last_name" | "email" | "phone">;
type OrderWithDetails = MerchOrder & { lines: MerchOrderLine[]; member: Member | null };
type Tab = "articles" | "recap" | "commandes";
type OrderFilter = "all" | "to_pay" | "to_deliver" | "cancelled";

function memberName(member: Member | null): string {
  if (!member) return "Adhérent supprimé";
  return `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() || member.email;
}

function describeLines(lines: MerchOrderLine[]): string {
  return lines
    .map((l) => `${l.quantity} × ${l.item_name}${l.variant ? ` (${l.variant})` : ""}`)
    .join(", ");
}

/** Télécharge un CSV lisible par Excel en français (séparateur « ; », BOM UTF-8). */
function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const text = String(value);
    return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = "﻿" + rows.map((row) => row.map(escape).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const amount = (value: number) => formatPriceFromEuros(value).replace(/ | /g, " ");

interface SaleData {
  sale: MerchSale | null;
  items: MerchItem[];
  orders: OrderWithDetails[];
}

async function fetchSaleData(saleId: string): Promise<SaleData> {
  const supabase = createClient();
  const [saleRes, itemsRes, ordersRes] = await Promise.all([
    supabase.from("merch_sales").select("*").eq("id", saleId).single(),
    supabase.from("merch_items").select("*").eq("sale_id", saleId).order("position").order("created_at"),
    supabase.from("merch_orders").select("*").eq("sale_id", saleId).order("created_at", { ascending: false }),
  ]);

  const rawOrders = ordersRes.data ?? [];
  const orderIds = rawOrders.map((o) => o.id);
  const memberIds = [...new Set(rawOrders.map((o) => o.member_id))];

  const [linesRes, membersRes] = await Promise.all([
    orderIds.length
      ? supabase.from("merch_order_lines").select("*").in("order_id", orderIds)
      : Promise.resolve({ data: [] as MerchOrderLine[] }),
    memberIds.length
      ? supabase.from("profiles").select("id, first_name, last_name, email, phone").in("id", memberIds)
      : Promise.resolve({ data: [] as Member[] }),
  ]);

  const lines = linesRes.data ?? [];
  const members = new Map((membersRes.data ?? []).map((m) => [m.id, m]));

  return {
    sale: saleRes.data ?? null,
    items: itemsRes.data ?? [],
    orders: rawOrders.map((order) => ({
      ...order,
      lines: lines.filter((l) => l.order_id === order.id),
      member: members.get(order.member_id) ?? null,
    })),
  };
}

export default function AdminSalePage() {
  const { saleId } = useParams<{ saleId: string }>();
  const [sale, setSale] = useState<MerchSale | null>(null);
  const [items, setItems] = useState<MerchItem[]>([]);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("articles");
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [itemForm, setItemForm] = useState<{ open: boolean; item: MerchItem | null }>({ open: false, item: null });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [orderForm, setOrderForm] = useState<{ open: boolean; order: OrderWithDetails | null }>({
    open: false,
    order: null,
  });
  const [notice, setNotice] = useState("");

  const applyData = useCallback((data: SaleData) => {
    setSale(data.sale);
    setItems(data.items);
    setOrders(data.orders);
    setLoading(false);
  }, []);

  // Rechargement après une modification.
  const load = useCallback(() => fetchSaleData(saleId).then(applyData), [saleId, applyData]);

  useEffect(() => {
    let active = true;
    fetchSaleData(saleId).then((data) => {
      if (active) applyData(data);
    });
    return () => {
      active = false;
    };
  }, [saleId, applyData]);

  const confirmed = useMemo(() => orders.filter((o) => o.status === "confirmed"), [orders]);
  const recap = useMemo(() => buildMerchRecap(orders, items), [orders, items]);
  const stats = useMemo(() => {
    const total = confirmed.reduce((sum, o) => sum + Number(o.total), 0);
    const paid = confirmed
      .filter((o) => o.paid_at)
      .reduce((sum, o) => sum + Number(o.paid_amount ?? o.total), 0);
    const articles = recap.reduce((sum, r) => sum + r.quantity, 0);
    const delivered = confirmed.filter((o) => o.delivered_at).length;
    return { total, paid, articles, delivered };
  }, [confirmed, recap]);

  const filteredOrders = useMemo(() => {
    switch (filter) {
      case "to_pay":
        return confirmed.filter((o) => !o.paid_at);
      case "to_deliver":
        return confirmed.filter((o) => !o.delivered_at);
      case "cancelled":
        return orders.filter((o) => o.status === "cancelled");
      default:
        return orders;
    }
  }, [filter, orders, confirmed]);

  // ─── Vente ────────────────────────────────────────────────────────────────
  async function handleSaleSubmit(values: SaleFormValues): Promise<string | null> {
    const supabase = createClient();
    const { error } = await supabase.from("merch_sales").update(values).eq("id", saleId);
    if (error) return "La vente n'a pas pu être enregistrée.";
    setShowSaleForm(false);
    await load();
    return null;
  }

  async function changeStatus(status: MerchSale["status"], confirmation?: string) {
    if (confirmation && !window.confirm(confirmation)) return;
    const supabase = createClient();
    await supabase.from("merch_sales").update({ status }).eq("id", saleId);
    await load();
  }

  function openSale() {
    if (!sale) return;
    if (!items.some((i) => i.active)) {
      setNotice("Ajoutez au moins un article avant d'ouvrir les commandes.");
      return;
    }
    if (new Date(sale.closes_at) <= new Date()) {
      setNotice("La date butoir est déjà passée : modifiez-la avant d'ouvrir les commandes.");
      return;
    }
    setNotice("");
    // À l'ouverture, on propose tout de suite de prévenir les adhérents.
    changeStatus("open").then(() => setShowAnnounce(true));
  }

  // ─── Articles ─────────────────────────────────────────────────────────────
  async function handleItemSubmit(values: ItemFormValues): Promise<string | null> {
    const supabase = createClient();
    const current = itemForm.item;
    const { error } = current
      ? await supabase.from("merch_items").update(values).eq("id", current.id)
      : await supabase.from("merch_items").insert({
          ...values,
          sale_id: saleId,
          position: items.reduce((max, i) => Math.max(max, i.position), -1) + 1,
        });
    if (error) return "L'article n'a pas pu être enregistré.";
    setItemForm({ open: false, item: null });
    await load();
    return null;
  }

  async function toggleItemActive(item: MerchItem) {
    setBusyId(item.id);
    const supabase = createClient();
    await supabase.from("merch_items").update({ active: !item.active }).eq("id", item.id);
    await load();
    setBusyId(null);
  }

  async function deleteItem(item: MerchItem) {
    const ordered = orders.some((o) => o.lines.some((l) => l.item_id === item.id));
    if (ordered) {
      setNotice(`« ${item.name} » a déjà été commandé : masquez-le plutôt que de le supprimer.`);
      return;
    }
    if (!window.confirm(`Supprimer « ${item.name} » ?`)) return;
    setBusyId(item.id);
    const supabase = createClient();
    await supabase.from("merch_items").delete().eq("id", item.id);
    await load();
    setBusyId(null);
  }

  // ─── Commandes ────────────────────────────────────────────────────────────
  async function updateOrder(
    order: OrderWithDetails,
    values: Database["public"]["Tables"]["merch_orders"]["Update"]
  ) {
    setBusyId(order.id);
    const supabase = createClient();
    await supabase.from("merch_orders").update(values).eq("id", order.id);
    await load();
    setBusyId(null);
  }

  function cancelOrder(order: OrderWithDetails) {
    if (!window.confirm(`Annuler la commande de ${memberName(order.member)} ?`)) return;
    updateOrder(order, { status: "cancelled", cancelled_at: new Date().toISOString() });
  }

  // ─── Exports ──────────────────────────────────────────────────────────────
  function exportRecap() {
    if (!sale) return;
    downloadCsv(`recap-fournisseur-${slug(sale.title)}.csv`, [
      ["Article", "Taille", "Quantité", "Montant"],
      ...recap.map((r) => [r.itemName, r.variant ?? "", r.quantity, amount(r.amount)]),
      ["Total", "", stats.articles, amount(stats.total)],
    ]);
  }

  function exportOrders() {
    if (!sale) return;
    downloadCsv(`commandes-${slug(sale.title)}.csv`, [
      ["Adhérent", "Email", "Téléphone", "Articles", "Total", "Règlement", "Réglée", "Remise", "Date"],
      ...confirmed.map((o) => [
        memberName(o.member),
        o.member?.email ?? "",
        o.member?.phone ?? "",
        describeLines(o.lines),
        amount(Number(o.total)),
        merchPaymentLabel(o.payment_method),
        o.paid_at ? "oui" : "non",
        o.delivered_at ? "oui" : "non",
        formatDateTime(o.created_at),
      ]),
    ]);
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="p-4 lg:p-8">
        <Link href="/admin/boutique" className="text-sm text-gray-500 hover:text-white">
          ← Retour à la boutique
        </Link>
        <p className="mt-6 text-gray-400">Vente introuvable.</p>
      </div>
    );
  }

  const ordersOpen = isMerchSaleOpen(sale);
  // Après la commande fournisseur, le récap est parti : plus de création ni de modification.
  const ordersLocked = sale.status === "supplier_ordered" || sale.status === "completed";

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* En-tête */}
      <div>
        <Link href="/admin/boutique" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white">
          <ArrowLeft size={14} />
          Boutique
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{sale.title}</h1>
              <Badge variant={ordersOpen ? "green" : sale.status === "draft" ? "gray" : "gold"}>
                {merchSaleStatusLabel(sale)}
              </Badge>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
              <CalendarClock size={14} />
              Date butoir : {formatDateTime(sale.closes_at)}
            </p>
            {sale.announced_at && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-green-400/80">
                <Megaphone size={14} />
                Annonce envoyée aux adhérents le {formatDateTime(sale.announced_at)}
              </p>
            )}
            {sale.description && <p className="mt-2 max-w-2xl text-sm text-gray-400">{sale.description}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowSaleForm(true)}>
              <Edit size={15} />
              Modifier
            </Button>
            {sale.status === "draft" && (
              <Button onClick={openSale}>
                <ShoppingBag size={15} />
                Ouvrir les commandes
              </Button>
            )}
            {sale.status === "open" && !sale.announced_at && (
              <Button variant="outline" onClick={() => setShowAnnounce(true)}>
                <Megaphone size={15} />
                Prévenir les adhérents
              </Button>
            )}
            {sale.status === "open" && (
              <Button
                onClick={() =>
                  changeStatus(
                    "supplier_ordered",
                    "Marquer la commande fournisseur comme passée ? Les adhérents ne pourront plus commander ni annuler."
                  )
                }
              >
                <Truck size={15} />
                Commande fournisseur passée
              </Button>
            )}
            {sale.status === "supplier_ordered" && (
              <Button
                onClick={() =>
                  changeStatus(
                    "completed",
                    stats.delivered < confirmed.length
                      ? `${confirmed.length - stats.delivered} commande(s) ne sont pas encore remises. Terminer quand même ?`
                      : "Terminer cette vente ?"
                  )
                }
              >
                <PackageCheck size={15} />
                Terminer la vente
              </Button>
            )}
          </div>
        </div>
      </div>

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-sm text-orange-300">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Fermer" className="text-orange-300/70 hover:text-orange-200">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Chiffres */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Commandes", value: String(confirmed.length) },
          { label: "Articles commandés", value: String(stats.articles) },
          { label: "Montant total", value: formatPriceFromEuros(stats.total) },
          { label: "Encaissé", value: formatPriceFromEuros(stats.paid), gold: true },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-600">{s.label}</p>
            <p className={cn("mt-1.5 text-xl font-bold", s.gold ? "text-[#D4AF37]" : "text-white")}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02] p-1">
        {(
          [
            ["articles", `Articles (${items.length})`],
            ["recap", "Récap fournisseur"],
            ["commandes", `Commandes (${confirmed.length})`],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              tab === value ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "text-gray-500 hover:text-gray-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── Articles ─── */}
      {tab === "articles" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setItemForm({ open: true, item: null })}>
              <Plus size={16} />
              Ajouter un article
            </Button>
          </div>

          {items.length === 0 ? (
            <Card className="p-10 text-center">
              <Package size={30} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Aucun article dans cette vente.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Card key={item.id} className={cn("overflow-hidden", !item.active && "opacity-50")}>
                  <div className="relative aspect-square bg-[#13121e]">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-700">
                        <Package size={36} />
                      </div>
                    )}
                    {!item.active && (
                      <span className="absolute left-3 top-3 rounded-lg bg-black/70 px-2 py-1 text-xs font-semibold text-gray-300">
                        Masqué
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="font-bold text-[#D4AF37]">{formatPriceFromEuros(Number(item.price))}</p>
                    </div>
                    {item.description && <p className="mt-1 text-xs text-gray-500">{item.description}</p>}
                    {item.variants.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.variants.map((v) => (
                          <span key={v} className="rounded-md border border-white/10 px-1.5 py-0.5 text-[11px] text-gray-400">
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
                      <Button size="sm" variant="ghost" onClick={() => setItemForm({ open: true, item })}>
                        <Edit size={13} />
                        Modifier
                      </Button>
                      <Button size="sm" variant="ghost" disabled={busyId === item.id} onClick={() => toggleItemActive(item)}>
                        {item.active ? <EyeOff size={13} /> : <Eye size={13} />}
                        {item.active ? "Masquer" : "Afficher"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto hover:text-red-400"
                        disabled={busyId === item.id}
                        onClick={() => deleteItem(item)}
                        aria-label={`Supprimer ${item.name}`}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Récap fournisseur ─── */}
      {tab === "recap" && (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-white">Quantités à commander</p>
              <p className="text-xs text-gray-500">Commandes confirmées uniquement, totalisées par article et par taille.</p>
            </div>
            <Button variant="outline" size="sm" onClick={exportRecap} disabled={recap.length === 0}>
              <Download size={14} />
              Exporter (Excel)
            </Button>
          </div>
          {recap.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">Aucune commande pour l&apos;instant.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-600">
                  <th className="px-5 py-3 font-semibold">Article</th>
                  <th className="px-5 py-3 font-semibold">Taille</th>
                  <th className="px-5 py-3 text-right font-semibold">Quantité</th>
                  <th className="hidden px-5 py-3 text-right font-semibold sm:table-cell">Montant</th>
                </tr>
              </thead>
              <tbody>
                {recap.map((row, i) => {
                  const sameItemAsPrevious = i > 0 && recap[i - 1].itemName === row.itemName;
                  return (
                    <tr key={row.key} className={cn("border-t border-white/5", !sameItemAsPrevious && i > 0 && "border-white/10")}>
                      <td className={cn("px-5 py-3", sameItemAsPrevious ? "text-gray-700" : "font-medium text-white")}>
                        {row.itemName}
                      </td>
                      <td className="px-5 py-3 text-gray-300">{row.variant ?? "Taille unique"}</td>
                      <td className="px-5 py-3 text-right text-lg font-bold text-[#D4AF37]">{row.quantity}</td>
                      <td className="hidden px-5 py-3 text-right text-gray-400 sm:table-cell">
                        {formatPriceFromEuros(row.amount)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-white/15 bg-white/[0.02]">
                  <td className="px-5 py-3 font-bold text-white" colSpan={2}>
                    Total
                  </td>
                  <td className="px-5 py-3 text-right text-lg font-bold text-white">{stats.articles}</td>
                  <td className="hidden px-5 py-3 text-right font-bold text-white sm:table-cell">
                    {formatPriceFromEuros(stats.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* ─── Commandes ─── */}
      {tab === "commandes" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["all", "Toutes"],
                  ["to_pay", `À régler (${confirmed.filter((o) => !o.paid_at).length})`],
                  ["to_deliver", `À remettre (${confirmed.length - stats.delivered})`],
                  ["cancelled", "Annulées"],
                ] as [OrderFilter, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                    filter === value
                      ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]"
                      : "border-white/10 text-gray-500 hover:text-gray-200"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {!ordersLocked && (
                <Button size="sm" onClick={() => setOrderForm({ open: true, order: null })} disabled={items.length === 0}>
                  <UserPlus size={14} />
                  Commander pour un adhérent
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={exportOrders} disabled={confirmed.length === 0}>
                <Download size={14} />
                Exporter (Excel)
              </Button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <Card className="p-8 text-center text-sm text-gray-500">Aucune commande dans cette catégorie.</Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const cancelled = order.status === "cancelled";
                const gap = merchPaymentGap(order);
                return (
                  <Card key={order.id} className={cn("p-4", cancelled && "opacity-50")}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{memberName(order.member)}</p>
                          {cancelled ? (
                            <Badge variant="red">Annulée</Badge>
                          ) : (
                            <>
                              <Badge variant={order.paid_at ? "green" : "orange"}>
                                {order.paid_at ? "Réglée" : "À régler"}
                              </Badge>
                              {gap > 0 && <Badge variant="orange">Reste {formatPriceFromEuros(gap)} à encaisser</Badge>}
                              {gap < 0 && <Badge variant="purple">{formatPriceFromEuros(-gap)} à rembourser</Badge>}
                              {order.delivered_at && <Badge variant="blue">Remise</Badge>}
                            </>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-300">{describeLines(order.lines)}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {merchPaymentLabel(order.payment_method)} · commandé le {formatDateTime(order.created_at)}
                          {order.member?.phone && ` · ${order.member.phone}`}
                        </p>
                        {order.note && <p className="mt-1.5 text-xs italic text-gray-400">« {order.note} »</p>}
                      </div>
                      <p className="text-lg font-bold text-white sm:text-right">{formatPriceFromEuros(Number(order.total))}</p>
                    </div>

                    {!cancelled && (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-white/5 pt-3">
                        <Button
                          size="sm"
                          variant={order.paid_at ? "outline" : "gold"}
                          disabled={busyId === order.id}
                          onClick={() =>
                            updateOrder(
                              order,
                              order.paid_at
                                ? { paid_at: null, paid_amount: null }
                                : { paid_at: new Date().toISOString(), paid_amount: Number(order.total) }
                            )
                          }
                        >
                          {order.paid_at ? <X size={13} /> : <Wallet size={13} />}
                          {order.paid_at ? "Annuler le règlement" : "Marquer réglée"}
                        </Button>
                        {gap !== 0 && (
                          <Button
                            size="sm"
                            variant="gold"
                            disabled={busyId === order.id}
                            onClick={() => updateOrder(order, { paid_amount: Number(order.total) })}
                          >
                            <Wallet size={13} />
                            {gap > 0 ? "Reste encaissé" : "Remboursement fait"}
                          </Button>
                        )}
                        {!ordersLocked && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === order.id}
                            onClick={() => setOrderForm({ open: true, order })}
                          >
                            <PencilLine size={13} />
                            Modifier
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === order.id}
                          onClick={() =>
                            updateOrder(order, { delivered_at: order.delivered_at ? null : new Date().toISOString() })
                          }
                        >
                          {order.delivered_at ? <X size={13} /> : <Check size={13} />}
                          {order.delivered_at ? "Annuler la remise" : "Marquer remise"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto hover:text-red-400"
                          disabled={busyId === order.id}
                          onClick={() => cancelOrder(order)}
                        >
                          Annuler la commande
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showSaleForm && (
        <SaleFormModal open sale={sale} onClose={() => setShowSaleForm(false)} onSubmit={handleSaleSubmit} />
      )}
      {orderForm.open && (
        <AdminOrderModal
          saleId={saleId}
          items={items}
          order={orderForm.order ? { ...orderForm.order, memberName: memberName(orderForm.order.member) } : null}
          onClose={() => setOrderForm({ open: false, order: null })}
          onSaved={load}
        />
      )}
      {showAnnounce && (
        <AnnounceModal saleId={saleId} onClose={() => setShowAnnounce(false)} onSent={load} />
      )}
      {itemForm.open && (
        <ItemFormModal
          open
          saleId={saleId}
          item={itemForm.item}
          onClose={() => setItemForm({ open: false, item: null })}
          onSubmit={handleItemSubmit}
        />
      )}
    </div>
  );
}

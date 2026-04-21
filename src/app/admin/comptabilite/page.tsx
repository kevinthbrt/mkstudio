"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  BookOpen,
  Receipt,
} from "lucide-react";
import { formatPriceFromEuros } from "@/lib/utils";

interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  created_at: string;
}

interface ManualIncome {
  id: string;
  date: string;
  description: string;
  amount: number;
  payment_method: string | null;
  created_at: string;
}

interface OrderEntry {
  id: string;
  invoice_number: string;
  amount: number;
  created_at: string;
  payment_method: string | null;
  profiles: { first_name: string; last_name: string } | null;
  products: { name: string } | null;
}

const EXPENSE_CATEGORIES = [
  "Matériel sportif",
  "Location de salle",
  "Logiciels & Abonnements",
  "Transport & Déplacements",
  "Communication & Marketing",
  "Formation & Certification",
  "Assurances",
  "Frais bancaires",
  "Fournitures",
  "Divers",
];

const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: "especes", label: "Espèces" },
  { value: "virement", label: "Virement" },
  { value: "cheque", label: "Chèque" },
  { value: "carte", label: "Carte bancaire" },
  { value: "helloasso", label: "HelloAsso" },
];

function paymentLabel(value: string | null | undefined) {
  if (!value) return null;
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}

const MONTHS_SHORT = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
];
const MONTHS_FULL = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

type ActiveTab = "journal" | "recettes" | "depenses";
type RecapMode = "mois" | "periode";

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

interface JournalEntry {
  id: string;
  date: string;
  label: string;
  ref: string;
  sub: string;
  type: "recette" | "depense";
  amount: number;
  payment_method?: string | null;
  isManual?: boolean;
}

export default function ComptabilitePage() {
  const now = new Date();

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [manualIncomes, setManualIncomes] = useState<ManualIncome[]>([]);
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState<ActiveTab>("journal");

  const [recapMode, setRecapMode] = useState<RecapMode>("mois");
  const [recapMonth, setRecapMonth] = useState(now.getMonth());
  const [recapFrom, setRecapFrom] = useState(
    toDateStr(new Date(now.getFullYear(), now.getMonth(), 1))
  );
  const [recapTo, setRecapTo] = useState(toDateStr(now));

  // Add expense modal
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState("");
  const [expenseForm, setExpenseForm] = useState({
    date: toDateStr(now),
    description: "",
    category: EXPENSE_CATEGORIES[0],
    amount: "",
  });

  // Add manual income modal
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [addingIncome, setAddingIncome] = useState(false);
  const [incomeError, setIncomeError] = useState("");
  const [incomeForm, setIncomeForm] = useState({
    date: toDateStr(now),
    description: "",
    amount: "",
    payment_method: "",
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const [comptaRes, ordersRes] = await Promise.all([
      fetch("/api/admin/comptabilite"),
      supabase
        .from("orders")
        .select("id, invoice_number, amount, created_at, payment_method, profiles(first_name, last_name), products(name)")
        .eq("status", "paid")
        .order("created_at", { ascending: false }),
    ]);

    if (comptaRes.ok) {
      const { expenses: exp, manual_incomes: inc } = await comptaRes.json();
      setExpenses(exp || []);
      setManualIncomes(inc || []);
    }
    setOrders((ordersRes.data as unknown as OrderEntry[]) || []);
    setLoading(false);
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setAddingExpense(true);
    setExpenseError("");
    const res = await fetch("/api/admin/comptabilite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "expense", ...expenseForm }),
    });
    if (res.ok) {
      setShowAddExpense(false);
      setExpenseForm({ date: toDateStr(now), description: "", category: EXPENSE_CATEGORIES[0], amount: "" });
      loadData();
    } else {
      const d = await res.json();
      setExpenseError(d.error || "Erreur");
    }
    setAddingExpense(false);
  }

  async function handleAddIncome(e: React.FormEvent) {
    e.preventDefault();
    setAddingIncome(true);
    setIncomeError("");
    const res = await fetch("/api/admin/comptabilite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "income", ...incomeForm }),
    });
    if (res.ok) {
      setShowAddIncome(false);
      setIncomeForm({ date: toDateStr(now), description: "", amount: "", payment_method: "" });
      loadData();
    } else {
      const d = await res.json();
      setIncomeError(d.error || "Erreur");
    }
    setAddingIncome(false);
  }

  async function handleDelete(id: string, type: "expense" | "income") {
    setDeletingId(id);
    await fetch(`/api/admin/comptabilite?id=${id}&type=${type}`, { method: "DELETE" });
    if (type === "expense") setExpenses((p) => p.filter((e) => e.id !== id));
    else setManualIncomes((p) => p.filter((i) => i.id !== id));
    setDeletingId(null);
  }

  // --- Year-level data ---
  const yearExpenses = useMemo(
    () => expenses.filter((e) => new Date(e.date).getFullYear() === selectedYear),
    [expenses, selectedYear]
  );
  const yearManualIncomes = useMemo(
    () => manualIncomes.filter((i) => new Date(i.date).getFullYear() === selectedYear),
    [manualIncomes, selectedYear]
  );
  const yearOrders = useMemo(
    () => orders.filter((o) => new Date(o.created_at).getFullYear() === selectedYear),
    [orders, selectedYear]
  );

  const totalIncome =
    yearOrders.reduce((s, o) => s + o.amount, 0) +
    yearManualIncomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = yearExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalIncome - totalExpenses;

  const monthlyData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        income:
          yearOrders.filter((o) => new Date(o.created_at).getMonth() === i).reduce((s, o) => s + o.amount, 0) +
          yearManualIncomes.filter((m) => new Date(m.date).getMonth() === i).reduce((s, m) => s + m.amount, 0),
        expense: yearExpenses.filter((e) => new Date(e.date).getMonth() === i).reduce((s, e) => s + e.amount, 0),
      })),
    [yearOrders, yearManualIncomes, yearExpenses]
  );

  const maxBarValue = Math.max(...monthlyData.map((m) => Math.max(m.income, m.expense)), 1);

  const availableYears = useMemo(() => {
    const years = new Set<number>([now.getFullYear()]);
    orders.forEach((o) => years.add(new Date(o.created_at).getFullYear()));
    expenses.forEach((e) => years.add(new Date(e.date).getFullYear()));
    manualIncomes.forEach((i) => years.add(new Date(i.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [orders, expenses, manualIncomes]);

  // --- Recap period ---
  function inPeriod(dateStr: string) {
    if (recapMode === "mois") {
      const d = new Date(dateStr);
      return d.getFullYear() === selectedYear && d.getMonth() === recapMonth;
    }
    const d = new Date(dateStr);
    const from = new Date(recapFrom);
    const to = new Date(recapTo);
    to.setHours(23, 59, 59);
    return d >= from && d <= to;
  }

  const recapOrders = useMemo(
    () => orders.filter((o) => inPeriod(o.created_at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders, recapMode, recapMonth, recapFrom, recapTo, selectedYear]
  );
  const recapManualIncomes = useMemo(
    () => manualIncomes.filter((i) => inPeriod(i.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manualIncomes, recapMode, recapMonth, recapFrom, recapTo, selectedYear]
  );
  const recapExpenses = useMemo(
    () => expenses.filter((e) => inPeriod(e.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses, recapMode, recapMonth, recapFrom, recapTo, selectedYear]
  );

  const recapIncome =
    recapOrders.reduce((s, o) => s + o.amount, 0) +
    recapManualIncomes.reduce((s, i) => s + i.amount, 0);
  const recapExpense = recapExpenses.reduce((s, e) => s + e.amount, 0);
  const recapProfit = recapIncome - recapExpense;

  // Payment method breakdown for recap
  const recapPaymentBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    recapOrders.forEach((o) => {
      const k = o.payment_method || "non renseigné";
      map.set(k, (map.get(k) ?? 0) + o.amount);
    });
    recapManualIncomes.forEach((i) => {
      const k = i.payment_method || "non renseigné";
      map.set(k, (map.get(k) ?? 0) + i.amount);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([method, total]) => ({ method, label: paymentLabel(method) ?? method, total }));
  }, [recapOrders, recapManualIncomes]);

  const recapJournal: JournalEntry[] = useMemo(() => {
    const income: JournalEntry[] = recapOrders.map((o) => ({
      id: o.id,
      date: o.created_at,
      label: `${o.profiles?.first_name ?? ""} ${o.profiles?.last_name ?? ""}`.trim() || "Client",
      ref: o.invoice_number,
      sub: o.products?.name ?? "",
      type: "recette",
      amount: o.amount,
      payment_method: o.payment_method,
    }));
    const manual: JournalEntry[] = recapManualIncomes.map((i) => ({
      id: i.id,
      date: i.date,
      label: i.description,
      ref: "Recette manuelle",
      sub: "",
      type: "recette",
      amount: i.amount,
      payment_method: i.payment_method,
      isManual: true,
    }));
    const exp: JournalEntry[] = recapExpenses.map((e) => ({
      id: e.id,
      date: e.date,
      label: e.description,
      ref: e.category,
      sub: "",
      type: "depense",
      amount: e.amount,
    }));
    return [...income, ...manual, ...exp].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [recapOrders, recapManualIncomes, recapExpenses]);

  // --- Full year journal ---
  const journalEntries: JournalEntry[] = useMemo(() => {
    const income: JournalEntry[] = yearOrders.map((o) => ({
      id: o.id,
      date: o.created_at,
      label: `${o.profiles?.first_name ?? ""} ${o.profiles?.last_name ?? ""}`.trim() || "Client",
      ref: o.invoice_number,
      sub: o.products?.name ?? "",
      type: "recette",
      amount: o.amount,
      payment_method: o.payment_method,
    }));
    const manual: JournalEntry[] = yearManualIncomes.map((i) => ({
      id: i.id,
      date: i.date,
      label: i.description,
      ref: "Recette manuelle",
      sub: "",
      type: "recette",
      amount: i.amount,
      payment_method: i.payment_method,
      isManual: true,
    }));
    const exp: JournalEntry[] = yearExpenses.map((e) => ({
      id: e.id,
      date: e.date,
      label: e.description,
      ref: e.category,
      sub: "",
      type: "depense",
      amount: e.amount,
    }));
    return [...income, ...manual, ...exp].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [yearOrders, yearManualIncomes, yearExpenses]);

  const allYearRecettes = [...yearOrders.map((o) => ({ ...o, isManual: false })), ...yearManualIncomes.map((i) => ({ ...i, isManual: true, invoice_number: "Manuelle", profiles: null, products: null, created_at: i.date }))].sort(
    (a, b) => new Date(b.created_at ?? b.date ?? "").getTime() - new Date(a.created_at ?? a.date ?? "").getTime()
  );

  const recapLabel =
    recapMode === "mois"
      ? `${MONTHS_FULL[recapMonth]} ${selectedYear}`
      : `${new Date(recapFrom).toLocaleDateString("fr-FR")} → ${new Date(recapTo).toLocaleDateString("fr-FR")}`;

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Comptabilité</h1>
          <p className="text-gray-500 text-sm mt-1">Journal des recettes et dépenses</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#D4AF37]"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Annual KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider">CA {selectedYear}</p>
              <p className="text-2xl font-bold text-[#D4AF37] mt-1">{formatPriceFromEuros(totalIncome)}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
              <ArrowUpCircle size={18} className="text-[#D4AF37]" />
            </div>
          </div>
          <p className="text-gray-600 text-xs mt-2">
            {yearOrders.length + yearManualIncomes.length} entrée{yearOrders.length + yearManualIncomes.length !== 1 ? "s" : ""}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider">Dépenses {selectedYear}</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">{formatPriceFromEuros(totalExpenses)}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
              <ArrowDownCircle size={18} className="text-rose-400" />
            </div>
          </div>
          <p className="text-gray-600 text-xs mt-2">
            {yearExpenses.length} entrée{yearExpenses.length !== 1 ? "s" : ""}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider">Bénéfice {selectedYear}</p>
              <p className={`text-2xl font-bold mt-1 ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {formatPriceFromEuros(profit)}
              </p>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${profit >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
              {profit >= 0 ? <TrendingUp size={18} className="text-green-400" /> : <TrendingDown size={18} className="text-red-400" />}
            </div>
          </div>
          <p className="text-gray-600 text-xs mt-2">
            {totalIncome > 0 ? `${Math.round((profit / totalIncome) * 100)} % du CA` : "—"}
          </p>
        </Card>
      </div>

      {/* Monthly chart */}
      <Card className="p-4 lg:p-6">
        <h2 className="text-sm font-semibold text-white mb-1">Évolution mensuelle {selectedYear}</h2>
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#D4AF37] inline-block" />Recettes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />Dépenses
          </span>
        </div>
        <div className="flex items-end gap-1 h-36 w-full">
          {monthlyData.map((m, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center cursor-pointer"
              title={`${MONTHS_FULL[i]} : CA ${formatPriceFromEuros(m.income)}, Dépenses ${formatPriceFromEuros(m.expense)}`}
              onClick={() => { setRecapMode("mois"); setRecapMonth(i); }}
            >
              <div className="w-full flex items-end gap-px h-28">
                <div
                  className={`flex-1 rounded-t-sm bg-[#D4AF37] transition-opacity ${recapMode === "mois" && recapMonth === i ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
                  style={{ height: `${(m.income / maxBarValue) * 100}%`, minHeight: m.income > 0 ? "2px" : "0" }}
                />
                <div
                  className={`flex-1 rounded-t-sm bg-rose-500 transition-opacity ${recapMode === "mois" && recapMonth === i ? "opacity-90" : "opacity-40 hover:opacity-70"}`}
                  style={{ height: `${(m.expense / maxBarValue) * 100}%`, minHeight: m.expense > 0 ? "2px" : "0" }}
                />
              </div>
              <span className={`text-[9px] mt-1 leading-none transition-colors ${recapMode === "mois" && recapMonth === i ? "text-[#D4AF37] font-semibold" : "text-gray-600"}`}>
                {MONTHS_SHORT[i]}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Period recap */}
      <Card className="p-4 lg:p-6">
        <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-white">Récapitulatif — {recapLabel}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{recapJournal.length} entrée{recapJournal.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => setRecapMode("mois")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${recapMode === "mois" ? "bg-[#D4AF37] text-black" : "text-gray-400 hover:text-white"}`}
            >
              Mois
            </button>
            <button
              onClick={() => setRecapMode("periode")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${recapMode === "periode" ? "bg-[#D4AF37] text-black" : "text-gray-400 hover:text-white"}`}
            >
              Période libre
            </button>
          </div>
        </div>

        {/* Month chips */}
        {recapMode === "mois" && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {MONTHS_SHORT.map((m, i) => (
              <button
                key={i}
                onClick={() => setRecapMonth(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${recapMonth === i ? "bg-[#D4AF37] text-black" : "bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white"}`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {/* Date range */}
        {recapMode === "periode" && (
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-gray-500 mb-1">Du</label>
              <input
                type="date"
                value={recapFrom}
                onChange={(e) => setRecapFrom(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#D4AF37]"
              />
            </div>
            <span className="text-gray-600 text-sm mt-4">→</span>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-gray-500 mb-1">Au</label>
              <input
                type="date"
                value={recapTo}
                onChange={(e) => setRecapTo(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        )}

        {/* Period KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-3">
            <p className="text-gray-500 text-xs">Recettes</p>
            <p className="text-[#D4AF37] font-bold text-base mt-0.5">{formatPriceFromEuros(recapIncome)}</p>
          </div>
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-3">
            <p className="text-gray-500 text-xs">Dépenses</p>
            <p className="text-rose-400 font-bold text-base mt-0.5">{formatPriceFromEuros(recapExpense)}</p>
          </div>
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-3">
            <p className="text-gray-500 text-xs">Bénéfice</p>
            <p className={`font-bold text-base mt-0.5 ${recapProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {formatPriceFromEuros(recapProfit)}
            </p>
          </div>
        </div>

        {/* Payment method breakdown */}
        {recapPaymentBreakdown.length > 0 && (
          <div className="mb-5 p-3 bg-[#111111] border border-[#1f1f1f] rounded-xl">
            <p className="text-xs text-gray-500 mb-2.5">Recettes par moyen de paiement</p>
            <div className="flex flex-wrap gap-2">
              {recapPaymentBreakdown.map(({ method, label, total }) => (
                <div key={method} className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5">
                  <span className="text-gray-300 text-xs font-medium">{label}</span>
                  <span className="text-[#D4AF37] text-xs font-bold">{formatPriceFromEuros(total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Period journal */}
        {recapJournal.length === 0 ? (
          <div className="text-center py-6">
            <BookOpen size={28} className="text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aucune entrée sur cette période</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recapJournal.map((entry) => (
              <div
                key={`${entry.type}-${entry.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#0e0d14] border border-[#1a1a1a]"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.type === "recette" ? "bg-[#D4AF37]/10" : "bg-rose-500/10"}`}>
                  {entry.type === "recette"
                    ? <ArrowUpCircle size={14} className="text-[#D4AF37]" />
                    : <ArrowDownCircle size={14} className="text-rose-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white text-sm font-medium truncate">{entry.label}</p>
                    {entry.payment_method && (
                      <span className="text-[10px] font-medium text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] rounded px-1.5 py-0.5 flex-shrink-0">
                        {paymentLabel(entry.payment_method)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-xs truncate">
                    {entry.ref}{entry.sub ? ` — ${entry.sub}` : ""} — {new Date(entry.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <p className={`font-bold text-sm flex-shrink-0 ${entry.type === "recette" ? "text-[#D4AF37]" : "text-rose-400"}`}>
                  {entry.type === "recette" ? "+" : "−"}{formatPriceFromEuros(entry.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Full year journal */}
      <Card className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-[#111111] border border-[#1f1f1f] rounded-lg p-1">
            {(["journal", "recettes", "depenses"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === tab ? "bg-[#1a1a1a] text-white border border-[#2a2a2a]" : "text-gray-500 hover:text-gray-300"}`}
              >
                {tab === "journal"
                  ? `Journal (${journalEntries.length})`
                  : tab === "recettes"
                  ? `Recettes (${allYearRecettes.length})`
                  : `Dépenses (${yearExpenses.length})`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {activeTab === "recettes" && (
              <Button size="sm" onClick={() => setShowAddIncome(true)}>
                <Plus size={14} />
                Ajouter
              </Button>
            )}
            {activeTab === "depenses" && (
              <Button size="sm" onClick={() => setShowAddExpense(true)}>
                <Plus size={14} />
                Ajouter
              </Button>
            )}
          </div>
        </div>

        {/* Journal tab */}
        {activeTab === "journal" && (
          journalEntries.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen size={32} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Aucune entrée pour {selectedYear}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {journalEntries.map((entry) => (
                <div
                  key={`${entry.type}-${entry.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#111111] border border-[#1a1a1a]"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.type === "recette" ? "bg-[#D4AF37]/10" : "bg-rose-500/10"}`}>
                    {entry.type === "recette"
                      ? <ArrowUpCircle size={15} className="text-[#D4AF37]" />
                      : <ArrowDownCircle size={15} className="text-rose-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-sm font-medium truncate">{entry.label}</p>
                      {entry.payment_method && (
                        <span className="text-[10px] font-medium text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] rounded px-1.5 py-0.5 flex-shrink-0">
                          {paymentLabel(entry.payment_method)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs truncate">
                      {entry.ref}{entry.sub ? ` — ${entry.sub}` : ""} — {new Date(entry.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <p className={`font-bold text-sm flex-shrink-0 ${entry.type === "recette" ? "text-[#D4AF37]" : "text-rose-400"}`}>
                    {entry.type === "recette" ? "+" : "−"}{formatPriceFromEuros(entry.amount)}
                  </p>
                </div>
              ))}
            </div>
          )
        )}

        {/* Recettes tab */}
        {activeTab === "recettes" && (
          allYearRecettes.length === 0 ? (
            <div className="text-center py-10">
              <Receipt size={32} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm mb-3">Aucune recette pour {selectedYear}</p>
              <Button size="sm" onClick={() => setShowAddIncome(true)}>
                <Plus size={14} />Ajouter une recette
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {allYearRecettes.map((entry) => {
                const isManual = entry.isManual;
                const pm = (entry as OrderEntry).payment_method ?? (entry as ManualIncome & { isManual: boolean }).payment_method ?? null;
                const dateStr = isManual ? (entry as ManualIncome & { isManual: boolean }).date : (entry as OrderEntry).created_at;
                return (
                  <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#111111] border border-[#1a1a1a]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white text-sm font-medium truncate">
                          {isManual
                            ? (entry as ManualIncome & { isManual: boolean }).description
                            : `${(entry as OrderEntry).profiles?.first_name ?? ""} ${(entry as OrderEntry).profiles?.last_name ?? ""}`.trim() || "Client"}
                        </p>
                        {isManual && (
                          <span className="text-[10px] font-medium text-gray-600 bg-[#1a1a1a] border border-[#2a2a2a] rounded px-1.5 py-0.5 flex-shrink-0">
                            Manuel
                          </span>
                        )}
                        {pm && (
                          <span className="text-[10px] font-medium text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] rounded px-1.5 py-0.5 flex-shrink-0">
                            {paymentLabel(pm)}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-xs truncate">
                        {isManual ? "Recette manuelle" : (entry as OrderEntry).invoice_number}
                        {!isManual && (entry as OrderEntry).products?.name ? ` — ${(entry as OrderEntry).products!.name}` : ""}{" "}
                        — {new Date(dateStr).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="text-[#D4AF37] font-bold text-sm">+{formatPriceFromEuros(entry.amount)}</p>
                      {isManual && (
                        <button
                          onClick={() => handleDelete(entry.id, "income")}
                          disabled={deletingId === entry.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          {deletingId === entry.id
                            ? <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
                            : <Trash2 size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Dépenses tab */}
        {activeTab === "depenses" && (
          yearExpenses.length === 0 ? (
            <div className="text-center py-10">
              <ArrowDownCircle size={32} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm mb-3">Aucune dépense pour {selectedYear}</p>
              <Button size="sm" onClick={() => setShowAddExpense(true)}>
                <Plus size={14} />Ajouter une dépense
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {yearExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#111111] border border-[#1a1a1a]">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{expense.description}</p>
                    <p className="text-gray-600 text-xs">{expense.category} — {new Date(expense.date).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-rose-400 font-bold text-sm">−{formatPriceFromEuros(expense.amount)}</p>
                    <button
                      onClick={() => handleDelete(expense.id, "expense")}
                      disabled={deletingId === expense.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      {deletingId === expense.id
                        ? <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
                        : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </Card>

      {/* Add Expense Modal */}
      <Modal open={showAddExpense} onClose={() => { setShowAddExpense(false); setExpenseError(""); }} title="Ajouter une dépense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Input label="Date *" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
          <Input label="Description *" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Ex : Achat tapis de sport" required />
          <Select
            label="Catégorie *"
            value={expenseForm.category}
            onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            required
          />
          <Input label="Montant (€) *" type="number" step="0.01" min="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="0,00" required />
          {expenseError && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5"><p className="text-sm text-red-400">{expenseError}</p></div>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowAddExpense(false)}>Annuler</Button>
            <Button type="submit" loading={addingExpense} className="flex-1" disabled={!expenseForm.date || !expenseForm.description || !expenseForm.amount}>Enregistrer</Button>
          </div>
        </form>
      </Modal>

      {/* Add Manual Income Modal */}
      <Modal open={showAddIncome} onClose={() => { setShowAddIncome(false); setIncomeError(""); }} title="Ajouter une recette">
        <form onSubmit={handleAddIncome} className="space-y-4">
          <Input label="Date *" type="date" value={incomeForm.date} onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} required />
          <Input label="Description *" value={incomeForm.description} onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })} placeholder="Ex : Cours particulier Mars" required />
          <Input label="Montant (€) *" type="number" step="0.01" min="0.01" value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} placeholder="0,00" required />
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-gray-300">Moyen de paiement</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${incomeForm.payment_method === m.value ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-white" : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-400"}`}
                >
                  <input type="radio" name="payment_method" value={m.value} checked={incomeForm.payment_method === m.value} onChange={() => setIncomeForm({ ...incomeForm, payment_method: m.value })} className="accent-[#D4AF37]" />
                  <span className="text-sm">{m.label}</span>
                </label>
              ))}
            </div>
          </div>
          {incomeError && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5"><p className="text-sm text-red-400">{incomeError}</p></div>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowAddIncome(false)}>Annuler</Button>
            <Button type="submit" loading={addingIncome} className="flex-1" disabled={!incomeForm.date || !incomeForm.description || !incomeForm.amount}>Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

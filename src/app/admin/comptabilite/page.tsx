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
  AlertCircle,
} from "lucide-react";
import { formatPriceFromEuros } from "@/lib/utils";
import type { InvoiceSettings } from "@/types/database";

interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  created_at: string;
}

interface OrderEntry {
  id: string;
  invoice_number: string;
  amount: number;
  created_at: string;
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

const MONTHS_SHORT = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
];
const MONTHS_FULL = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface UrssafInfo {
  rate: number;
  label: string;
}

function getUrssafInfo(legalStatus: string | null): UrssafInfo | null {
  if (!legalStatus) return null;
  const s = legalStatus.toLowerCase();
  if (
    s.includes("micro") ||
    s.includes("auto-entrepreneur") ||
    s.includes("autoentrepreneur") ||
    s.includes("auto entrepreneur")
  ) {
    if (s.includes("bnc") || s.includes("libéral") || s.includes("liberal")) {
      return { rate: 0.212, label: "Professions libérales BNC — taux 21,2 %" };
    }
    if (s.includes("vente") || s.includes("marchandise")) {
      return { rate: 0.123, label: "Ventes de marchandises BIC — taux 12,3 %" };
    }
    return { rate: 0.212, label: "Prestations de services BIC — taux 21,2 %" };
  }
  return null;
}

type ActiveTab = "journal" | "recettes" | "depenses";
type UrssafPeriod = "mensuel" | "trimestriel";

export default function ComptabilitePage() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<ActiveTab>("journal");
  const [urssafPeriod, setUrssafPeriod] = useState<UrssafPeriod>("trimestriel");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addError, setAddError] = useState("");
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    category: EXPENSE_CATEGORIES[0],
    amount: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const [expensesRes, ordersRes, settingsRes] = await Promise.all([
      fetch("/api/admin/comptabilite"),
      supabase
        .from("orders")
        .select(
          "id, invoice_number, amount, created_at, profiles(first_name, last_name), products(name)"
        )
        .eq("status", "paid")
        .order("created_at", { ascending: false }),
      supabase.from("invoice_settings").select("*").single(),
    ]);

    const expData = expensesRes.ok ? await expensesRes.json() : [];
    setExpenses(expData || []);
    setOrders((ordersRes.data as unknown as OrderEntry[]) || []);
    setSettings(settingsRes.data || null);
    setLoading(false);
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setAddingExpense(true);
    setAddError("");
    const res = await fetch("/api/admin/comptabilite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenseForm),
    });
    if (res.ok) {
      setShowAddExpense(false);
      setExpenseForm({
        date: new Date().toISOString().split("T")[0],
        description: "",
        category: EXPENSE_CATEGORIES[0],
        amount: "",
      });
      loadData();
    } else {
      const data = await res.json();
      setAddError(data.error || "Erreur lors de l'ajout");
    }
    setAddingExpense(false);
  }

  async function handleDeleteExpense(id: string) {
    setDeletingId(id);
    await fetch(`/api/admin/comptabilite?id=${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
  }

  const yearExpenses = useMemo(
    () => expenses.filter((e) => new Date(e.date).getFullYear() === selectedYear),
    [expenses, selectedYear]
  );

  const yearOrders = useMemo(
    () => orders.filter((o) => new Date(o.created_at).getFullYear() === selectedYear),
    [orders, selectedYear]
  );

  const totalIncome = yearOrders.reduce((s, o) => s + o.amount, 0);
  const totalExpenses = yearExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalIncome - totalExpenses;

  const monthlyData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        income: yearOrders
          .filter((o) => new Date(o.created_at).getMonth() === i)
          .reduce((s, o) => s + o.amount, 0),
        expense: yearExpenses
          .filter((e) => new Date(e.date).getMonth() === i)
          .reduce((s, e) => s + e.amount, 0),
      })),
    [yearOrders, yearExpenses]
  );

  const urssafInfo = getUrssafInfo(settings?.legal_status ?? null);

  const availableYears = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    orders.forEach((o) => years.add(new Date(o.created_at).getFullYear()));
    expenses.forEach((e) => years.add(new Date(e.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [orders, expenses]);

  const journalEntries = useMemo(() => {
    const income = yearOrders.map((o) => ({
      id: o.id,
      date: o.created_at,
      label: `${o.profiles?.first_name ?? ""} ${o.profiles?.last_name ?? ""}`.trim() || "Client",
      ref: o.invoice_number,
      sub: o.products?.name ?? "",
      type: "recette" as const,
      amount: o.amount,
    }));
    const exp = yearExpenses.map((e) => ({
      id: e.id,
      date: e.date,
      label: e.description,
      ref: e.category,
      sub: "",
      type: "depense" as const,
      amount: e.amount,
    }));
    return [...income, ...exp].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [yearOrders, yearExpenses]);

  const maxBarValue = Math.max(
    ...monthlyData.map((m) => Math.max(m.income, m.expense)),
    1
  );

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

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
          <p className="text-gray-500 text-sm mt-1">
            Journal des recettes et dépenses
          </p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#D4AF37]"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider">
                Chiffre d&apos;affaires
              </p>
              <p className="text-2xl font-bold text-[#D4AF37] mt-1">
                {formatPriceFromEuros(totalIncome)}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
              <ArrowUpCircle size={18} className="text-[#D4AF37]" />
            </div>
          </div>
          <p className="text-gray-600 text-xs mt-2">
            {yearOrders.length} facture{yearOrders.length !== 1 ? "s" : ""}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider">
                Dépenses
              </p>
              <p className="text-2xl font-bold text-rose-400 mt-1">
                {formatPriceFromEuros(totalExpenses)}
              </p>
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
              <p className="text-gray-500 text-xs uppercase tracking-wider">
                Bénéfice net
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  profit >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {formatPriceFromEuros(profit)}
              </p>
            </div>
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                profit >= 0 ? "bg-green-500/10" : "bg-red-500/10"
              }`}
            >
              {profit >= 0 ? (
                <TrendingUp size={18} className="text-green-400" />
              ) : (
                <TrendingDown size={18} className="text-red-400" />
              )}
            </div>
          </div>
          <p className="text-gray-600 text-xs mt-2">
            {totalIncome > 0
              ? `${Math.round((profit / totalIncome) * 100)} % du CA`
              : "—"}
          </p>
        </Card>
      </div>

      {/* Monthly chart */}
      <Card className="p-4 lg:p-6">
        <h2 className="text-sm font-semibold text-white mb-1">
          Évolution mensuelle {selectedYear}
        </h2>
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#D4AF37] inline-block" />
            Recettes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
            Dépenses
          </span>
        </div>
        <div className="flex items-end gap-1 h-36 w-full">
          {monthlyData.map((m, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center"
              title={`${MONTHS_FULL[i]} : CA ${formatPriceFromEuros(m.income)}, Dépenses ${formatPriceFromEuros(m.expense)}`}
            >
              <div className="w-full flex items-end gap-px h-28">
                <div
                  className="flex-1 rounded-t-sm bg-[#D4AF37] opacity-80 hover:opacity-100 transition-opacity"
                  style={{
                    height: `${(m.income / maxBarValue) * 100}%`,
                    minHeight: m.income > 0 ? "2px" : "0",
                  }}
                />
                <div
                  className="flex-1 rounded-t-sm bg-rose-500 opacity-70 hover:opacity-100 transition-opacity"
                  style={{
                    height: `${(m.expense / maxBarValue) * 100}%`,
                    minHeight: m.expense > 0 ? "2px" : "0",
                  }}
                />
              </div>
              <span className="text-[9px] text-gray-600 mt-1 leading-none">
                {MONTHS_SHORT[i]}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* URSSAF section */}
      {urssafInfo ? (
        <Card className="p-4 lg:p-6">
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Déclaration URSSAF
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">{urssafInfo.label}</p>
            </div>
            <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1 flex-shrink-0">
              <button
                onClick={() => setUrssafPeriod("mensuel")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  urssafPeriod === "mensuel"
                    ? "bg-[#D4AF37] text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setUrssafPeriod("trimestriel")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  urssafPeriod === "trimestriel"
                    ? "bg-[#D4AF37] text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Trimestriel
              </button>
            </div>
          </div>

          {urssafPeriod === "trimestriel" ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((q) => {
                const qMonths = [q * 3, q * 3 + 1, q * 3 + 2];
                const quarterCA = qMonths.reduce(
                  (s, m) => s + monthlyData[m].income,
                  0
                );
                const cotisations = quarterCA * urssafInfo.rate;
                const isCurrent =
                  selectedYear === currentYear &&
                  qMonths.includes(currentMonth);
                return (
                  <div
                    key={q}
                    className={`p-3 rounded-xl border ${
                      isCurrent
                        ? "border-[#D4AF37]/30 bg-[#D4AF37]/5"
                        : "border-[#1f1f1f] bg-[#111111]"
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-400 mb-2">
                      T{q + 1} —{" "}
                      {MONTHS_SHORT[q * 3]}/{MONTHS_SHORT[q * 3 + 2]}
                      {isCurrent && (
                        <span className="ml-1.5 text-[#D4AF37]">●</span>
                      )}
                    </p>
                    <p className="text-white font-bold text-sm">
                      {formatPriceFromEuros(quarterCA)}
                    </p>
                    <p className="text-gray-500 text-xs">CA du trimestre</p>
                    <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
                      <p className="text-[#D4AF37] font-bold text-sm">
                        {formatPriceFromEuros(cotisations)}
                      </p>
                      <p className="text-gray-600 text-xs">Cotisations est.</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              {Array.from({ length: 12 }, (_, i) => {
                const monthCA = monthlyData[i].income;
                const cotisations = monthCA * urssafInfo.rate;
                const isCurrent =
                  selectedYear === currentYear && i === currentMonth;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isCurrent
                        ? "border-[#D4AF37]/20 bg-[#D4AF37]/5"
                        : "border-[#1f1f1f] bg-[#111111]"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        isCurrent ? "text-[#D4AF37]" : "text-gray-300"
                      }`}
                    >
                      {MONTHS_FULL[i]}
                      {isCurrent && (
                        <span className="ml-2 text-xs text-[#D4AF37]/60">
                          mois en cours
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-white text-sm font-medium">
                          {formatPriceFromEuros(monthCA)}
                        </p>
                        <p className="text-gray-600 text-xs">CA</p>
                      </div>
                      <div>
                        <p className="text-[#D4AF37] text-sm font-medium">
                          {formatPriceFromEuros(cotisations)}
                        </p>
                        <p className="text-gray-600 text-xs">Cotisations</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-lg p-3">
            <AlertCircle size={13} className="text-amber-400/80 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400/80">
              Estimation indicative. Vérifiez les taux en vigueur sur{" "}
              <span className="underline">autoentrepreneur.urssaf.fr</span>
            </p>
          </div>
        </Card>
      ) : (
        settings && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-500">
                Le calcul URSSAF n&apos;est pas disponible pour ce statut juridique (
                <span className="text-gray-400">{settings.legal_status || "non renseigné"}</span>
                ). Configurez un statut micro-entrepreneur dans les{" "}
                <a href="/admin/settings" className="text-[#D4AF37] underline">
                  Paramètres
                </a>
                .
              </p>
            </div>
          </Card>
        )
      )}

      {/* Journal */}
      <Card className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-[#111111] border border-[#1f1f1f] rounded-lg p-1">
            {(["journal", "recettes", "depenses"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[#1a1a1a] text-white border border-[#2a2a2a]"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab === "journal"
                  ? "Journal"
                  : tab === "recettes"
                  ? `Recettes (${yearOrders.length})`
                  : `Dépenses (${yearExpenses.length})`}
              </button>
            ))}
          </div>
          {activeTab === "depenses" && (
            <Button size="sm" onClick={() => setShowAddExpense(true)}>
              <Plus size={14} />
              Ajouter
            </Button>
          )}
        </div>

        {/* Journal tab */}
        {activeTab === "journal" &&
          (journalEntries.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen size={32} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Aucune entrée pour {selectedYear}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {journalEntries.map((entry) => (
                <div
                  key={`${entry.type}-${entry.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#111111] border border-[#1a1a1a]"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      entry.type === "recette"
                        ? "bg-[#D4AF37]/10"
                        : "bg-rose-500/10"
                    }`}
                  >
                    {entry.type === "recette" ? (
                      <ArrowUpCircle size={15} className="text-[#D4AF37]" />
                    ) : (
                      <ArrowDownCircle size={15} className="text-rose-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {entry.label}
                    </p>
                    <p className="text-gray-600 text-xs truncate">
                      {entry.ref}
                      {entry.sub ? ` — ${entry.sub}` : ""} —{" "}
                      {new Date(entry.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <p
                    className={`font-bold text-sm flex-shrink-0 ${
                      entry.type === "recette"
                        ? "text-[#D4AF37]"
                        : "text-rose-400"
                    }`}
                  >
                    {entry.type === "recette" ? "+" : "−"}
                    {formatPriceFromEuros(entry.amount)}
                  </p>
                </div>
              ))}
            </div>
          ))}

        {/* Recettes tab */}
        {activeTab === "recettes" &&
          (yearOrders.length === 0 ? (
            <div className="text-center py-10">
              <Receipt size={32} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Aucune recette pour {selectedYear}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {yearOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#111111] border border-[#1a1a1a]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {order.profiles?.first_name} {order.profiles?.last_name}
                    </p>
                    <p className="text-gray-600 text-xs truncate">
                      {order.invoice_number}
                      {order.products?.name ? ` — ${order.products.name}` : ""}{" "}
                      —{" "}
                      {new Date(order.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <p className="text-[#D4AF37] font-bold text-sm flex-shrink-0">
                    +{formatPriceFromEuros(order.amount)}
                  </p>
                </div>
              ))}
            </div>
          ))}

        {/* Dépenses tab */}
        {activeTab === "depenses" &&
          (yearExpenses.length === 0 ? (
            <div className="text-center py-10">
              <ArrowDownCircle size={32} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm mb-3">
                Aucune dépense pour {selectedYear}
              </p>
              <Button size="sm" onClick={() => setShowAddExpense(true)}>
                <Plus size={14} />
                Ajouter une dépense
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {yearExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#111111] border border-[#1a1a1a]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {expense.description}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {expense.category} —{" "}
                      {new Date(expense.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-rose-400 font-bold text-sm">
                      −{formatPriceFromEuros(expense.amount)}
                    </p>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      disabled={deletingId === expense.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      {deletingId === expense.id ? (
                        <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </Card>

      {/* Add Expense Modal */}
      <Modal
        open={showAddExpense}
        onClose={() => {
          setShowAddExpense(false);
          setAddError("");
        }}
        title="Ajouter une dépense"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Input
            label="Date *"
            type="date"
            value={expenseForm.date}
            onChange={(e) =>
              setExpenseForm({ ...expenseForm, date: e.target.value })
            }
            required
          />
          <Input
            label="Description *"
            value={expenseForm.description}
            onChange={(e) =>
              setExpenseForm({ ...expenseForm, description: e.target.value })
            }
            placeholder="Ex : Achat tapis de sport"
            required
          />
          <Select
            label="Catégorie *"
            value={expenseForm.category}
            onChange={(e) =>
              setExpenseForm({ ...expenseForm, category: e.target.value })
            }
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            required
          />
          <Input
            label="Montant (€) *"
            type="number"
            step="0.01"
            min="0.01"
            value={expenseForm.amount}
            onChange={(e) =>
              setExpenseForm({ ...expenseForm, amount: e.target.value })
            }
            placeholder="0,00"
            required
          />

          {addError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              <p className="text-sm text-red-400">{addError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setShowAddExpense(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              loading={addingExpense}
              className="flex-1"
              disabled={
                !expenseForm.date ||
                !expenseForm.description ||
                !expenseForm.amount
              }
            >
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

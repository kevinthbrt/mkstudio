"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { Plus, Package, Edit, Trash2, Zap, Users, UserPlus } from "lucide-react";
import { formatPriceFromEuros } from "@/lib/utils";
import type { Product } from "@/types/database";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    session_count: "",
    session_type: "collective" as "collective" | "individual" | "duo",
    active: true,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("price");
    setProducts(data || []);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "", price: "", session_count: "", session_type: "collective" as "collective" | "individual" | "duo", active: true });
    setShowModal(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      session_count: String(product.session_count),
      session_type: product.session_type || "collective",
      active: product.active,
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      session_count: parseInt(form.session_count),
      session_type: form.session_type,
      active: form.active,
    };

    if (editing) {
      await supabase.from("products").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("products").insert(payload);
    }

    setSaving(false);
    setShowModal(false);
    loadProducts();
  }

  async function handleDelete(id: string) {
    setDeleteId(id);
    const supabase = createClient();
    await supabase.from("products").update({ active: false }).eq("id", id);
    setDeleteId(null);
    loadProducts();
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Produits</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez vos packs de séances
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Nouveau produit
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-10 text-center">
          <Package size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Aucun produit créé</p>
          <Button className="mt-4" onClick={openCreate}>
            Créer un produit
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  product.session_type === "individual"
                    ? "bg-blue-500/10 border border-blue-500/20"
                    : product.session_type === "duo"
                    ? "bg-purple-500/10 border border-purple-500/20"
                    : "bg-[#D4AF37]/10 border border-[#D4AF37]/20"
                }`}>
                  {product.session_type === "individual"
                    ? <Zap size={18} className="text-blue-400" />
                    : product.session_type === "duo"
                    ? <UserPlus size={18} className="text-purple-400" />
                    : <Users size={18} className="text-[#D4AF37]" />
                  }
                </div>
                <div className="flex gap-1.5">
                  <Badge variant={product.session_type === "individual" ? "blue" : product.session_type === "duo" ? "purple" : "gray"}>
                    {product.session_type === "individual" ? "Solo" : product.session_type === "duo" ? "Duo" : "Collectif"}
                  </Badge>
                  <Badge variant={product.active ? "green" : "red"}>
                    {product.active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>

              <h3 className="text-white font-semibold">{product.name}</h3>
              {product.description && (
                <p className="text-gray-500 text-sm mt-1">
                  {product.description}
                </p>
              )}

              <div className="mt-3 py-2 px-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] flex items-center justify-between">
                <span className="text-gray-400 text-sm">Séances</span>
                <span className="text-white font-bold">
                  {product.session_count}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-bold text-[#D4AF37]">
                  {formatPriceFromEuros(product.price)}
                </p>
                <p className="text-xs text-gray-600">
                  {(product.price / product.session_count).toFixed(2)} €/séance
                </p>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-[#1f1f1f]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEdit(product)}
                >
                  <Edit size={14} />
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-400 hover:bg-red-400/10"
                  onClick={() => handleDelete(product.id)}
                  loading={deleteId === product.id}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Modifier le produit" : "Nouveau produit"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nom du produit"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Pack 10 séances"
            required
          />
          <Textarea
            label="Description (optionnel)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Décrivez ce pack..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prix (€)"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="150.00"
              required
            />
            <Input
              label="Nombre de séances"
              type="number"
              min="1"
              value={form.session_count}
              onChange={(e) =>
                setForm({ ...form, session_count: e.target.value })
              }
              placeholder="10"
              required
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">Type de séances</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, session_type: "collective" })}
                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                  form.session_type === "collective"
                    ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]"
                    : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
                }`}
              >
                Collectif
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, session_type: "individual" })}
                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                  form.session_type === "individual"
                    ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                    : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
                }`}
              >
                Solo
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, session_type: "duo" })}
                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                  form.session_type === "duo"
                    ? "bg-purple-500/10 border-purple-500/40 text-purple-400"
                    : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
                }`}
              >
                Duo
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 accent-[#D4AF37]"
            />
            <span className="text-sm text-gray-300">
              Produit actif
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

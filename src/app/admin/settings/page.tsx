"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { CheckCircle, Settings, FileText, Info } from "lucide-react";
import type { InvoiceSettings } from "@/types/database";

export default function SettingsPage() {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    business_name: "",
    owner_name: "",
    address: "",
    city: "",
    postal_code: "",
    country: "France",
    email: "",
    phone: "",
    siret: "",
    ape_code: "",
    tva_mention: "TVA non applicable, art. 293 B du CGI",
    payment_terms: "Paiement à réception de facture",
    invoice_prefix: "MKS",
    bank_details: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const supabase = createClient();
    const { data } = await supabase.from("invoice_settings").select("*").single();
    if (data) {
      setSettings(data);
      setForm({
        business_name: data.business_name,
        owner_name: data.owner_name,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        country: data.country,
        email: data.email,
        phone: data.phone,
        siret: data.siret,
        ape_code: data.ape_code || "",
        tva_mention: data.tva_mention,
        payment_terms: data.payment_terms,
        invoice_prefix: data.invoice_prefix,
        bank_details: data.bank_details || "",
      });
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const payload = {
      ...form,
      ape_code: form.ape_code || null,
      bank_details: form.bank_details || null,
    };

    if (settings) {
      await supabase
        .from("invoice_settings")
        .update(payload)
        .eq("id", settings.id);
    } else {
      await supabase.from("invoice_settings").insert(payload);
    }

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    loadSettings();
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configurez les informations de facturation
        </p>
      </div>

      {!settings && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-400">
            Configurez vos informations pour pouvoir générer des factures conformes à la réglementation française.
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business info */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={16} className="text-[#D4AF37]" />
            <h2 className="text-sm font-semibold text-white">
              Informations de l&apos;entreprise
            </h2>
          </div>

          <Input
            label="Dénomination / Raison sociale *"
            value={form.business_name}
            onChange={(e) =>
              setForm({ ...form, business_name: e.target.value })
            }
            placeholder="MK Studio"
            required
          />
          <Input
            label="Nom du propriétaire / Gérant *"
            value={form.owner_name}
            onChange={(e) =>
              setForm({ ...form, owner_name: e.target.value })
            }
            placeholder="Marie Kouros"
            required
          />
          <Input
            label="Adresse *"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="12 rue de la Paix"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Code postal *"
              value={form.postal_code}
              onChange={(e) =>
                setForm({ ...form, postal_code: e.target.value })
              }
              placeholder="75001"
              required
            />
            <Input
              label="Ville *"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Paris"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email professionnel *"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Téléphone *"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+33 6 00 00 00 00"
              required
            />
          </div>
        </Card>

        {/* Legal info */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-[#D4AF37]" />
            <h2 className="text-sm font-semibold text-white">
              Mentions légales
            </h2>
          </div>

          <Input
            label="Numéro SIRET *"
            value={form.siret}
            onChange={(e) => setForm({ ...form, siret: e.target.value })}
            placeholder="XXX XXX XXX XXXXX"
            required
          />
          <Input
            label="Code APE / NAF (optionnel)"
            value={form.ape_code}
            onChange={(e) => setForm({ ...form, ape_code: e.target.value })}
            placeholder="8551Z (enseignement de disciplines sportives)"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Mention TVA *
            </label>
            <select
              value={form.tva_mention}
              onChange={(e) =>
                setForm({ ...form, tva_mention: e.target.value })
              }
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#D4AF37]"
            >
              <option value="TVA non applicable, art. 293 B du CGI">
                TVA non applicable, art. 293 B du CGI (franchise en base)
              </option>
              <option value="TVA incluse au taux de 20%">
                TVA incluse au taux de 20%
              </option>
              <option value="Exonéré de TVA (activité sportive, art. 261-4-4° du CGI)">
                Exonéré de TVA (activité sportive, art. 261-4-4°)
              </option>
            </select>
          </div>

          <Input
            label="Conditions de paiement *"
            value={form.payment_terms}
            onChange={(e) =>
              setForm({ ...form, payment_terms: e.target.value })
            }
            placeholder="Paiement à réception de facture"
            required
          />

          <Input
            label="Préfixe de facturation *"
            value={form.invoice_prefix}
            onChange={(e) =>
              setForm({ ...form, invoice_prefix: e.target.value })
            }
            placeholder="MKS"
            required
          />

          <Textarea
            label="Coordonnées bancaires (optionnel)"
            value={form.bank_details}
            onChange={(e) =>
              setForm({ ...form, bank_details: e.target.value })
            }
            placeholder="IBAN: FR76... / BIC: ..."
            rows={3}
          />
        </Card>

        {/* Legal info box */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="text-gray-300 font-medium">
              Mentions obligatoires sur les factures (coach sportif en France) :
            </span>
            <br />
            N° de facture, date, identité du vendeur (SIRET obligatoire),
            identité du client, description des prestations, prix unitaire HT,
            montant total HT, mention TVA, date de prestation ou livraison,
            conditions de paiement et pénalités de retard.
          </p>
        </div>

        {success && (
          <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5">
            <CheckCircle size={16} />
            <span className="text-sm">Paramètres sauvegardés !</span>
          </div>
        )}

        <Button type="submit" loading={saving} className="w-full" size="lg">
          Enregistrer les paramètres
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Send, Mail, Users } from "lucide-react";
import {
  MARKETING_CAMPAIGN_TYPES,
  defaultSubjectForCampaign,
  renderMarketingEmailHtml,
  type MarketingCampaignType,
} from "@/lib/marketingEmailTemplate";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mkstudio-training.fr";

export default function MarketingPage() {
  const [type, setType] = useState<MarketingCampaignType>("announcement");
  const [title, setTitle] = useState("");
  const [intro, setIntro] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [ctaText, setCtaText] = useState("Découvrir");
  const [ctaLink, setCtaLink] = useState(`${SITE_URL}/dashboard`);
  const [subject, setSubject] = useState("");
  const [subjectTouched, setSubjectTouched] = useState(false);

  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/marketing")
      .then((r) => r.json())
      .then((d) => setRecipientCount(d.recipientCount ?? 0))
      .catch(() => setRecipientCount(null));
  }, []);

  useEffect(() => {
    if (!subjectTouched) setSubject(defaultSubjectForCampaign(type, title));
  }, [type, title, subjectTouched]);

  const previewHtml = useMemo(
    () =>
      renderMarketingEmailHtml({
        type,
        title: title || "Titre de votre email",
        intro,
        bodyText: bodyText || "Le contenu de votre email apparaîtra ici.",
        imageUrl,
        promoCode,
        validUntil,
        ctaText: ctaText || "Découvrir",
        ctaLink: ctaLink || SITE_URL,
        firstName: "Prénom",
        unsubscribeUrl: "#",
      }),
    [type, title, intro, bodyText, imageUrl, promoCode, validUntil, ctaText, ctaLink]
  );

  const isValid = title.trim() && bodyText.trim() && ctaText.trim() && ctaLink.trim();

  async function sendCampaign(mode: "test" | "send") {
    const setLoading = mode === "test" ? setSendingTest : setSending;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          type,
          title,
          intro,
          bodyText,
          imageUrl,
          promoCode,
          validUntil,
          ctaText,
          ctaLink,
          subject,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      if (mode === "test") {
        setFeedback({ ok: true, message: "Email de test envoyé à ton adresse." });
      } else {
        setFeedback({ ok: true, message: `Campagne envoyée à ${data.sent} adhérent(s).` });
        setConfirmOpen(false);
      }
    } catch (err) {
      setFeedback({ ok: false, message: err instanceof Error ? err.message : "Erreur d'envoi" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Marketing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Envoie de beaux emails HTML à tes adhérents : nouveautés, promotions, séances de massage...
        </p>
      </div>

      {feedback && (
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm",
            feedback.ok ? "bg-green-500/10 text-green-400 border border-green-500/25" : "bg-red-500/10 text-red-400 border border-red-500/25"
          )}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Form */}
        <Card className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Type de campagne
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(MARKETING_CAMPAIGN_TYPES) as MarketingCampaignType[]).map((t) => {
                const meta = MARKETING_CAMPAIGN_TYPES[t];
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-semibold transition-all",
                      active
                        ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]"
                        : "border-[#2d2b40] text-gray-500 hover:text-gray-300 hover:border-[#3d3a58]"
                    )}
                  >
                    <span className="text-lg">{meta.emoji}</span>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Input label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Nouveaux créneaux de massage disponibles !" />

          <Input label="Accroche (optionnel)" value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Ex : on a une bonne nouvelle pour toi." />

          <Textarea
            label="Message"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Rédige ton message ici. Laisse une ligne vide pour créer un nouveau paragraphe."
            rows={6}
          />

          <Input label="Image (URL, optionnel)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Code promo (optionnel)" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Ex : ETE10" />
            <Input label="Valable jusqu'au (optionnel)" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} placeholder="Ex : 31 août" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Texte du bouton" value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
            <Input label="Lien du bouton" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} />
          </div>

          <Input
            label="Objet de l'email"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setSubjectTouched(true);
            }}
          />

          <div className="pt-2 border-t border-[#2d2b40] space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users size={15} />
              {recipientCount === null ? "..." : `${recipientCount} adhérent(s) recevront cette campagne`}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => sendCampaign("test")} loading={sendingTest} disabled={!isValid}>
                <Mail size={16} /> M&apos;envoyer un test
              </Button>
              <Button onClick={() => setConfirmOpen(true)} disabled={!isValid || !recipientCount}>
                <Send size={16} /> Envoyer à tous les adhérents
              </Button>
            </div>
          </div>
        </Card>

        {/* Preview */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aperçu</span>
            <Badge variant="gray">Rendu réel de l&apos;email</Badge>
          </div>
          <div className="rounded-xl overflow-hidden border border-[#2d2b40]" style={{ height: 640 }}>
            <iframe title="Aperçu de l'email" srcDoc={previewHtml} className="w-full h-full bg-black" sandbox="" />
          </div>
        </Card>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmer l'envoi" size="sm">
        <p className="text-sm text-gray-300 mb-4">
          Cet email va être envoyé à <strong className="text-white">{recipientCount} adhérent(s)</strong>. Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)}>
            Annuler
          </Button>
          <Button className="flex-1" onClick={() => sendCampaign("send")} loading={sending}>
            Confirmer l&apos;envoi
          </Button>
        </div>
      </Modal>
    </div>
  );
}

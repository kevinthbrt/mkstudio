"use client";

import { useEffect, useState } from "react";
import { Mail, Send, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";

interface Preview {
  subject: string;
  html: string;
  recipients: number;
  announcedAt: string | null;
  shopEnabled: boolean;
  saleOpen: boolean;
  itemCount: number;
}

/**
 * Fenêtre d'envoi de l'email d'ouverture de la vente : aperçu réel de l'email,
 * envoi de test à l'admin, puis envoi unique à tous les adhérents.
 */
export function AnnounceModal({
  saleId,
  onClose,
  onSent,
}: {
  saleId: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<"test" | "send" | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/boutique/${saleId}/announce`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.ok) setPreview(data);
        else setLoadError(data.error || "L'aperçu n'a pas pu être chargé.");
      })
      .catch(() => active && setLoadError("L'aperçu n'a pas pu être chargé."));
    return () => {
      active = false;
    };
  }, [saleId]);

  async function send(mode: "test" | "send") {
    if (mode === "send" && preview) {
      const ok = window.confirm(
        `Envoyer l'annonce à ${preview.recipients} adhérent${preview.recipients > 1 ? "s" : ""} ? L'envoi ne peut se faire qu'une fois.`
      );
      if (!ok) return;
    }
    setBusy(mode);
    setMessage(null);
    const res = await fetch(`/api/admin/boutique/${saleId}/announce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);

    if (!res.ok) {
      setMessage({ kind: "error", text: data.error || "L'envoi a échoué." });
      return;
    }
    if (mode === "test") {
      setMessage({ kind: "ok", text: `Email de test envoyé à ${data.to}.` });
      return;
    }
    setMessage({
      kind: "ok",
      text:
        data.sent === data.total
          ? `Annonce envoyée à ${data.sent} adhérent${data.sent > 1 ? "s" : ""}.`
          : `Annonce envoyée à ${data.sent} adhérents sur ${data.total} : une partie de l'envoi a échoué.`,
    });
    setSent(true);
    onSent();
  }

  const blocker = !preview
    ? null
    : preview.announcedAt && !sent
    ? `Cette vente a déjà été annoncée le ${formatDateTime(preview.announcedAt)}.`
    : !preview.shopEnabled
    ? "La boutique est désactivée : activez-la (page Boutique) avant de prévenir les adhérents, sinon ils ne verront rien en cliquant."
    : !preview.saleOpen
    ? "La vente n'est pas ouverte aux commandes."
    : preview.itemCount === 0
    ? "Ajoutez au moins un article avant d'annoncer la vente."
    : null;

  return (
    <Modal open onClose={onClose} title="Prévenir les adhérents" size="xl">
      {loadError ? (
        <p className="text-sm text-red-400">{loadError}</p>
      ) : !preview ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="flex items-center gap-2 text-gray-300">
              <Mail size={15} className="text-[#D4AF37]" />
              {preview.subject}
            </span>
            <span className="flex items-center gap-2 text-gray-400">
              <Users size={15} className="text-[#D4AF37]" />
              {preview.recipients} destinataire{preview.recipients > 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Envoyé aux adhérents qui acceptent les emails promotionnels (hors comptes de test), avec un lien de
            désinscription. Aperçu ci-dessous avec votre prénom.
          </p>

          <iframe
            title="Aperçu de l'email"
            srcDoc={preview.html}
            sandbox=""
            className="h-[420px] w-full rounded-xl border border-white/10 bg-[#0a0a0a]"
          />

          {blocker && (
            <p className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-sm text-orange-300">
              {blocker}
            </p>
          )}
          {message && (
            <p
              className={
                message.kind === "ok"
                  ? "rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-300"
                  : "rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              }
            >
              {message.text}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <Button variant="outline" className="sm:flex-1" onClick={onClose}>
              {sent ? "Fermer" : "Plus tard"}
            </Button>
            <Button variant="outline" className="sm:flex-1" loading={busy === "test"} disabled={busy !== null} onClick={() => send("test")}>
              <Mail size={15} />
              M&apos;envoyer un test
            </Button>
            <Button
              className="sm:flex-1"
              loading={busy === "send"}
              disabled={busy !== null || Boolean(blocker) || sent}
              onClick={() => send("send")}
            >
              <Send size={15} />
              Envoyer à {preview.recipients} adhérent{preview.recipients > 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

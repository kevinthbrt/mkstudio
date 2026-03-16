"use client";

import { useState, useRef } from "react";
import { ScrollText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CharterModalProps {
  onAccept: () => void;
}

const CHARTER_SECTIONS = [
  {
    title: "1. Inscription et accès",
    items: [
      "L'accès aux cours et aux installations de MK Studio est réservé aux adhérents inscrits sur le site.",
      "En créant un compte, vous vous engagez à respecter l'ensemble des règles décrites dans la présente charte.",
      "Toute inscription vaut acceptation de cette charte.",
    ],
  },
  {
    title: "2. Réservation et annulation",
    items: [
      "Les réservations de cours se font directement depuis votre espace personnel sur le site MK Studio.",
      "Pour les cours individuels (solo) et duo : l'annulation doit être effectuée au minimum 24 heures avant l'heure du cours. Passé ce délai, la séance sera décomptée de votre solde.",
      "Pour les cours collectifs : le délai d'annulation est indiqué lors de la réservation. Passé ce délai, la séance sera décomptée de votre solde.",
      "En cas d'absence sans annulation préalable dans les délais, la séance est considérée comme consommée et ne sera ni remboursée ni reportée.",
    ],
  },
  {
    title: "3. Ponctualité",
    items: [
      "Merci d'arriver au moins 5 minutes avant le début de votre cours.",
      "Par respect pour le coach et les autres participants, tout retard de plus de 10 minutes pourra entraîner un refus d'accès au cours. La séance sera alors considérée comme consommée.",
    ],
  },
  {
    title: "4. Tenue et hygiène",
    items: [
      "Une tenue de sport propre et adaptée est obligatoire pour accéder aux cours.",
      "Les chaussures de sport propres (exclusivement réservées à l'intérieur) sont obligatoires. Les chaussures d'extérieur ou salissantes ne sont pas autorisées sur les tapis et équipements.",
      "Chaque adhérent doit apporter sa propre serviette pour des raisons d'hygiène. L'utilisation d'une serviette est obligatoire sur les machines et les tapis.",
    ],
  },
  {
    title: "5. Accès à l'espace sportif et aux machines",
    items: [
      "L'accès à l'espace sportif et aux machines se fait uniquement en présence du coach. Il est strictement interdit d'utiliser une machine sans la présence ou l'accord préalable du coach.",
      "Le matériel mis à disposition doit être utilisé correctement et rangé après chaque utilisation.",
      "Merci de nettoyer le matériel après usage (tapis, machines, accessoires).",
      "Toute dégradation volontaire du matériel ou des locaux pourra entraîner des frais de réparation à la charge de l'adhérent.",
    ],
  },
  {
    title: "6. Rangement des affaires personnelles",
    items: [
      "Chaque adhérent doit veiller au rangement de ses propres affaires. Des rangements sont mis à disposition à l'entrée de la salle.",
      "Merci de ne pas laisser traîner vos affaires sur les chaises et fauteuils réservés à l'attente des autres adhérents.",
    ],
  },
  {
    title: "7. Respect et savoir-vivre",
    items: [
      "Un comportement respectueux envers le coach, le personnel et les autres adhérents est exigé en toutes circonstances.",
      "Le volume sonore des conversations et appareils doit rester raisonnable.",
      "Tout comportement inapproprié, agressif ou irrespectueux pourra entraîner une exclusion immédiate et définitive, sans remboursement.",
    ],
  },
  {
    title: "8. Responsabilité et santé",
    items: [
      "Chaque adhérent pratique sous sa propre responsabilité. Il est recommandé de consulter un médecin avant de débuter toute activité sportive.",
      "En cas de problème de santé, blessure ou condition particulière, merci d'en informer votre coach avant le début du cours.",
      "MK Studio décline toute responsabilité en cas de blessure résultant d'une pratique non encadrée ou du non-respect des consignes.",
    ],
  },
  {
    title: "9. Objets personnels",
    items: [
      "MK Studio ne peut être tenu responsable de la perte ou du vol d'objets personnels au sein de l'établissement.",
      "Merci de ne pas laisser d'objets de valeur sans surveillance.",
    ],
  },
];

export function CharterModal({ onAccept }: CharterModalProps) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 40) {
      setScrolledToBottom(true);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#111111] border border-[#1f1f1f] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#1f1f1f] shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
              <ScrollText size={20} className="text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Charte MK Studio</h2>
              <p className="text-xs text-gray-500">Merci de lire et accepter avant de continuer</p>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          <p className="text-sm text-gray-400 leading-relaxed">
            Bienvenue chez MK Studio ! Afin de garantir une expérience agréable pour tous, nous vous demandons de prendre connaissance et d'accepter les règles suivantes.
          </p>

          {CHARTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-[#D4AF37] mb-2">{section.title}</h3>
              <ul className="space-y-1.5">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-gray-300 leading-relaxed flex gap-2">
                    <span className="text-[#D4AF37]/60 mt-1 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        {!scrolledToBottom && (
          <div className="absolute bottom-[88px] left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
              <ChevronDown size={14} className="text-gray-400 animate-bounce" />
              <span className="text-xs text-gray-400">Défiler pour lire la suite</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-[#1f1f1f] shrink-0 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              disabled={!scrolledToBottom}
              className="mt-0.5 w-4 h-4 rounded border-[#2a2a2a] bg-[#0d0d0d] text-[#D4AF37] focus:ring-[#D4AF37]/50 focus:ring-offset-0 disabled:opacity-40"
            />
            <span className={`text-sm leading-relaxed ${scrolledToBottom ? "text-gray-300" : "text-gray-600"}`}>
              J'ai lu et j'accepte la charte MK Studio. Je m'engage à respecter l'ensemble de ces règles.
            </span>
          </label>

          <Button
            onClick={onAccept}
            disabled={!accepted}
            className="w-full"
            size="lg"
          >
            Accepter et continuer
          </Button>
        </div>
      </div>
    </div>
  );
}

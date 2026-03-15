"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type Platform = "ios" | "android" | null;

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function PWAInstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((window.navigator as any).standalone === true) return;

    // Dismissed recently
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < DISMISS_TTL_MS) return;

    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /Android/.test(ua);

    if (isIOS) {
      // Only show in Safari (not Chrome iOS, Firefox iOS, etc.)
      const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
      if (isSafari) {
        setPlatform("ios");
        setShow(true);
      }
    } else if (isAndroid) {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setPlatform("android");
        setShow(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      setShow(false);
    }
    setDeferredPrompt(null);
  }

  if (!show || !platform) return null;

  return (
    <div className="lg:hidden fixed bottom-[76px] left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div
        className="bg-[#111111] border border-[#D4AF37]/30 rounded-2xl p-4 shadow-[0_8px_40px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-start gap-3">
          {/* App icon */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E8C84A] to-[#B8941E] flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(212,175,55,0.3)]">
            <span className="text-black font-black text-sm">MK</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">
              Installer MK Studio
            </p>

            {platform === "ios" ? (
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                Appuyez sur{" "}
                <span className="inline-flex items-center gap-0.5 text-white font-medium">
                  <IosShareIcon />
                  Partager
                </span>
                {" "}puis{" "}
                <span className="text-white font-medium">« Sur l&apos;écran d&apos;accueil »</span>
                {" "}pour recevoir les notifications et accéder à l&apos;app rapidement.
              </p>
            ) : (
              <>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Ajoutez l&apos;app sur votre écran d&apos;accueil pour accéder rapidement et recevoir les notifications.
                </p>
                <button
                  onClick={install}
                  className="mt-2.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-black text-xs font-bold transition-opacity hover:opacity-90"
                >
                  Installer
                </button>
              </>
            )}
          </div>

          <button
            onClick={dismiss}
            className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0 p-0.5 mt-0.5"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function IosShareIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block mx-0.5 -mt-0.5"
    >
      <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

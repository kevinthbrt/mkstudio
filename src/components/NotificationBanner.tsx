"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

export function NotificationBanner() {
  const [state, setState] = useState<"loading" | "hidden" | "prompt" | "subscribed">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("hidden");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "subscribed" : "prompt");
    }).catch(() => setState("hidden"));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      setState("subscribed");
    } catch {
      setState("hidden");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading" || state === "hidden" || state === "subscribed") return null;

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{
        background: "linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.03) 100%)",
        border: "1px solid rgba(212,175,55,0.2)",
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(212,175,55,0.12)" }}
      >
        <Bell size={16} className="text-[#D4AF37]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold">Activez les notifications</p>
        <p className="text-gray-500 text-xs mt-0.5">
          Recevez vos rappels de séances et confirmations en temps réel.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={enable}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
          style={{ background: "#D4AF37", color: "#0a0a0a" }}
        >
          {busy ? "..." : "Activer"}
        </button>
        <button
          onClick={() => setState("hidden")}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

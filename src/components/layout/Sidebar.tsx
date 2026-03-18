"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  CreditCard,
  Home,
  LogOut,
  Package,
  Settings,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
// Package and CreditCard kept for admin nav
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
}

const memberNav: NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: <Home size={18} /> },
  { href: "/dashboard/planning", label: "Planning", icon: <Calendar size={18} /> },
  { href: "/dashboard/sessions", label: "Mes séances", shortLabel: "Séances", icon: <BarChart3 size={18} /> },
  { href: "/dashboard/achievements", label: "Badges & Niveau", shortLabel: "Badges", icon: <Trophy size={18} /> },
  { href: "/dashboard/purchases", label: "Achats & Factures", shortLabel: "Achats", icon: <CreditCard size={18} /> },
  { href: "/dashboard/profile", label: "Mon profil", shortLabel: "Profil", icon: <User size={18} /> },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Accueil", icon: <Home size={18} /> },
  { href: "/admin/planning", label: "Planning", icon: <Calendar size={18} /> },
  { href: "/admin/members", label: "Adhérents", icon: <Users size={18} /> },
  { href: "/admin/products", label: "Produits", icon: <Package size={18} /> },
  { href: "/admin/orders", label: "Ventes", icon: <CreditCard size={18} /> },
  { href: "/admin/settings", label: "Paramètres", icon: <Settings size={18} /> },
];

interface SidebarProps {
  role: "admin" | "member";
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === "admin" ? adminNav : memberNav;

  async function handleSignOut() {
    // Remove push subscription for this device before logging out
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/notifications/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
      }
    } catch {
      // Ignore errors — sign out regardless
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen fixed left-0 top-0 z-40"
      style={{ background: "linear-gradient(180deg, #0b0a12 0%, #0e0d16 100%)" }}
    >
      {/* Subtle top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />

      {/* Logo */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E8C84A] to-[#B8941E] flex items-center justify-center shadow-[0_4px_16px_rgba(212,175,55,0.4)]">
              <span className="text-black font-black text-sm tracking-tight">MK</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-white text-sm tracking-tight">MK Studio</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">
              {role === "admin" ? "Administration" : "Espace adhérent"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-widest px-3 mb-2">
          Navigation
        </p>
        {nav.map((item) => {
          const isActive =
            item.href === "/admin" || item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 text-[#D4AF37] border border-[#D4AF37]/20 shadow-[inset_0_1px_0_rgba(212,175,55,0.1)]"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/4"
              )}
            >
              <span className={isActive ? "text-[#D4AF37]" : "text-gray-600"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 space-y-1 border-t border-white/5">
        <div className="px-3 py-2.5 rounded-xl bg-white/3">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">Connecté en tant que</p>
          <p className="text-sm font-semibold text-white truncate mt-0.5">{userName}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

// Mobile bottom navigation
export function BottomNav({ role }: { role: "admin" | "member" }) {
  const pathname = usePathname();

  if (role === "member") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [accountOpen, setAccountOpen] = useState(false);

    // Close on route change
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => { setAccountOpen(false); }, [pathname]);

    // 2 left | Réserver (center) | 1 right + Compte
    const leftItems = [memberNav[0], memberNav[2]]; // Accueil, Séances
    const rightItems = [memberNav[3]];              // Badges

    const isAccountActive =
      pathname.startsWith("/dashboard/purchases") || pathname.startsWith("/dashboard/profile");

    return (
      <>
        {/* Account popup menu */}
        {accountOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40"
            onClick={() => setAccountOpen(false)}
          >
            <div
              className="absolute right-2 w-48 rounded-2xl overflow-hidden"
              style={{
                bottom: "calc(5rem + env(safe-area-inset-bottom) + 8px)",
                background: "linear-gradient(180deg, #16152a 0%, #0e0d16 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <User size={16} className="text-gray-500" />
                Mon profil
              </Link>
              <div className="h-px bg-white/5" />
              <Link
                href="/dashboard/purchases"
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <CreditCard size={16} className="text-gray-500" />
                Achats & Factures
              </Link>
            </div>
          </div>
        )}

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom"
          style={{ background: "linear-gradient(0deg, #0b0a12 0%, rgba(11,10,18,0.98) 100%)" }}
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          <div className="flex items-center px-1">
            {/* Left 2 items: Accueil, Séances */}
            {leftItems.map((item) => {
              const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 px-1 text-[10px] font-semibold transition-all duration-150 rounded-xl my-1",
                    isActive ? "text-[#D4AF37]" : "text-gray-700 hover:text-gray-400"
                  )}
                >
                  <span className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                    isActive
                      ? "bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_2px_12px_rgba(212,175,55,0.2)]"
                      : "text-gray-600"
                  )}>
                    {item.icon}
                  </span>
                  <span className="leading-none">{item.shortLabel ?? item.label}</span>
                </Link>
              );
            })}

            {/* Central Réserver button */}
            <div className="flex-1 flex flex-col items-center justify-center py-1">
              <Link
                href="/dashboard/planning"
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-150",
                  pathname.startsWith("/dashboard/planning") ? "opacity-100" : "opacity-90 hover:opacity-100"
                )}
              >
                <span
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(212,175,55,0.45)] -mt-4"
                  style={{
                    background: pathname.startsWith("/dashboard/planning")
                      ? "linear-gradient(135deg, #E8C84A 0%, #B8941E 100%)"
                      : "linear-gradient(135deg, #D4AF37 0%, #A8861A 100%)",
                  }}
                >
                  <Calendar size={22} className="text-black" />
                </span>
                <span className="text-[10px] font-bold text-[#D4AF37] leading-none mt-0.5">Réserver</span>
              </Link>
            </div>

            {/* Right item: Badges */}
            {rightItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 px-1 text-[10px] font-semibold transition-all duration-150 rounded-xl my-1",
                    isActive ? "text-[#D4AF37]" : "text-gray-700 hover:text-gray-400"
                  )}
                >
                  <span className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                    isActive
                      ? "bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_2px_12px_rgba(212,175,55,0.2)]"
                      : "text-gray-600"
                  )}>
                    {item.icon}
                  </span>
                  <span className="leading-none">{item.shortLabel ?? item.label}</span>
                </Link>
              );
            })}

            {/* Compte button (Profil + Achats) */}
            <button
              onClick={() => setAccountOpen((v) => !v)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 px-1 text-[10px] font-semibold transition-all duration-150 rounded-xl my-1",
                isAccountActive || accountOpen ? "text-[#D4AF37]" : "text-gray-700"
              )}
            >
              <span className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                isAccountActive || accountOpen
                  ? "bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_2px_12px_rgba(212,175,55,0.2)]"
                  : "text-gray-600"
              )}>
                <User size={18} />
              </span>
              <span className="leading-none">Compte</span>
            </button>
          </div>
        </nav>
      </>
    );
  }

  // Admin nav
  const nav = adminNav;
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{ background: "linear-gradient(0deg, #0b0a12 0%, rgba(11,10,18,0.98) 100%)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      <div className="flex items-center px-1">
        {nav.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 px-1 text-[10px] font-semibold transition-all duration-150 rounded-xl my-1",
                isActive ? "text-[#D4AF37]" : "text-gray-700 hover:text-gray-400"
              )}
            >
              <span className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                isActive
                  ? "bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_2px_12px_rgba(212,175,55,0.2)]"
                  : "text-gray-600"
              )}>
                {item.icon}
              </span>
              <span className="leading-none truncate">{item.shortLabel ?? item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Mobile header
export function MobileHeader({ title, role, userName }: { title: string; role: "admin" | "member"; userName: string }) {
  const router = useRouter();

  async function handleSignOut() {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/notifications/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
      }
    } catch {
      // Ignore errors — sign out regardless
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="lg:hidden sticky top-0 z-30 px-4 py-3"
      style={{ background: "linear-gradient(180deg, rgba(14,13,20,0.98) 0%, rgba(14,13,20,0.95) 100%)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E8C84A] to-[#B8941E] flex items-center justify-center shadow-[0_2px_10px_rgba(212,175,55,0.35)]">
            <span className="text-black font-black text-xs">MK</span>
          </div>
          <span className="font-bold text-white text-sm">{title}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

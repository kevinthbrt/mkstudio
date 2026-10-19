"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CreditCard,
  Home,
  LayoutGrid,
  LogOut,
  Mail,
  Package,
  Settings,
  ShoppingBag,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isShopLive, type ShopStatus } from "@/lib/merch";

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
}

const BOUTIQUE_MEMBER: NavItem = { href: "/dashboard/boutique", label: "Boutique", icon: <ShoppingBag size={18} /> };
const BADGES: NavItem = { href: "/dashboard/achievements", label: "Badges & Niveau", shortLabel: "Badges", icon: <Trophy size={18} /> };

const memberNav: NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: <Home size={18} /> },
  { href: "/dashboard/planning", label: "Planning", icon: <Calendar size={18} /> },
  { href: "/dashboard/sessions", label: "Mes séances", shortLabel: "Séances", icon: <BarChart3 size={18} /> },
  BADGES,
  { href: "/dashboard/purchases", label: "Achats & Factures", shortLabel: "Achats", icon: <CreditCard size={18} /> },
  BOUTIQUE_MEMBER,
  { href: "/dashboard/profile", label: "Mon profil", shortLabel: "Profil", icon: <User size={18} /> },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Accueil", icon: <Home size={18} /> },
  { href: "/admin/planning", label: "Planning", icon: <Calendar size={18} /> },
  { href: "/admin/members", label: "Adhérents", icon: <Users size={18} /> },
  { href: "/admin/orders", label: "Ventes", icon: <CreditCard size={18} /> },
  { href: "/admin/boutique", label: "Boutique", icon: <ShoppingBag size={18} /> },
  { href: "/admin/products", label: "Produits", icon: <Package size={18} /> },
  { href: "/admin/marketing", label: "Marketing", icon: <Mail size={18} /> },
  { href: "/admin/comptabilite", label: "Comptabilité", shortLabel: "Compta", icon: <BookOpen size={18} /> },
  { href: "/admin/settings", label: "Paramètres", icon: <Settings size={18} /> },
];

/** Sur mobile, l'admin garde 4 onglets ; le reste passe dans « Plus ». */
const ADMIN_PRIMARY_COUNT = 4;

function isActivePath(pathname: string, href: string): boolean {
  return href === "/admin" || href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

/** Pastille dorée animée signalant la boutique éphémère en cours. */
function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("flex h-2 w-2", className)}>
      <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-[#E8C84A] opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E8C84A]" />
    </span>
  );
}

async function signOut(router: ReturnType<typeof useRouter>) {
  // Retire l'abonnement push de cet appareil avant de se déconnecter.
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
    // On se déconnecte quoi qu'il arrive.
  }
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push("/login");
}

interface SidebarProps {
  role: "admin" | "member";
  userName: string;
  shop?: ShopStatus | null;
}

export function Sidebar({ role, userName, shop = null }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const live = isShopLive(shop);
  const nav =
    role === "admin"
      ? adminNav
      : memberNav.filter((item) => item.href !== BOUTIQUE_MEMBER.href || shop?.enabled);

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
          const isActive = isActivePath(pathname, item.href);
          const isBoutique = item.href.endsWith("/boutique");
          const highlight = isBoutique && live && !isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 text-[#D4AF37] border border-[#D4AF37]/20 shadow-[inset_0_1px_0_rgba(212,175,55,0.1)]"
                  : highlight
                  ? "border border-[#D4AF37]/25 bg-[#D4AF37]/[0.07] text-[#E8C84A] hover:bg-[#D4AF37]/[0.12]"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/4"
              )}
            >
              <span className={isActive || highlight ? "text-[#D4AF37]" : "text-gray-600"}>
                {item.icon}
              </span>
              {item.label}
              {isBoutique && live && (
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E8C84A]">
                  <LiveDot className="relative" />
                  En cours
                </span>
              )}
              {isBoutique && role === "admin" && !live && shop?.enabled && (
                <span className="ml-auto rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                  Activée
                </span>
              )}
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
          onClick={() => signOut(router)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

// ─── Navigation mobile ───────────────────────────────────────────────────────

const bottomNavStyle = { background: "linear-gradient(0deg, #0b0a12 0%, rgba(11,10,18,0.98) 100%)" };
const popupStyle = {
  bottom: "calc(5rem + env(safe-area-inset-bottom) + 8px)",
  background: "linear-gradient(180deg, #16152a 0%, #0e0d16 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
};

function BottomTab({
  href,
  label,
  icon,
  active,
  live,
  onClick,
}: {
  href?: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  live?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "flex-1 flex flex-col items-center gap-1 py-3 px-1 text-[10px] font-semibold transition-all duration-150 rounded-xl my-1 min-w-0",
    active || live ? "text-[#D4AF37]" : "text-gray-700 hover:text-gray-400"
  );
  const content = (
    <>
      <span
        className={cn(
          "relative w-9 h-9 rounded-xl flex items-center justify-center transition-all",
          active
            ? "bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_2px_12px_rgba(212,175,55,0.2)]"
            : live
            ? "bg-[#D4AF37]/10 text-[#E8C84A] ring-1 ring-[#D4AF37]/40 shadow-[0_0_16px_rgba(212,175,55,0.35)]"
            : "text-gray-600"
        )}
      >
        {icon}
        {live && <LiveDot className="absolute -right-0.5 -top-0.5" />}
      </span>
      <span className="leading-none truncate max-w-full">{label}</span>
    </>
  );

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function MemberBottomNav({ shop }: { shop: ShopStatus | null }) {
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  const live = isShopLive(shop);

  // Pendant une vente éphémère, la boutique prend la place des badges dans la
  // barre ; les badges passent dans le menu « Compte ».
  const leftItems = [memberNav[0], memberNav[2]]; // Accueil, Séances
  const rightItem = live ? BOUTIQUE_MEMBER : BADGES;
  const accountItems: NavItem[] = [
    { href: "/dashboard/profile", label: "Mon profil", icon: <User size={16} /> },
    { href: "/dashboard/purchases", label: "Achats & Factures", icon: <CreditCard size={16} /> },
  ];
  if (live) accountItems.push({ ...BADGES, icon: <Trophy size={16} /> });
  else if (shop?.enabled) accountItems.push({ ...BOUTIQUE_MEMBER, icon: <ShoppingBag size={16} /> });

  const isAccountActive = accountItems.some((item) => pathname.startsWith(item.href));
  const planningActive = pathname.startsWith("/dashboard/planning");

  return (
    <>
      {accountOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setAccountOpen(false)}>
          <div
            className="absolute right-2 w-52 rounded-2xl overflow-hidden"
            style={popupStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {accountItems.map((item, i) => (
              <div key={item.href}>
                {i > 0 && <div className="h-px bg-white/5" />}
                <Link
                  href={item.href}
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span className="text-gray-500">{item.icon}</span>
                  {item.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom" style={bottomNavStyle}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="flex items-center px-1">
          {leftItems.map((item) => (
            <BottomTab
              key={item.href}
              href={item.href}
              label={item.shortLabel ?? item.label}
              icon={item.icon}
              active={isActivePath(pathname, item.href)}
            />
          ))}

          {/* Bouton central Réserver */}
          <div className="flex-1 flex flex-col items-center justify-center py-1">
            <Link
              href="/dashboard/planning"
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-150",
                planningActive ? "opacity-100" : "opacity-90 hover:opacity-100"
              )}
            >
              <span
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(212,175,55,0.45)] -mt-4"
                style={{
                  background: planningActive
                    ? "linear-gradient(135deg, #E8C84A 0%, #B8941E 100%)"
                    : "linear-gradient(135deg, #D4AF37 0%, #A8861A 100%)",
                }}
              >
                <Calendar size={22} className="text-black" />
              </span>
              <span className="text-[10px] font-bold text-[#D4AF37] leading-none mt-0.5">Réserver</span>
            </Link>
          </div>

          <BottomTab
            href={rightItem.href}
            label={rightItem.shortLabel ?? rightItem.label}
            icon={rightItem.icon}
            active={isActivePath(pathname, rightItem.href)}
            live={live && rightItem === BOUTIQUE_MEMBER && !isActivePath(pathname, rightItem.href)}
          />

          <BottomTab
            label="Compte"
            icon={<User size={18} />}
            active={isAccountActive || accountOpen}
            onClick={() => setAccountOpen((v) => !v)}
          />
        </div>
      </nav>
    </>
  );
}

function AdminBottomNav({ shop }: { shop: ShopStatus | null }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const live = isShopLive(shop);

  const primary = adminNav.slice(0, ADMIN_PRIMARY_COUNT);
  const more = adminNav.slice(ADMIN_PRIMARY_COUNT);
  const moreActive = more.some((item) => isActivePath(pathname, item.href));

  return (
    <>
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute inset-x-2 rounded-2xl p-2"
            style={popupStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-1">
              {more.map((item) => {
                const active = isActivePath(pathname, item.href);
                const boutiqueLive = item.href === "/admin/boutique" && live;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-xl px-2 py-4 text-xs font-semibold transition-colors",
                      active ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "text-gray-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="relative">
                      {item.icon}
                      {boutiqueLive && <LiveDot className="absolute -right-1.5 -top-1" />}
                    </span>
                    {item.shortLabel ?? item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom" style={bottomNavStyle}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="flex items-center px-1">
          {primary.map((item) => (
            <BottomTab
              key={item.href}
              href={item.href}
              label={item.shortLabel ?? item.label}
              icon={item.icon}
              active={isActivePath(pathname, item.href)}
            />
          ))}
          <BottomTab
            label="Plus"
            icon={<LayoutGrid size={18} />}
            active={moreActive || moreOpen}
            live={live && !moreActive && !moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          />
        </div>
      </nav>
    </>
  );
}

export function BottomNav({ role, shop = null }: { role: "admin" | "member"; shop?: ShopStatus | null }) {
  return role === "admin" ? <AdminBottomNav shop={shop} /> : <MemberBottomNav shop={shop} />;
}

// Mobile header
export function MobileHeader({ title }: { title: string; role: "admin" | "member"; userName: string }) {
  const router = useRouter();

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
          onClick={() => signOut(router)}
          aria-label="Se déconnecter"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

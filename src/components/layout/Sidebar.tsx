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
  User,
  Users,
} from "lucide-react";
// Package and CreditCard kept for admin nav
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const memberNav: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: <Home size={18} /> },
  { href: "/dashboard/planning", label: "Planning", icon: <Calendar size={18} /> },
  { href: "/dashboard/sessions", label: "Mes séances", icon: <BarChart3 size={18} /> },
  { href: "/dashboard/profile", label: "Mon profil", icon: <User size={18} /> },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Tableau de bord", icon: <Home size={18} /> },
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
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0d0d0d] border-r border-[#1f1f1f] min-h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center">
            <span className="text-black font-bold text-sm">MK</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm">MK Studio</p>
            <p className="text-xs text-gray-500 capitalize">{role === "admin" ? "Administration" : "Espace adhérent"}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[rgba(212,175,55,0.1)] text-[#D4AF37] border border-[rgba(212,175,55,0.2)]"
                  : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-[#1f1f1f] space-y-1">
        <div className="px-3 py-2 rounded-lg bg-[#1a1a1a]">
          <p className="text-xs text-gray-500">Connecté en tant que</p>
          <p className="text-sm font-medium text-white truncate">{userName}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-[#1a1a1a] transition-all duration-150"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

// Mobile bottom navigation
export function BottomNav({ role }: { role: "admin" | "member" }) {
  const pathname = usePathname();
  const nav = role === "admin"
    ? adminNav.slice(0, 5)
    : memberNav.slice(0, 5);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-[#1f1f1f] z-40 safe-bottom">
      <div className="flex items-center">
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
                "flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
                isActive ? "text-[#D4AF37]" : "text-gray-600"
              )}
            >
              <span className={cn("transition-transform", isActive && "scale-110")}>
                {item.icon}
              </span>
              <span className="leading-none">{item.label.split(" ")[0]}</span>
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
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="lg:hidden sticky top-0 bg-[#0d0d0d]/95 backdrop-blur-sm border-b border-[#1f1f1f] z-30 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center">
            <span className="text-black font-bold text-xs">MK</span>
          </div>
          <span className="font-semibold text-white text-sm">{title}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-[#1a1a1a] transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

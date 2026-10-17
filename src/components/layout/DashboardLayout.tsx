import { BottomNav, MobileHeader, Sidebar } from "./Sidebar";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ShopBanner } from "@/components/boutique/ShopBanner";
import type { ShopStatus } from "@/lib/merch";
import type { Profile } from "@/types/database";

interface DashboardLayoutProps {
  children: React.ReactNode;
  profile: Profile;
  title: string;
  /** État de la boutique éphémère (navigation et bandeau). */
  shop?: ShopStatus | null;
}

export function DashboardLayout({ children, profile, title, shop = null }: DashboardLayoutProps) {
  const userName = `${profile.first_name} ${profile.last_name}`;

  return (
    <div className="min-h-screen bg-[#0e0d14]">
      <Sidebar role={profile.role} userName={userName} shop={shop} />
      <MobileHeader title={title} role={profile.role} userName={userName} />

      <main className="lg:ml-64 pb-20 lg:pb-0">
        {profile.role === "member" && <ShopBanner shop={shop} />}
        {children}
      </main>

      <BottomNav role={profile.role} shop={shop} />
      <PWAInstallPrompt />
    </div>
  );
}

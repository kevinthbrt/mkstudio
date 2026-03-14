import { BottomNav, MobileHeader, Sidebar } from "./Sidebar";
import type { Profile } from "@/types/database";

interface DashboardLayoutProps {
  children: React.ReactNode;
  profile: Profile;
  title: string;
}

export function DashboardLayout({ children, profile, title }: DashboardLayoutProps) {
  const userName = `${profile.first_name} ${profile.last_name}`;

  return (
    <div className="min-h-screen bg-[#0e0d14]">
      <Sidebar role={profile.role} userName={userName} />
      <MobileHeader title={title} role={profile.role} userName={userName} />

      <main className="lg:ml-64 pb-20 lg:pb-0">
        {children}
      </main>

      <BottomNav role={profile.role} />
    </div>
  );
}

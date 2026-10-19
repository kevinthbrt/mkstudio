import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { fetchShopStatus } from "@/lib/merch";
import { CharterSync } from "@/components/CharterSync";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");

  const shop = await fetchShopStatus(supabase);

  return (
    <DashboardLayout profile={profile} title="MK Studio" shop={shop}>
      <CharterSync />
      {children}
    </DashboardLayout>
  );
}

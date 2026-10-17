import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { fetchShopStatus } from "@/lib/merch";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !profile) redirect("/login");

  if (profile.role !== "admin") redirect("/dashboard");

  const shop = await fetchShopStatus(supabase);

  return (
    <DashboardLayout profile={profile} title="Administration" shop={shop}>
      {children}
    </DashboardLayout>
  );
}

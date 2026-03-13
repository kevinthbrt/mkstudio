import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

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

  // DB not set up yet or profile missing
  if (error || !profile) redirect("/setup");

  if (profile.role !== "admin") redirect("/dashboard");

  return (
    <DashboardLayout profile={profile} title="Administration">
      {children}
    </DashboardLayout>
  );
}

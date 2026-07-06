import type { SupabaseClient } from "@supabase/supabase-js";
import { hasActiveSessionBalance, currentMonthRange } from "./massagePricing";
import type { Database } from "@/types/database";

export async function isEligibleForMassageDiscount(
  adminClient: SupabaseClient<Database>,
  memberId: string
): Promise<boolean> {
  const { data: profile } = await adminClient
    .from("profiles")
    .select("collective_balance, individual_balance, duo_balance")
    .eq("id", memberId)
    .single();

  if (!profile || !hasActiveSessionBalance(profile)) return false;

  const { start, end } = currentMonthRange();
  const { count } = await adminClient
    .from("class_bookings")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("status", "confirmed")
    .eq("massage_discount_applied", true)
    .gte("booked_at", start)
    .lt("booked_at", end);

  return (count ?? 0) === 0;
}

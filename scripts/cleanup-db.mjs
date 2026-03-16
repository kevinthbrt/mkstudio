import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fjzzylksthpnunrqazdg.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqenp5bGtzdGhwbnVucnFhemRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQyMTIwNSwiZXhwIjoyMDg4OTk3MjA1fQ.xBC1fLV9LaQrC3kbPSCBxDdsWathDO4ReVOCXmR4xp4";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("🧹 Nettoyage de la base de données MK Studio...\n");

  // 1. Supprimer toutes les inscriptions
  console.log("📋 Suppression de toutes les inscriptions (class_bookings)...");
  const { error: bookingsError, count: bookingsCount } = await supabase
    .from("class_bookings")
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (bookingsError) {
    console.error("✗ Erreur class_bookings :", bookingsError.message);
    process.exit(1);
  }
  console.log(`✓ ${bookingsCount ?? "?"} inscription(s) supprimée(s)`);

  // 2. Supprimer les sessions individuelles et duo
  console.log("\n🎯 Suppression des cours individuels et duo (class_sessions)...");
  const { error: sessionsError, count: sessionsCount } = await supabase
    .from("class_sessions")
    .delete({ count: "exact" })
    .in("session_type", ["individual", "duo"]);

  if (sessionsError) {
    console.error("✗ Erreur class_sessions :", sessionsError.message);
    process.exit(1);
  }
  console.log(`✓ ${sessionsCount ?? "?"} cours individuel(s)/duo supprimé(s)`);

  // 3. Remettre à zéro les balances
  console.log("\n💳 Remise à zéro des balances de tous les membres...");
  const { error: balancesError, count: balancesCount } = await supabase
    .from("profiles")
    .update(
      { collective_balance: 0, individual_balance: 0, duo_balance: 0 },
      { count: "exact" }
    )
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (balancesError) {
    console.error("✗ Erreur profiles :", balancesError.message);
    process.exit(1);
  }
  console.log(`✓ ${balancesCount ?? "?"} profil(s) mis à jour`);

  console.log("\n✅ Nettoyage terminé !");
}

main();

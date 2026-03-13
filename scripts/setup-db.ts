import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = "https://fjzzylksthpnunrqazdg.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqenp5bGtzdGhwbnVucnFhemRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQyMTIwNSwiZXhwIjoyMDg4OTk3MjA1fQ.xBC1fLV9LaQrC3kbPSCBxDdsWathDO4ReVOCXmR4xp4";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSQL(sql: string, description: string) {
  console.log(`\n▶ ${description}...`);
  const { error } = await supabase.rpc("exec_sql", { query: sql });
  if (error) {
    console.error(`  ✗ Error:`, error.message);
  } else {
    console.log(`  ✓ Success`);
  }
}

async function main() {
  console.log("🚀 Setting up MK Studio database...");

  const migration1 = fs.readFileSync(
    path.join(__dirname, "../supabase/migrations/001_initial_schema.sql"),
    "utf-8"
  );
  const migration2 = fs.readFileSync(
    path.join(__dirname, "../supabase/migrations/002_rpc_functions.sql"),
    "utf-8"
  );

  await runSQL(migration1, "Initial schema");
  await runSQL(migration2, "RPC functions");

  console.log("\n✅ Database setup complete!");
}

main();

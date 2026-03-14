import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
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

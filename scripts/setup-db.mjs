import pg from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqenp5bGtzdGhwbnVucnFhemRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQyMTIwNSwiZXhwIjoyMDg4OTk3MjA1fQ.xBC1fLV9LaQrC3kbPSCBxDdsWathDO4ReVOCXmR4xp4";

const PROJECT_REF = "fjzzylksthpnunrqazdg";

// Try different pooler regions
const REGIONS = [
  "aws-0-eu-west-3",
  "aws-0-eu-west-2",
  "aws-0-eu-central-1",
  "aws-0-us-east-1",
  "aws-0-us-west-2",
];

async function tryConnect(region) {
  const client = new pg.Client({
    host: `${region}.pooler.supabase.com`,
    port: 6543,
    database: "postgres",
    user: `postgres.${PROJECT_REF}`,
    password: SERVICE_ROLE_KEY,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log(`✓ Connected via ${region}`);
    return client;
  } catch (e) {
    await client.end().catch(() => {});
    return null;
  }
}

async function main() {
  console.log("🚀 Setting up MK Studio database...\n");

  let client = null;

  for (const region of REGIONS) {
    process.stdout.write(`Trying ${region}... `);
    client = await tryConnect(region);
    if (client) break;
    console.log("✗");
  }

  if (!client) {
    console.log(
      "\n⚠ Could not connect to database pooler. Please run migrations manually:"
    );
    console.log("1. Go to your Supabase dashboard SQL Editor");
    console.log("2. Run: supabase/migrations/001_initial_schema.sql");
    console.log("3. Run: supabase/migrations/002_rpc_functions.sql");
    process.exit(1);
  }

  try {
    const migration1 = readFileSync(
      join(__dirname, "../supabase/migrations/001_initial_schema.sql"),
      "utf-8"
    );
    const migration2 = readFileSync(
      join(__dirname, "../supabase/migrations/002_rpc_functions.sql"),
      "utf-8"
    );

    console.log("\n📦 Running migration 1 (initial schema)...");
    await client.query(migration1);
    console.log("✓ Schema created");

    console.log("📦 Running migration 2 (RPC functions)...");
    await client.query(migration2);
    console.log("✓ RPC functions created");

    console.log("\n✅ Database setup complete!");
  } catch (error) {
    console.error("\n✗ Migration error:", error.message);
  } finally {
    await client.end();
  }
}

main();

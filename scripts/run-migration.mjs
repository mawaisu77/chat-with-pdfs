import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

import { pgLookup } from "./pg-lookup.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvFile(filename) {
  const filePath = path.join(root, filename);

  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");

    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (value.includes(" #")) {
      value = value.split(" #")[0].trim();
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const databaseUrl = process.env.DATABASE_URL?.trim();

const migrationsDir = path.join(root, "supabase/migrations");
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

function stripSupabaseOnlySql(sql) {
  return sql.replace(/insert into storage\.buckets[\s\S]*?on conflict \(id\) do nothing;/gi, "");
}

const statements = migrationFiles
  .flatMap((file) => stripSupabaseOnlySql(fs.readFileSync(path.join(migrationsDir, file), "utf8")).split(";"))
  .map((statement) => statement.trim())
  .filter(Boolean);

async function connect() {
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL in .env.local");
    console.error("");
    console.error("Add your Neon connection string, e.g.:");
    console.error('DATABASE_URL="postgresql://user:pass@host/neondb?sslmode=require"');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    lookup: pgLookup,
  });

  await client.connect();
  return client;
}

async function main() {
  const client = await connect();

  console.log("Connected to Neon Postgres");

  try {
    for (const statement of statements) {
      try {
        await client.query(`${statement};`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (message.includes("already exists")) {
          continue;
        }

        console.error("Statement failed:", statement.slice(0, 120), "...");
        throw error;
      }
    }

    const { rows } = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('document_sets', 'documents', 'ingestion_jobs', 'chats', 'messages')
      ORDER BY indexname;
    `);

    const { rows: tables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('document_sets', 'documents', 'ingestion_jobs', 'chats', 'messages')
      ORDER BY table_name;
    `);

    console.log("Migration complete.");
    console.log("Tables:", tables.map((row) => row.table_name).join(", "));
    console.log("Indexes:", rows.map((row) => row.indexname).join(", "));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});

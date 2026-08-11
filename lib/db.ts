import pg from "pg";

import { env } from "@/lib/env";
import { pgLookup } from "@/lib/pg-lookup";
import { RAGError } from "@/lib/errors";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.database.url(),
      ssl: { rejectUnauthorized: false },
      max: 10,
      lookup: pgLookup,
    } as pg.PoolConfig);
  }

  return pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  try {
    return await getPool().query<T>(text, params);
  } catch (error) {
    throw mapDbError(error);
  }
}

export function mapDbError(error: unknown, fallback = "Database request failed."): RAGError {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.toLowerCase().includes("fetch failed") ||
    message.toLowerCase().includes("enotfound") ||
    message.toLowerCase().includes("econnrefused") ||
    message.toLowerCase().includes("timeout") ||
    message.toLowerCase().includes("connection terminated")
  ) {
    return new RAGError(
      'Database is not reachable. Check DATABASE_URL in .env.local and run "npm run db:migrate".',
      "database_unreachable",
      503,
    );
  }

  if (
    (message.includes("relation") && message.includes("does not exist")) ||
    message.toLowerCase().includes("could not find the table")
  ) {
    return new RAGError(
      'Database tables are missing. Run "npm run db:migrate" after setting DATABASE_URL.',
      "database_schema_missing",
      503,
    );
  }

  return new RAGError(message || fallback, "database_error", 500);
}

export async function assertDatabaseConfigured(): Promise<void> {
  env.database.url();
}

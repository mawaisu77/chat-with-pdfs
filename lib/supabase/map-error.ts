import { RAGError } from "@/lib/errors";

const SUPABASE_SETUP_HINT =
  'Supabase is not reachable. Open your Supabase dashboard, confirm the project is active, then update NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local and run "npm run db:migrate".';

function isNetworkError(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("fetch failed") ||
    lower.includes("network") ||
    lower.includes("enotfound") ||
    lower.includes("econnrefused") ||
    lower.includes("timeout") ||
    lower.includes("aborterror") ||
    lower.includes("getaddrinfo")
  );
}

function isMissingTableError(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("relation") && lower.includes("does not exist") ||
    lower.includes('table "document_sets"') ||
    lower.includes("could not find the table")
  );
}

export function mapSupabaseError(error: unknown, fallback = "Database request failed."): RAGError {
  const message = error instanceof Error ? error.message : String(error);

  if (isNetworkError(message)) {
    return new RAGError(SUPABASE_SETUP_HINT, "supabase_unreachable", 503);
  }

  if (isMissingTableError(message)) {
    return new RAGError(
      'Database tables are missing. Run "npm run db:migrate" after configuring Supabase in .env.local.',
      "supabase_schema_missing",
      503,
    );
  }

  if (message.includes("Invalid API key") || message.includes("JWT")) {
    return new RAGError(
      "Invalid Supabase API key. Copy fresh keys from Project Settings → API in the Supabase dashboard.",
      "supabase_auth_error",
      503,
    );
  }

  return new RAGError(message || fallback, "supabase_error", 500);
}

export { SUPABASE_SETUP_HINT };

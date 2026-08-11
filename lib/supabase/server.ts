import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { createFetchWithTimeout } from "@/lib/supabase/fetch";
import type { Database } from "@/lib/supabase/types";

let serviceClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  const url = env.supabase.url();
  const key = env.supabase.serviceRoleKey();

  if (!url || !key) {
    throw new Error("Supabase storage is not configured.");
  }

  if (!serviceClient) {
    serviceClient = createClient<Database>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: createFetchWithTimeout(),
      },
    });
  }

  return serviceClient;
}

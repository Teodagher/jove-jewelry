"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from '@/types/database.types';

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;
let client: BrowserClient | undefined;

export function createClient(): BrowserClient {
  if (client) {
    return client;
  }

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}

// Export a singleton instance for easy importing
export const supabase = createClient();

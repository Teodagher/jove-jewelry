"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from '@/types/database.types';

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;
let client: BrowserClient | undefined;

export function createClient(): BrowserClient {
  if (client) {
    return client;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  client = createBrowserClient<Database>(url, key);

  return client;
}

// Lazy singleton - only create when accessed
let _supabase: BrowserClient | undefined;
export const supabase = new Proxy({} as BrowserClient, {
  get(_, prop) {
    if (!_supabase) {
      _supabase = createClient();
    }
    return (_supabase as any)[prop];
  }
});

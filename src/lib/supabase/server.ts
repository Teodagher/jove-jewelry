import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from '@/types/database.types';

export async function createClient() {
  const cookieStore = await cookies();
  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
      db: {
        // Add additional logging
        onQuery: (query: { method?: string; table?: string; params?: unknown; filter?: unknown }) => {
          console.log('[Supabase Query]', JSON.stringify({
            method: query.method,
            table: query.table,
            params: query.params,
            filter: query.filter
          }, null, 2));
        }
      }
    }
  );

  return client;
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return user;
}

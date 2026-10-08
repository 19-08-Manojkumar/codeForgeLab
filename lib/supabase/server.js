import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config.mjs";

export async function serverSupabase() {
  const config = supabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        for (const { name, value, options } of values) cookieStore.set(name, value, options);
      },
    },
  });
}

export async function learningIdentity() {
  const client = await serverSupabase();
  if (!client) return { client: null, user: null, unavailable: true };
  // The server verifies identity; a client-supplied user ID is never authorization.
  const { data, error } = await client.auth.getUser();
  if (error && (!error.status || error.status >= 500)) return { client, user: null, unavailable: true };
  return { client, user: error ? null : data.user };
}

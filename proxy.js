import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseConfig } from "./lib/supabase/config.mjs";

export async function proxy(request) {
  const config = supabaseConfig();
  let response = NextResponse.next({ request });
  if (!config) return response;
  const client = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, responseHeaders = {}) {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of values) response.cookies.set(name, value, options);
        for (const [name, value] of Object.entries(responseHeaders)) response.headers.set(name, value);
      },
    },
  });
  try { await client.auth.getClaims(); } catch { /* Protected API routes verify identity and report service failures. */ }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/api/:path*", "/auth/:path*"] };

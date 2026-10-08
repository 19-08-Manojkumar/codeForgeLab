import { NextResponse } from "next/server";
import { serverSupabase } from "../../../lib/supabase/server";
import { authDestination } from "../../../lib/auth-redirect.mjs";
import { requestOrigin } from "../../../lib/request-origin.mjs";

export async function GET(request) {
  const url = new URL(request.url), client = await serverSupabase();
  const code = url.searchParams.get("code");
  if (client && code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(authDestination(url.searchParams.get("next")), requestOrigin(request)), { headers: { "Cache-Control": "private, no-store" } });
  }
  return NextResponse.redirect(new URL("/auth/error", requestOrigin(request)), { headers: { "Cache-Control": "private, no-store" } });
}

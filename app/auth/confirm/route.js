import { NextResponse } from "next/server";
import { serverSupabase } from "../../../lib/supabase/server";
import { authDestination } from "../../../lib/auth-redirect.mjs";
import { requestOrigin } from "../../../lib/request-origin.mjs";

export async function GET(request) {
  const url = new URL(request.url), client = await serverSupabase();
  const tokenHash = url.searchParams.get("token_hash"), type = url.searchParams.get("type");
  if (client && tokenHash && ["signup", "email", "recovery", "magiclink"].includes(type)) {
    const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(type === "recovery" ? "/auth/reset-password" : authDestination(url.searchParams.get("next")), requestOrigin(request)), { headers: { "Cache-Control": "private, no-store" } });
  }
  return NextResponse.redirect(new URL("/auth/error", requestOrigin(request)), { headers: { "Cache-Control": "private, no-store" } });
}

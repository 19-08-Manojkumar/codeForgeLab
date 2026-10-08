export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) return null;
    // Privileged keys must never become part of the client bundle.
    if (key.startsWith("sb_secret_")) return null;
    if (key.startsWith("eyJ")) {
      const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload.role !== "anon") return null;
    } else if (!key.startsWith("sb_publishable_")) return null;
    return { url, key };
  } catch { return null; }
}

"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { browserSupabase } from "../lib/supabase/client";

export default function useAccount() {
  const client = useMemo(() => browserSupabase(), []);
  const [account, setAccount] = useState({ user: null, status: client ? "loading" : "guest" });
  const generation = useRef(0), mounted = useRef(false);
  const refresh = useCallback(async () => {
    if (!client) return;
    const run = ++generation.current;
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("Account unavailable");
      const { user } = await response.json();
      if (mounted.current && run === generation.current) setAccount({ user, status: user ? "signed-in" : "guest" });
    } catch { if (mounted.current && run === generation.current) setAccount(current => ({ ...current, status: "unavailable" })); }
  }, [client]);
  useEffect(() => {
    mounted.current = true;
    if (!client) return () => { mounted.current = false; };
    const { data } = client.auth.onAuthStateChange(event => {
      queueMicrotask(() => {
        if (!mounted.current) return;
        if (event === "SIGNED_OUT") { generation.current++; setAccount({ user: null, status: "guest" }); }
        else void refresh();
      });
    });
    return () => { mounted.current = false; generation.current++; data.subscription.unsubscribe(); };
  }, [client, refresh]);
  return { ...account, configured: !!client, client, refresh };
}

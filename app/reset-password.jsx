"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { browserSupabase } from "../lib/supabase/client";

export default function ResetPassword() {
  const [status, setStatus] = useState("loading"), [password, setPassword] = useState(""), [confirm, setConfirm] = useState(""), [error, setError] = useState("");
  useEffect(() => {
    let active = true; const client = browserSupabase();
    if (!client) { setStatus("invalid"); return; }
    client.auth.getUser().then(({ data, error }) => { if (active) setStatus(data.user && !error ? "ready" : "invalid"); }).catch(() => { if (active) setStatus("invalid"); });
    return () => { active = false; };
  }, []);
  async function submit(event) {
    event.preventDefault(); setError("");
    if (password !== confirm) { setError("The passwords don't match."); return; }
    setStatus("saving");
    try {
      const { error } = await browserSupabase().auth.updateUser({ password });
      if (error) { setError(error.code === "same_password" ? "Choose a password different from your previous one." : "We couldn't update your password. Try a stronger password or request a new reset link."); setStatus("ready"); }
      else { setPassword(""); setConfirm(""); setStatus("done"); }
    } catch { setError("We couldn't reach the account service. Try again."); setStatus("ready"); }
  }
  return <main className="auth-page"><Link className="brand-wordmark auth-brand" href="/">Code<strong>Forge</strong> Lab.</Link><section className="auth-card"><h1>Set a new password</h1>
    {status === "loading" ? <p role="status">Checking your reset link…</p> : status === "invalid" ? <><p>This link is no longer available. Open Sign in on the home page and select Forgot password to request a new one.</p><Link className="primary-button" href="/">Back to learning</Link></> : status === "done" ? <><p role="status">Your password has been updated.</p><Link className="primary-button" href="/">Continue learning</Link></> : <form onSubmit={submit}>
      <div className="profile-field"><label htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} disabled={status === "saving"}/></div>
      <div className="profile-field"><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirm} onChange={event => setConfirm(event.target.value)} disabled={status === "saving"}/></div>
      <button className="primary-button" disabled={status === "saving"}>{status === "saving" ? "Updating…" : "Update password"}</button>{error && <p className="profile-error" role="alert">{error}</p>}
    </form>}
  </section></main>;
}

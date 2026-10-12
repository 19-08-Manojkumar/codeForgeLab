"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { browserSupabase } from "../lib/supabase/client";
import AuthPageFrame from "./auth-page-frame";
import { AuthIcon, AuthNotice, PasswordField } from "./auth-ui";

export default function ResetPassword() {
  const [status, setStatus] = useState("loading"), [password, setPassword] = useState(""), [confirm, setConfirm] = useState(""), [error, setError] = useState("");
  useEffect(() => {
    let active = true; const client = browserSupabase();
    if (!client) { setStatus("invalid"); return; }
    client.auth.getUser().then(({ data, error }) => { if (active) setStatus(data.user && !error ? "ready" : "invalid"); }).catch(() => { if (active) setStatus("invalid"); });
    return () => { active = false; };
  }, []);
  async function submit(event) {
    event.preventDefault();
    if (status === "saving") return;
    setError("");
    if (password !== confirm) { setError("The passwords don't match."); document.querySelector("#confirm-password")?.focus(); return; }
    setStatus("saving");
    try {
      const { error } = await browserSupabase().auth.updateUser({ password });
      if (error) { setError(error.code === "same_password" ? "Choose a password different from your previous one." : "We couldn't update your password. Try a stronger password or request a new reset link."); setStatus("ready"); }
      else { setPassword(""); setConfirm(""); setStatus("done"); }
    } catch { setError("We couldn't reach the account service. Try again."); setStatus("ready"); }
  }
  return <AuthPageFrame title={status === "done" ? "You're ready to return" : status === "invalid" ? "Let's get you a fresh link" : "Set a new password"} description={status === "done" ? "Your account is ready. Your next lesson is waiting." : status === "invalid" ? "Reset links expire to keep your account secure." : "Choose a password you haven't used for this account before."} icon={status === "done" ? "check" : status === "invalid" ? "mail" : "lock"}>
    {status === "loading" ? <p className="auth-loading" role="status"><span className="auth-spinner" aria-hidden="true"/>Checking your reset link…</p> : status === "invalid" ? <><p>This link is no longer available. Open Login on the home page and select Forgot password to request a new one.</p><Link className="primary-button account-submit" href="/">Back to learning<AuthIcon name="arrow" size={17}/></Link></> : status === "done" ? <><AuthNotice>Your password has been updated.</AuthNotice><Link className="primary-button account-submit" href="/">Continue learning<AuthIcon name="arrow" size={17}/></Link></> : <form onSubmit={submit} aria-busy={status === "saving"}>
      {error && <AuthNotice error>{error}</AuthNotice>}
      <PasswordField id="new-password" label="New password" value={password} onChange={event => { setPassword(event.target.value); setError(""); }} disabled={status === "saving"} hint="At least 8 characters. Longer is better."/>
      <PasswordField id="confirm-password" label="Confirm password" value={confirm} onChange={event => { setConfirm(event.target.value); setError(""); }} disabled={status === "saving"} error={error === "The passwords don't match." ? error : undefined}/>
      <button className="primary-button account-submit" disabled={status === "saving"}>{status === "saving" ? <><span className="auth-spinner" aria-hidden="true"/>Updating…</> : <>Update password<AuthIcon name="arrow" size={17}/></>}</button>
    </form>}
  </AuthPageFrame>;
}

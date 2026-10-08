"use client";
import { useEffect, useRef, useState } from "react";

function errorMessage(error) {
  if (error?.code === "invalid_credentials") return "The email or password is incorrect.";
  if (error?.code === "email_not_confirmed") return "Confirm your email before signing in. Check your inbox for the confirmation link.";
  if (["over_email_send_rate_limit", "over_request_rate_limit"].includes(error?.code)) return "Too many requests. Please wait a moment and try again.";
  if (["weak_password", "validation_failed"].includes(error?.code)) return "Use a valid email and a password with at least 8 characters.";
  return "We couldn't complete that request. Please try again.";
}

export default function AccountDialog({ open, account, close, editProfile }) {
  const dialog = useRef(null), focus = useRef(null), operation = useRef(0);
  const [mode, setMode] = useState("signin"), [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  useEffect(() => {
    if (!open) return;
    operation.current++; setMode("signin"); setEmail(""); setPassword(""); setBusy(false); setError(""); setMessage("");
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; dialog.current.showModal(); focus.current?.focus();
    return () => { operation.current++; dialog.current.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, [open]);
  function switchMode(next) { setMode(next); setError(""); setMessage(""); setPassword(""); }
  async function submit(event) {
    event.preventDefault();
    if (busy || !account.client) return;
    const run = ++operation.current; setBusy(true); setError(""); setMessage("");
    try {
      let result;
      if (mode === "signup") result = await account.client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
      else if (mode === "forgot") result = await account.client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password` });
      else result = await account.client.auth.signInWithPassword({ email: email.trim(), password });
      if (run !== operation.current) return;
      if (result.error) { setError(errorMessage(result.error)); return; }
      if (mode === "forgot") setMessage("If an account uses this email, you'll receive a password reset link. Check your inbox.");
      else if (mode === "signup" && !result.data.session) { setPassword(""); setMessage("Check your email to confirm your account, then sign in here."); }
      else { await account.refresh(); if (run === operation.current) close(); }
    } catch { if (run === operation.current) setError("We couldn't reach the account service. Please try again."); }
    finally { if (run === operation.current) setBusy(false); }
  }
  async function signOut() {
    const run = ++operation.current; setBusy(true); setError("");
    try {
      const { error } = await account.client.auth.signOut({ scope: "local" });
      if (run !== operation.current) return;
      if (error) setError("We couldn't sign you out. Please try again.");
      else { await account.refresh(); if (run === operation.current) close(); }
    } catch { if (run === operation.current) setError("We couldn't sign you out. Please try again."); }
    finally { if (run === operation.current) setBusy(false); }
  }
  const title = account.user ? "Your account" : mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back";
  return <dialog ref={dialog} className="account-dialog" aria-labelledby="account-title" onCancel={event => { event.preventDefault(); close(); }}>
    <button className="profile-close account-close" aria-label="Close account" onClick={close}>×</button>
    <span className="eyebrow">CODEFORGE LAB</span><h2 id="account-title">{title}</h2>
    {account.user ? <div className="account-details"><p className="account-email">{account.user.email}</p><p>Your saved learning is available whenever you sign in.</p><button ref={focus} className="secondary-button" onClick={() => { close(); editProfile(); }}>Edit learning profile</button><button className="text-button" disabled={busy} onClick={signOut}>{busy ? "Signing out…" : "Sign out"}</button></div>
      : !account.configured ? <><p>Account sign-in isn't available yet. You can keep learning as a guest, with progress saved on this device.</p><button ref={focus} className="primary-button" onClick={close}>Continue learning</button></>
      : <><p>{mode === "forgot" ? "Enter your account email and we'll send you a reset link." : "Sign in to save your learning across devices. Your guest progress on this device will be added to your account."}</p>
        <form onSubmit={submit}>
          <div className="profile-field"><label htmlFor="account-email">Email</label><input ref={focus} id="account-email" type="email" required maxLength={254} autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} disabled={busy}/></div>
          {mode !== "forgot" && <div className="profile-field"><label htmlFor="account-password">Password</label><input id="account-password" type="password" required minLength={mode === "signup" ? 8 : 1} maxLength={128} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={event => setPassword(event.target.value)} disabled={busy}/>{mode === "signup" && <small>At least 8 characters.</small>}</div>}
          <button className="primary-button account-submit" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</button>
        </form>
        <div className="account-links">{mode === "signin" ? <><button className="text-button" disabled={busy} onClick={() => switchMode("signup")}>Create an account</button><button className="text-button" disabled={busy} onClick={() => switchMode("forgot")}>Forgot password?</button></> : <button className="text-button" disabled={busy} onClick={() => switchMode("signin")}>Back to sign in</button>}</div>
        <button className="text-button account-guest" onClick={close}>Continue as a guest</button>
      </>}
    {error && <p className="profile-error" role="alert">{error}</p>}{message && <p className="account-message" role="status">{message}</p>}
  </dialog>;
}

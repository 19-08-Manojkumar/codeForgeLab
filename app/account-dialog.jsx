"use client";
import { useEffect, useRef, useState } from "react";
import { validateProfile } from "../lib/learner.mjs";
import ProfileFields, { emptyProfileDraft } from "./profile-fields";
import { AuthIcon, AuthNotice, PasswordField } from "./auth-ui";
import { JourneyIcon, TrophyShelf } from "./coding-journey";
import { practiceTimeLabel } from "../lib/coding-activity.mjs";

const goalLabels = { basics: "Understand the basics", projects: "Build my own projects", interviews: "Prepare for interviews", work: "Use these skills at work", course: "Keep up with my coursework" };
const roleLabels = { student: "Student", working: "Working professional", independent: "Independent learner" };

function errorMessage(error) {
  if (error?.code === "invalid_credentials") return "The email or password is incorrect.";
  if (error?.code === "email_not_confirmed") return "Confirm your email before signing in. Check your inbox for the confirmation link.";
  if (["over_email_send_rate_limit", "over_request_rate_limit"].includes(error?.code)) return "Too many requests. Please wait a moment and try again.";
  if (["weak_password", "validation_failed"].includes(error?.code)) return "Use a valid email and a password with at least 8 characters.";
  return "We couldn't complete that request. Please try again.";
}

export default function AccountDialog({ open, account, close, saveProfile, profile, coding, motionPaused, profileLoading, profileUnavailable = false, profileSaving = false, retryProfile, initialMode = "signin" }) {
  const dialog = useRef(null), focus = useRef(null), operation = useRef(0), openedOwner = useRef(null);
  const draftEdited = useRef(false);
  const [mode, setMode] = useState("signin"), [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState(""), [passwordMismatch, setPasswordMismatch] = useState(false);
  const [draft, setDraft] = useState(emptyProfileDraft), [profileErrors, setProfileErrors] = useState({});
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [clearRequested, setClearRequested] = useState(false);
  useEffect(() => {
    if (!open) return;
    openedOwner.current = account.user?.id || null;
    operation.current++; setMode(account.user ? initialMode === "edit" ? "edit" : "profile" : "signin"); setEmail(""); setPassword(""); setConfirmation(""); setPasswordMismatch(false); setProfileErrors({});
    setDraft(profile ? { ...profile, age: profile.age ?? "" } : { ...emptyProfileDraft });
    draftEdited.current = false;
    setBusy(false); setError(""); setMessage(""); setClearRequested(false);
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; dialog.current.showModal(); focus.current?.focus();
    return () => { operation.current++; dialog.current.close(); document.body.style.overflow = overflow; if (previous?.isConnected && previous !== document.body) previous.focus(); else document.querySelector(".account-trigger")?.focus(); };
  }, [open]);
  useEffect(() => { if (open) { dialog.current.scrollTop = 0; focus.current?.focus(); } }, [open, mode]);
  useEffect(() => { if (open && openedOwner.current !== (account.user?.id || null)) close(); }, [open, account.user?.id]);
  useEffect(() => { if (open && error) dialog.current.querySelector(".auth-notice-error")?.focus(); }, [open, error]);
  useEffect(() => { if (clearRequested) dialog.current.querySelector(".account-clear-keep")?.focus(); }, [clearRequested]);
  useEffect(() => {
    if (open && account.user && mode === "edit" && !profileLoading && !draftEdited.current) {
      setDraft(profile ? { ...profile, age: profile.age ?? "" } : { ...emptyProfileDraft });
    }
  }, [open, mode, profile, profileLoading]);
  function switchMode(next) { setMode(next); setError(""); setMessage(""); setPassword(""); setConfirmation(""); setPasswordMismatch(false); setProfileErrors({}); setClearRequested(false); }
  function editProfile() { draftEdited.current = false; setDraft(profile ? { ...profile, age: profile.age ?? "" } : { ...emptyProfileDraft }); switchMode("edit"); }
  function updateProfile(field, value) { draftEdited.current = true; setDraft(current => ({ ...current, [field]: value })); setProfileErrors(current => ({ ...current, [field]: undefined })); }
  function submitProfile(event) {
    event.preventDefault();
    if (!account.user || busy || profileLoading || profileUnavailable) return;
    const result = validateProfile(draft);
    if (dialog.current.querySelector("#profile-age").validity.badInput) {
      result.errors.age = "Enter a whole number from 1 to 120, or leave age blank.";
      result.profile = null;
    }
    setProfileErrors(result.errors);
    if (!result.profile) { dialog.current.querySelector(`#profile-${Object.keys(result.errors)[0]}`)?.focus(); return; }
    saveProfile(result.profile); switchMode("profile"); setMessage("profile-save");
  }
  function clearProfile() {
    if (!account.user || busy || profileLoading || profileUnavailable) return;
    saveProfile(null); switchMode("profile"); setMessage("profile-clear");
  }
  async function submit(event) {
    event.preventDefault();
    if (busy || !account.client) return;
    let signupProfile;
    if (mode === "signup") {
      const result = validateProfile(draft);
      setProfileErrors(result.errors);
      if (!result.profile) { dialog.current.querySelector(`#signup-${Object.keys(result.errors)[0]}`)?.focus(); return; }
      if (password !== confirmation) { setPasswordMismatch(true); dialog.current.querySelector("#account-confirm-password")?.focus(); return; }
      signupProfile = result.profile;
    }
    const run = ++operation.current; setBusy(true); setError(""); setMessage("");
    try {
      let result;
      if (mode === "signup") result = await account.client.auth.signUp({ email: email.trim(), password, options: { data: { full_name: signupProfile.name, learning_profile: signupProfile }, emailRedirectTo: `${location.origin}/auth/callback` } });
      else if (mode === "forgot") result = await account.client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password` });
      else result = await account.client.auth.signInWithPassword({ email: email.trim(), password });
      if (run !== operation.current) return;
      if (result.error) { setError(errorMessage(result.error)); return; }
      if (mode === "forgot") setMessage("If an account uses this email, you'll receive a password reset link.");
      else if (mode === "signup" && !result.data.session) { setPassword(""); setConfirmation(""); setMode("confirm"); setMessage("Check your email to finish setting up your account."); }
      else { await account.refresh(); if (run === operation.current) close(); }
    } catch { if (run === operation.current) setError("We couldn't reach the account service. Please try again."); }
    finally { if (run === operation.current) setBusy(false); }
  }
  async function signOut() {
    const run = ++operation.current; setBusy(true); setError("");
    try {
      const { error } = await account.client.auth.signOut({ scope: "local" });
      if (run !== operation.current) return;
      if (error) setError("We couldn't log you out. Please try again.");
      else { await account.refresh(); if (run === operation.current) close(); }
    } catch { if (run === operation.current) setError("We couldn't log you out. Please try again."); }
    finally { if (run === operation.current) setBusy(false); }
  }
  function keepFocusInDialog(event) {
    if (event.key !== "Tab") return;
    const controls = [...dialog.current.querySelectorAll("button, input, select, textarea, a[href], [tabindex='0']")].filter(control => !control.disabled && control.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  const title = account.user ? mode === "edit" ? "Edit your profile" : "Your profile" : mode === "signup" ? "Create your account" : mode === "confirm" ? "Check your email" : mode === "forgot" ? "Reset your password" : "Welcome back";
  const description = account.user ? mode === "edit" ? "A few details to make your learning feel more personal." : "Your account and learning details, in one place." : mode === "signup" ? "Make progress that stays with you, on every device." : mode === "confirm" ? "One last step before your next clear idea." : mode === "forgot" ? "We'll help you get back to your learning." : "Pick up where you left off. Your progress is waiting.";
  const profileMessage = profileUnavailable ? "Your changes haven't been saved yet. Retry the connection." : profileSaving || profileLoading ? "Saving your profile changes…" : message === "profile-clear" ? "Learning profile cleared. Your account and progress are kept." : "Profile saved.";
  const initials = (profile?.name || account.user?.email || "?").trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join("").toUpperCase();
  const signup = mode === "signup" && !account.user;
  return <dialog ref={dialog} id="account-dialog" className={`account-dialog${signup ? " account-signup" : ""}${account.user ? " account-profile" : ""}${mode === "edit" && account.user ? " account-form-wide" : ""}`} aria-labelledby="account-title" aria-describedby="account-description" onKeyDown={keepFocusInDialog} onCancel={event => { event.preventDefault(); close(); }}>
    <button className="account-close" aria-label={account.user ? "Close profile" : "Close login"} onClick={close}><AuthIcon name="close"/></button>
    <header className="account-heading">
      <div className="account-brand"><span className="auth-brand-mark"><AuthIcon name="code" size={17}/></span><span>Code<strong>Forge</strong> Lab<span className="brand-period">.</span></span></div>
      <h2 id="account-title">{title}</h2><p id="account-description">{description}</p>
    </header>
    {error && <AuthNotice error className="profile-error">{error}</AuthNotice>}
    {message && <AuthNotice className="account-message" error={!!account.user && profileUnavailable} pending={!!account.user && (profileSaving || profileLoading)}>{["profile-save", "profile-clear"].includes(message) ? profileMessage : message}</AuthNotice>}
    {account.user && profileUnavailable && <AuthNotice error className="account-profile-unavailable"><p>We couldn't sync your learning profile. Reconnect before saving changes.</p><button className="text-button" type="button" onClick={retryProfile}>Retry connection</button></AuthNotice>}
    {account.user ? mode === "edit" ? <form className="account-edit-form" onSubmit={submitProfile} noValidate>
      <ProfileFields draft={draft} update={updateProfile} errors={profileErrors} nameRef={focus} disabled={busy || profileLoading}/>
      <div className="account-profile-actions"><button className="primary-button" type="submit" disabled={busy || profileLoading || profileUnavailable}>Save changes<AuthIcon name="check" size={17}/></button><button className="secondary-button" type="button" onClick={() => switchMode("profile")}>Cancel</button></div>
      {profile && <div className="account-profile-options">{clearRequested ? <div className="account-clear-confirm"><strong>Clear your learning profile?</strong><p>This removes these personal details. Your account and lesson progress will stay.</p><div><button className="auth-danger-button" type="button" disabled={busy || profileLoading || profileUnavailable} onClick={clearProfile}>Clear profile</button><button className="text-button account-clear-keep" type="button" onClick={() => { setClearRequested(false); queueMicrotask(() => dialog.current.querySelector(".profile-clear")?.focus()); }}>Keep profile</button></div></div> : <button className="text-button profile-clear" type="button" disabled={busy || profileLoading || profileUnavailable} onClick={() => setClearRequested(true)}>Clear learning profile</button>}</div>}
    </form> : <div className="account-details">
      <section className={`account-identity${motionPaused?" motion-paused":""}`} aria-label="Account details"><span className={`account-avatar reward-${coding?.tier||"none"}`} aria-hidden="true">{initials}{coding?.earned.length>0&&<span className="account-avatar-trophy"><JourneyIcon size={12}/></span>}</span><div><p className="account-name">{profileLoading ? "Loading your profile…" : profile?.name || "Your learning account"}</p><p className="account-email">{account.user.email}</p><span className={`account-sync-pill${profileUnavailable ? " sync-pending" : ""}`}>{profileUnavailable ? <AuthIcon name="alert" size={13}/> : <AuthIcon name={profileSaving || profileLoading ? "lock" : "check"} size={13}/>} {profileUnavailable ? "Connection needed" : profileSaving ? "Saving changes" : profileLoading ? "Loading details" : "Signed in"}</span></div></section>
      {coding&&!profileLoading&&<div className="account-coding-stats" aria-label="Coding achievements"><span><strong>{coding.currentStreak}</strong>day streak</span><span><strong>{coding.bestStreak}</strong>best streak</span><span><strong>{practiceTimeLabel(coding.seconds)}</strong>active practice</span></div>}
      {profileLoading ? <p className="account-loading" role="status">Getting your saved learning details…</p> : profile ? <section className="account-learning-details" aria-label="Learning details"><h3>Learning details</h3><dl className="account-profile-summary"><div><dt>Background</dt><dd>{roleLabels[profile.role]}</dd></div><div><dt>{profile.role === "student" ? "Area of study" : profile.role === "working" ? "Work domain" : "Area of interest"}</dt><dd>{profile.domain}</dd></div><div className="account-detail-wide"><dt>Learning goal</dt><dd>{goalLabels[profile.goal]}</dd></div>{profile.age != null && <div><dt>Age</dt><dd>{profile.age}</dd></div>}</dl></section> : <div className="account-empty-profile"><span className="auth-heading-icon"><AuthIcon name="user" size={23}/></span><h3>Make this space yours</h3><p>Add your name, background, and learning goal for a more personal experience.</p></div>}
      <button ref={focus} className="primary-button account-edit-button" disabled={busy || profileLoading} onClick={editProfile}>{profile ? "Edit profile" : "Complete profile"}<AuthIcon name="arrow" size={17}/></button>
      {coding&&!profileLoading&&<TrophyShelf summary={coding} compact/>}
      <div className="account-session-footer"><p><AuthIcon name="lock" size={15}/><span>Your saved progress follows you across devices.</span></p><button className="text-button account-logout" disabled={busy} onClick={signOut}><AuthIcon name="logout" size={16}/>{busy ? "Logging out…" : "Logout"}</button></div>
    </div>
      : !account.configured ? <div className="auth-outcome"><span className="auth-heading-icon"><AuthIcon name="user" size={24}/></span><p>Account sign-in isn't available yet. You can keep learning as a guest, with progress saved on this device.</p><button ref={focus} className="primary-button account-submit" onClick={close}>Continue learning<AuthIcon name="arrow" size={17}/></button></div>
      : mode === "confirm" ? <div className="auth-outcome"><span className="auth-heading-icon"><AuthIcon name="mail" size={25}/></span><p className="auth-email-destination">Confirmation email requested for<strong className="account-email">{email}</strong></p><p>Open the email and follow the confirmation link. Then come back to sign in. Check your spam folder if you don't see it.</p><button ref={focus} className="primary-button account-submit" onClick={() => switchMode("signin")}>Back to sign in<AuthIcon name="arrow" size={17}/></button><button className="text-button account-guest" onClick={close}>Continue as a guest</button></div>
      : <>
        {mode === "forgot" && message ? <div className="auth-outcome"><span className="auth-heading-icon"><AuthIcon name="mail" size={25}/></span><p className="auth-email-destination">Check the inbox for<strong className="account-email">{email}</strong></p><p>If you don't see an email, check your spam folder or try another address.</p><button className="text-button" onClick={() => setMessage("")}>Use a different email</button></div> : <form onSubmit={submit} aria-busy={busy}>
          <div className={signup ? "account-signup-layout" : undefined}>
            {signup && <fieldset className="account-profile-fields"><legend><span className="account-section-number">01</span>About you</legend><p className="account-section-hint">For your personal welcome and learning profile.</p><ProfileFields draft={draft} update={updateProfile} errors={profileErrors} prefix="signup" nameRef={focus} disabled={busy}/></fieldset>}
            <div className={signup ? "account-credentials" : undefined}>
              {signup && <div className="account-section-heading"><span className="account-section-number">02</span><h3>Account details</h3></div>}
              {signup && <p className="account-section-hint">Use an email you can access to confirm your account.</p>}
              <div className="profile-field"><label htmlFor="account-email">Email address</label><input ref={signup ? undefined : focus} id="account-email" type="email" required maxLength={254} autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={event => { setEmail(event.target.value); setError(""); }} disabled={busy}/></div>
              {mode !== "forgot" && <>
                <PasswordField key={mode} id="account-password" label="Password" value={password} onChange={event => { setPassword(event.target.value); setPasswordMismatch(false); setError(""); }} disabled={busy} minLength={signup ? 8 : 1} autoComplete={signup ? "new-password" : "current-password"} hint={signup ? "At least 8 characters. Longer is better." : undefined}/>
                {signup && <PasswordField id="account-confirm-password" label="Confirm password" value={confirmation} onChange={event => { setConfirmation(event.target.value); setPasswordMismatch(false); }} disabled={busy} error={passwordMismatch ? "Passwords do not match." : undefined}/>}
              </>}
              {mode === "signin" && <button type="button" className="text-button account-forgot" disabled={busy} onClick={() => switchMode("forgot")}>Forgot password?</button>}
              {signup && <div className="account-signup-note"><AuthIcon name="lock" size={17}/><p>Your profile, lessons, and bookmarks stay with your account.</p></div>}
            </div>
          </div>
          <div className="account-form-footer"><button className="primary-button account-submit" disabled={busy}>{busy ? <><span className="auth-spinner" aria-hidden="true"/>Please wait…</> : <>{signup ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}<AuthIcon name="arrow" size={17}/></>}</button>{signup && <p className="account-confirmation-hint">We'll send you an email to confirm your account.</p>}</div>
        </form>}
        <div className="account-links">{mode === "signin" ? <><span>New to CodeForge Lab?</span><button className="text-button" disabled={busy} onClick={() => switchMode("signup")}>Create an account</button></> : <button className="text-button" disabled={busy} onClick={() => switchMode("signin")}><AuthIcon name="back" size={16}/>Back to sign in</button>}</div>
        <div className="account-guest-footer"><span>Explore at your own pace</span><button className="text-button account-guest" onClick={close}>Continue as a guest</button></div>
      </>}
  </dialog>;
}

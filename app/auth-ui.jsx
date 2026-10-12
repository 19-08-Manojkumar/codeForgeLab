"use client";

import { useState } from "react";

export function AuthIcon({ name = "lock", size = 20 }) {
  const paths = {
    lock: <><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
    back: <path d="M19 12H5m5-5-5 5 5 5"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    logout: <><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M10 12h11m-4-4 4 4-4 4"/></>,
    alert: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 3h.01"/></>,
    code: <path d="m7 6-6 6 6 6m10-12 6 6-6 6m-4-15-2 18"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.lock}</svg>;
}

export function PasswordField({ id, label = "Password", value, onChange, disabled, minLength = 8, autoComplete = "new-password", error, hint, inputRef }) {
  const [visible, setVisible] = useState(false);
  return <div className="profile-field">
    <label htmlFor={id}>{label}</label>
    <div className="auth-password-input">
      <input ref={inputRef} id={id} type={visible ? "text" : "password"} required minLength={minLength} maxLength={128} autoComplete={autoComplete} value={value} onChange={onChange} disabled={disabled} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}/>
      <button type="button" className="auth-password-toggle" disabled={disabled} onClick={() => setVisible(current => !current)} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-controls={id} aria-pressed={visible}>{visible ? "Hide" : "Show"}</button>
    </div>
    {error ? <p id={`${id}-error`} className="profile-error" role="alert">{error}</p> : hint ? <small id={`${id}-hint`}>{hint}</small> : null}
  </div>;
}

export function AuthNotice({ children, error = false, pending = false, className = "" }) {
  return <div className={`auth-notice ${error ? "auth-notice-error" : pending ? "auth-notice-pending" : "auth-notice-success"} ${className}`} role={error ? "alert" : "status"} tabIndex={-1}>{pending && !error ? <span className="auth-spinner" aria-hidden="true"/> : <AuthIcon name={error ? "alert" : "check"}/>}<div>{children}</div></div>;
}

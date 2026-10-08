"use client";

import { useEffect, useRef, useState } from "react";
import { validateProfile, learnerBackground, learnerGoalMessage } from "../lib/learner.mjs";

const emptyDraft = { name: "", age: "", role: "", domain: "", goal: "basics" };

export function LearnerBanner({ profile, edit }) {
  if (!profile) return null;
  return <section className="learner-banner" aria-label="Your learning profile">
    <span className="learner-avatar" aria-hidden="true">{Array.from(profile.name)[0]}</span>
    <div className="learner-welcome"><strong>Welcome, {profile.name}<span className="brand-period">.</span></strong><span>{learnerBackground(profile)}</span><p>{learnerGoalMessage(profile)}</p></div>
    <button className="text-button" onClick={edit}>Edit details</button>
  </section>;
}

export default function LearnerDialog({ open, profile, save, cancel, clear }) {
  const dialogRef = useRef(null);
  const nameRef = useRef(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open) return;
    setDraft(profile ? { ...profile, age: profile.age ?? "" } : { ...emptyDraft });
    setErrors({});
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    nameRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus();
    };
  }, [open, profile]);

  const update = (field, value) => {
    setDraft(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
  };
  const fieldProps = field => ({ id: `profile-${field}`, "aria-invalid": !!errors[field], "aria-describedby": errors[field] ? `profile-${field}-error` : undefined });
  const errorText = field => errors[field] && <p id={`profile-${field}-error`} className="profile-error">{errors[field]}</p>;
  function submit(event) {
    event.preventDefault();
    const result = validateProfile(draft);
    if (dialogRef.current.querySelector("#profile-age").validity.badInput) {
      result.errors.age = "Enter a whole number from 1 to 120, or leave age blank.";
      result.profile = null;
    }
    setErrors(result.errors);
    if (!result.profile) {
      dialogRef.current.querySelector(`#profile-${Object.keys(result.errors)[0]}`)?.focus();
      return;
    }
    save(result.profile);
  }
  function keepFocusInDialog(event) {
    if (event.key !== "Tab") return;
    const controls = [...dialogRef.current.querySelectorAll("button, input, select, [tabindex='0']")].filter(element => !element.disabled && element.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  const domainLabel = draft.role === "student" ? "Course or area of study" : draft.role === "working" ? "Work domain" : "What interests you?";
  const domainPlaceholder = draft.role === "student" ? "e.g. Computer science" : draft.role === "working" ? "e.g. Software engineering, design" : "e.g. Web development";
  const displayName = draft.name.trim().replace(/\s+/gu, " ") || "you";

  return <dialog ref={dialogRef} className="learner-dialog" aria-labelledby="profile-title" aria-describedby="profile-intro" onKeyDown={keepFocusInDialog} onCancel={event => { event.preventDefault(); cancel(); }}>
    <div className="profile-topline"><span className="profile-code-mark" aria-hidden="true">{"{ "}<bdi>{displayName}</bdi>{" }"}</span><span className="eyebrow">YOUR LEARNING, YOUR PACE</span><button className="profile-close" onClick={cancel} aria-label={profile ? "Cancel profile changes" : "Skip welcome form"}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
    <h2 id="profile-title">{profile ? "Your learning profile" : "Make CodeForge Lab yours"}<span className="brand-period">.</span></h2>
    <p id="profile-intro">Tell us a little about yourself for a personal welcome and encouragement as you learn.</p>
    <form onSubmit={submit} noValidate>
      <div className="profile-field-row">
        <div className="profile-field"><label htmlFor="profile-name">What should we call you?</label><input {...fieldProps("name")} ref={nameRef} value={draft.name} onChange={e => update("name", e.target.value)} autoComplete="given-name" maxLength={40} placeholder="Your name" required/>{errorText("name")}</div>
        <div className="profile-field age-field"><label htmlFor="profile-age">Age <span>(optional)</span></label><input {...fieldProps("age")} type="number" inputMode="numeric" min="1" max="120" step="1" value={draft.age} onChange={e => update("age", e.target.value)} placeholder="e.g. 24"/>{errorText("age")}</div>
      </div>
      <div className="profile-field"><label htmlFor="profile-role">Which describes you?</label><select {...fieldProps("role")} value={draft.role} onChange={e => update("role", e.target.value)} required><option value="" disabled>Choose your background</option><option value="student">I’m a student</option><option value="working">I’m working</option><option value="independent">I’m learning independently</option></select>{errorText("role")}</div>
      <div className="profile-field"><label htmlFor="profile-domain">{domainLabel}</label><input {...fieldProps("domain")} value={draft.domain} onChange={e => update("domain", e.target.value)} maxLength={60} placeholder={domainPlaceholder} required/>{errorText("domain")}</div>
      <div className="profile-field"><label htmlFor="profile-goal">What would you like to achieve?</label><select {...fieldProps("goal")} value={draft.goal} onChange={e => update("goal", e.target.value)}><option value="basics">Understand the basics</option><option value="projects">Build my own projects</option><option value="interviews">Prepare for interviews</option><option value="work">Use these skills at work</option><option value="course">Keep up with my coursework</option></select>{errorText("goal")}</div>
      <p className="profile-storage-note"><span aria-hidden="true">⌁</span> Saved with your learning progress when saving is available.</p>
      <div className="profile-actions"><button type="button" className="text-button" onClick={cancel}>{profile ? "Cancel" : "Skip for now"}</button><button type="submit" className="primary-button">{profile ? "Save changes" : "Start learning"}<span aria-hidden="true">→</span></button></div>
      {profile && <button type="button" className="profile-clear" onClick={clear}>Clear my profile</button>}
    </form>
  </dialog>;
}

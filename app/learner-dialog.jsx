"use client";

import { useEffect, useRef, useState } from "react";
import { validateProfile } from "../lib/learner.mjs";
import ProfileFields, { emptyProfileDraft } from "./profile-fields";

export default function LearnerDialog({ open, profile, save, cancel, clear }) {
  const dialogRef = useRef(null);
  const nameRef = useRef(null);
  const [draft, setDraft] = useState(emptyProfileDraft);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open) return;
    setDraft(profile ? { ...profile, age: profile.age ?? "" } : { ...emptyProfileDraft });
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
  const displayName = draft.name.trim().replace(/\s+/gu, " ") || "you";

  return <dialog ref={dialogRef} className="learner-dialog" aria-labelledby="profile-title" aria-describedby="profile-intro" onKeyDown={keepFocusInDialog} onCancel={event => { event.preventDefault(); cancel(); }}>
    <div className="profile-topline"><span className="profile-code-mark" aria-hidden="true">{"{ "}<bdi>{displayName}</bdi>{" }"}</span><span className="eyebrow">YOUR LEARNING, YOUR PACE</span><button className="profile-close" onClick={cancel} aria-label={profile ? "Cancel profile changes" : "Skip welcome form"}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
    <h2 id="profile-title">{profile ? "Your learning profile" : "Make CodeForge Lab yours"}<span className="brand-period">.</span></h2>
    <p id="profile-intro">Tell us a little about yourself for personalized encouragement when you complete a practice challenge.</p>
    <form onSubmit={submit} noValidate>
      <ProfileFields draft={draft} update={update} errors={errors} nameRef={nameRef}/>
      <p className="profile-storage-note"><span aria-hidden="true">⌁</span> Saved with your learning progress when saving is available.</p>
      <div className="profile-actions"><button type="button" className="text-button" onClick={cancel}>{profile ? "Cancel" : "Skip for now"}</button><button type="submit" className="primary-button">{profile ? "Save changes" : "Start learning"}<span aria-hidden="true">→</span></button></div>
      {profile && <button type="button" className="profile-clear" onClick={clear}>Clear my profile</button>}
    </form>
  </dialog>;
}

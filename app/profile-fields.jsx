"use client";

export const emptyProfileDraft = { name: "", age: "", role: "", domain: "", goal: "basics" };

export default function ProfileFields({ draft, update, errors = {}, nameRef, prefix = "profile", disabled = false }) {
  const fieldProps = field => ({ id: `${prefix}-${field}`, disabled, "aria-invalid": !!errors[field], "aria-describedby": errors[field] ? `${prefix}-${field}-error` : undefined });
  const errorText = field => errors[field] && <p id={`${prefix}-${field}-error`} className="profile-error">{errors[field]}</p>;
  const domainLabel = draft.role === "student" ? "Course or area of study" : draft.role === "working" ? "Work domain" : "What interests you?";
  const domainPlaceholder = draft.role === "student" ? "e.g. Computer science" : draft.role === "working" ? "e.g. Software engineering, design" : "e.g. Web development";

  return <>
    <div className="profile-field-row">
      <div className="profile-field"><label htmlFor={`${prefix}-name`}>Your name</label><input {...fieldProps("name")} ref={nameRef} value={draft.name} onChange={event => update("name", event.target.value)} autoComplete="name" maxLength={40} placeholder="How you'd like to be called" required/>{errorText("name")}</div>
      <div className="profile-field age-field"><label htmlFor={`${prefix}-age`}>Age <span>(optional)</span></label><input {...fieldProps("age")} type="number" inputMode="numeric" min="1" max="120" step="1" value={draft.age} onChange={event => update("age", event.target.value)} placeholder="e.g. 24"/>{errorText("age")}</div>
    </div>
    <div className="profile-field"><label htmlFor={`${prefix}-role`}>Your background</label><select {...fieldProps("role")} value={draft.role} onChange={event => update("role", event.target.value)} required><option value="" disabled>Choose your background</option><option value="student">I’m a student</option><option value="working">I’m working</option><option value="independent">I’m learning independently</option></select>{errorText("role")}</div>
    <div className="profile-field"><label htmlFor={`${prefix}-domain`}>{domainLabel}</label><input {...fieldProps("domain")} value={draft.domain} onChange={event => update("domain", event.target.value)} maxLength={60} placeholder={domainPlaceholder} required/>{errorText("domain")}</div>
    <div className="profile-field"><label htmlFor={`${prefix}-goal`}>Learning goal</label><select {...fieldProps("goal")} value={draft.goal} onChange={event => update("goal", event.target.value)}><option value="basics">Understand the basics</option><option value="projects">Build my own projects</option><option value="interviews">Prepare for interviews</option><option value="work">Use these skills at work</option><option value="course">Keep up with my coursework</option></select>{errorText("goal")}</div>
  </>;
}

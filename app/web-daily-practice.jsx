"use client";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "./method-workspace";
import { WebLesson } from "./web-workspace";
import { dailyPlan } from "../lib/daily-plan.mjs";
import { learningKey, localDay } from "../lib/learning-state.mjs";
import { languages } from "../lib/practice.mjs";
import useScrollToTop from "./use-scroll-to-top";

export default function WebDailyPractice({ language, state, dispatch, profile, onSessionChange, onDraft, exit, initialStep, initialMode, onStepChange }) {
  const [date] = useState(localDay), plan = dailyPlan(language, date);
  const markers = ["concept", "prediction-0", "prediction-1", "prediction-2", "problem"], completed = state.daily[plan.key]?.completed || [];
  const first = markers.findIndex(marker => !completed.includes(marker)), [step, setStep] = useState(Number.isInteger(initialStep) ? Math.min(initialStep, first < 0 ? 5 : first) : first < 0 ? 5 : first);
  useEffect(() => { onStepChange?.(step); }, [step, onStepChange]);
  useScrollToTop(step);
  const entry = step === 0 ? plan.concept : step < 4 ? plan.predictions[step - 1] : plan.problem;
  const path = step < 4 ? "basics" : "problems", draftEntryId = `daily-${date}-${entry.id}`;
  const finish = marker => dispatch({ type: "daily", date, language, marker });
  const onVisit = useCallback(visit => dispatch({ type: "visit", visit }), [dispatch]);
  function complete() {
    if (step === 0) return;
    finish(markers[step]);
    dispatch({ type: "complete", language, path, entryId: entry.id });
  }
  return <main className="daily-workspace web-daily-workspace" id="main-content"><div className="daily-title"><div><span className="eyebrow">{languages[language].name.toUpperCase()} · DAILY PRACTICE</span><h1>{step === 5 ? "You finished today's practice!" : plan.concept.title}</h1><p>{step === 5 ? "You explored a concept and completed four checks in a real browser preview." : "One concept, three rendering exercises, and one coding challenge. Your steps and code are saved."}</p></div><button className="text-button" onClick={exit}>Back to practice</button></div><ol className="daily-step-list" aria-label="Daily practice steps">{["Concept", "Render 1", "Render 2", "Render 3", "Code"].map((label, index) => <li key={label} className={step === index ? "current" : completed.includes(markers[index]) ? "done" : ""}><button aria-current={step === index ? "step" : undefined} disabled={first >= 0 && index > first} onClick={() => setStep(index)}>{completed.includes(markers[index]) ? <Icon name="check" size={15}/> : <span>{index + 1}</span>}{label}</button></li>)}</ol>
    {step === 5 ? <section className="daily-finish"><span className="daily-finish-icon"><Icon name="check" size={32}/></span><h2>{profile?.name ? `Well done, ${profile.name}!` : "Well done!"}</h2><p>All five steps are saved. Come back tomorrow for another session.</p><div className="exercise-actions"><button className="primary-button" onClick={exit}>Keep exploring</button><button className="secondary-button" onClick={() => setStep(0)}>Review this session</button></div></section> : <><WebLesson key={`${plan.key}-${step}`} lesson={entry} language={language} path={path} draftEntryId={draftEntryId} initialMode={step === initialStep ? initialMode : step === 0 ? "teach" : "practice"} draftValue={state.drafts[learningKey({ language, path, entryId: draftEntryId })]?.value} onDraft={onDraft} onSessionChange={onSessionChange} onVisit={onVisit} markCompleted={complete} bookmarks={state.bookmarks} toggleBookmark={item => dispatch({ type: "bookmark", ...item })} profile={profile}/><div className="daily-next"><span>{step === 0 ? "Explore the example, then continue." : completed.includes(markers[step]) ? "Rendered-page check complete" : "Edit the page and pass its check to continue."}</span><button className="primary-button" disabled={step > 0 && !completed.includes(markers[step])} onClick={() => { if (step === 0) finish("concept"); setStep(step + 1); }}>{step === 4 ? "Finish today's practice" : step === 3 ? "Continue to coding" : "Next rendering exercise"}</button></div></>}
  </main>;
}

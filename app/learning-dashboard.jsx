"use client";
import { useState } from "react";
import { Icon } from "./method-workspace";
import { languages, programmingLanguages } from "../lib/practice.mjs";
import { dueMistakes, learningKey, localDay } from "../lib/learning-state.mjs";
import { dailyPlan } from "../lib/daily-plan.mjs";

export default function LearningDashboard({state,language,openDaily,openNotebook,openTopic,loading=false}) {
  const [preferred,setPreferred]=useState(programmingLanguages[state.lastVisited?.language]?state.lastVisited.language:"javascript"),selected=programmingLanguages[language]?language:preferred;
  const plan=dailyPlan(selected),markers=state.daily[plan.key]?.completed||[],due=dueMistakes(state),completed=Object.values(state.completed).reduce((sum,list)=>sum+list.length,0);
  const last=state.lastVisited;
  return <section className="learning-dashboard" aria-label="Your practice dashboard">
    <div className="dashboard-stats"><span><strong>{completed}</strong> {completed===1?"topic":"topics"} practiced</span><span><strong>{state.stats.attempts}</strong> answers checked</span><span><strong>{state.stats.attempts?Math.round(state.stats.correct/state.stats.attempts*100):0}%</strong> answer accuracy</span></div>
    <div className="dashboard-cards">
      <article className="daily-card"><div className="dashboard-card-heading"><span className="eyebrow">TODAY'S PRACTICE</span><span className="daily-duration">10–15 min</span></div><h2>{plan.concept.title}</h2><p>One concept, three predictions, one coding exercise.</p>{!language&&<label className="daily-language-label">Practice language<select value={selected} onChange={event=>setPreferred(event.target.value)}>{Object.entries(programmingLanguages).map(([id,item])=><option value={id} key={id}>{item.name}</option>)}</select></label>}<div className="daily-card-bottom"><span>{markers.length}/5 steps complete</span><button className="primary-button" disabled={loading} onClick={()=>openDaily(selected)}>{markers.length===5?"Review today's practice":markers.length?"Continue daily practice":"Start daily practice"}</button></div></article>
      <article className="continue-card"><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>{last?last.title:"Your next clear idea"}</h2><p>{last?`${languages[last.language].name} · ${last.mode === "test" ? "Test yourself" : last.mode === "practice" ? "Practice" : "Learning"}`:"Choose a language below. Your latest topic will appear here."}</p>{last&&<button className="secondary-button" disabled={loading} onClick={()=>openTopic(last)}>Continue learning</button>}<div className="review-preview"><Icon name="bulb" size={18}/><div><strong>{due.length?`${due.length} ${due.length===1?"question needs":"questions need"} another try`:"Your mistake notebook"}</strong><p>{state.mistakes.length?"Revisit missed answers and follow your improvement.":"Missed answers will be saved with their explanations."}</p></div></div><button className="text-button" onClick={openNotebook}>{due.length?"Practice my weak topics":"Open mistake notebook"}</button></article>
    </div>
    {(state.bookmarks.length>0||state.quizzes.length>0)&&<div className="saved-learning-row">{state.bookmarks.length>0&&<div><h3>Bookmarked topics</h3><div className="bookmark-list">{state.bookmarks.slice(-5).reverse().map(item=><button className="bookmark-chip" key={learningKey(item)} onClick={()=>openTopic({...item,mode:"learn"})}>{languages[item.language].mark} · {item.title}</button>)}</div></div>}{state.quizzes.length>0&&<div className="recent-quiz"><h3>Latest quiz</h3><p>{languages[state.quizzes.at(-1).language].name} · {state.quizzes.at(-1).title} <strong>{state.quizzes.at(-1).score}/{state.quizzes.at(-1).total}</strong></p></div>}</div>}
  </section>;
}

export function SaveStatus({status,retry}) {return <div className={`learning-save-status ${status}`} role="status">{status==="loading"?"Loading your saved learning…":status==="saving"?"Saving your learning…":status==="saved"?"Your learning is saved":<>Your latest changes are not saved yet. <button className="text-button" onClick={retry}>Retry saving</button></>}</div>;}

export function TopicBookmark({item,bookmarks,toggle}) {const saved=bookmarks.some(entry=>learningKey(entry)===learningKey(item));return <button className={`topic-bookmark ${saved?"saved":""}`} aria-pressed={saved} onClick={()=>toggle(item)}><Icon name="book" size={16}/>{saved?"Bookmarked":"Bookmark topic"}</button>;}

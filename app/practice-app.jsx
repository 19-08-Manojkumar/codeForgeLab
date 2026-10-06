"use client";

import { useEffect, useRef, useState } from "react";
import MethodsWorkspace, { Icon } from "./method-workspace";
import PracticeWorkspace from "./practice-workspace";
import LearnerDialog, { LearnerBanner } from "./learner-dialog";
import { readLearnerSession, saveLearnerSession } from "../lib/learner.mjs";
import { languages, practicePaths } from "../lib/practice.mjs";
import { curricula } from "../lib/curriculum.mjs";
import { lessons, defaultConfig } from "../lib/lessons.mjs";
import { buildTrace, format } from "../lib/engine.mjs";

function LanguageMark({ language, small = false }) { return <span className={`language-mark ${language} ${small ? "small" : ""}`} aria-hidden="true">{languages[language].mark}</span>; }
const methodCount = language => lessons[language]?.length || curricula[language].references.length;
const pathCount = (language, path) => path === "methods" ? methodCount(language) : path === "basics" ? curricula[language].topics.length : path === "interviews" ? curricula[language].interviews.length : curricula[language].problems.length;

export default function PracticeApp() {
  const [language, setLanguage] = useState(null), [path, setPath] = useState(null), [initialEntry, setInitialEntry] = useState(null);
  const [profile, setProfile] = useState(null), [profileOpen, setProfileOpen] = useState(false), [completed, setCompleted] = useState({});
  const [experiment, setExperiment] = useState(null), [workspaceRevision, setWorkspaceRevision] = useState(0);
  const headingRef = useRef(null), initializedRef = useRef(false);
  useEffect(() => { let storage; try { storage = window.sessionStorage; } catch {} const saved = readLearnerSession(storage); setProfile(saved.profile); setProfileOpen(!saved.handled); }, []);
  useEffect(() => { if (initializedRef.current) headingRef.current?.focus(); else initializedRef.current = true; }, [language, path]);
  function saveProfile(next) { let storage; try { storage = window.sessionStorage; } catch {} saveLearnerSession(storage, next); setProfile(next); setProfileOpen(false); }
  function closeProfile() { if (!profile) saveProfile(null); else setProfileOpen(false); }
  function chooseLanguage(next) { setLanguage(next); setPath(null); setInitialEntry(null); setExperiment(null); }
  function choosePath(next, entry = null) { setPath(next); setInitialEntry(entry); setExperiment(null); }
  function markCompleted(id) { const key = `${language}:${path}`; setCompleted(current => ({ ...current, [key]: [...new Set([...(current[key] || []), id])] })); }
  function goHome() { setLanguage(null); setPath(null); setExperiment(null); }

  useEffect(() => {
    const registry = document.modelContext; if (!registry?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = { name: "configure_method_experiment", description: "Select a JavaScript or Python method, validate example values, and open its animation.", inputSchema: { type: "object", properties: { language: {type:"string",enum:["javascript","python"]}, method: {type:"string"}, input:{type:"string"},operation:{type:"string"},parameter:{type:"string"},extra:{type:"string"},additions:{type:"string"} }, required:["language","method"], additionalProperties:false }, annotations: {readOnlyHint:false,untrustedContentHint:true}, execute(data) {
      const lesson = lessons[data?.language]?.find(item => item.id === data.method); if (!lesson) throw new Error("Choose an available JavaScript or Python method.");
      const config = defaultConfig(lesson); for (const field of ["input","operation","parameter","extra","additions"]) if (data[field] !== undefined) { if (typeof data[field] !== "string") throw new Error(`${field} must be text.`); config[field] = data[field]; }
      const trace = buildTrace(lesson,config); setLanguage(data.language); setPath("methods"); setExperiment({method:lesson.id,config}); setWorkspaceRevision(current=>current+1);
      return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({language:data.language,method:lesson.id,result:format(trace.result,data.language),steps:trace.frames.length-1}))));
    }};
    try { Promise.resolve(registry.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{}); } catch {} return ()=>lifecycle.abort();
  }, []);

  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header practice-header">
      <button className="brand" aria-label="MethodLab home" onClick={goHome}><span className="brand-mark"><Icon name="code" size={20}/></span><span>method<span className="brand-bold">lab</span><span className="brand-period">.</span></span></button>
      <nav className="language-switch" aria-label="Choose language">{Object.keys(languages).map(id=><button key={id} aria-pressed={language===id} className={language===id?"selected":""} onClick={()=>chooseLanguage(id)}><LanguageMark language={id} small/>{languages[id].name}</button>)}</nav>
      <div className="header-actions">{language && <button className="text-button paths-trigger" onClick={()=>choosePath(null)}>Practice paths</button>}<button className="profile-trigger" onClick={()=>setProfileOpen(true)} aria-label="Your profile" title="Your profile"><Icon name="user" size={18}/></button></div>
    </header>
    <LearnerDialog open={profileOpen} profile={profile} save={saveProfile} cancel={closeProfile} clear={()=>saveProfile(null)}/>
    {!language ? <main className="practice-home" id="main-content">
      <LearnerBanner profile={profile} edit={()=>setProfileOpen(true)}/>
      <div className="practice-intro"><span className="eyebrow">YOUR NEXT LINE OF CODE STARTS HERE</span><h1 ref={headingRef} tabIndex={-1}>What will you practice today?</h1><p>Choose a language, then choose your path.</p></div>
      <div className="practice-language-grid">{Object.entries(languages).map(([id,info])=><button key={id} className={`language-card ${id}-card`} data-language={id} onClick={()=>chooseLanguage(id)}><div className="language-card-top"><LanguageMark language={id}/><span className="small-tag">4 practice paths</span></div><h2>{info.name}</h2><p>{info.description}</p><div className="language-card-bottom"><span>Explore {info.name}</span><span className="round-icon"><Icon name="code"/></span></div></button>)}</div>
    </main> : !path ? <main className="practice-home path-hub" id="main-content">
      <LearnerBanner profile={profile} edit={()=>setProfileOpen(true)}/>
      <div className="breadcrumb"><button onClick={goHome}>Languages</button><span>/</span><span>{languages[language].name}</span></div>
      <div className="practice-intro"><div className="path-language-heading"><LanguageMark language={language}/><div><span className="eyebrow">CHOOSE YOUR PRACTICE PATH</span><h1 ref={headingRef} tabIndex={-1}>{languages[language].name}: where do you want to start?</h1></div></div><p>Pick a focus. Each path gives you a topic, an explanation, and a way to practice.</p></div>
      <div className="practice-path-grid">{practicePaths.map(item=><button key={item.id} className={`practice-path-card ${item.id}`} data-path={item.id} onClick={()=>choosePath(item.id)}><div className="path-card-top"><span className="path-number">{item.number}</span><span className="path-icon"><Icon name={item.icon} size={24}/></span></div><h2>{item.title}</h2><p>{item.description}</p><div className="path-card-bottom"><span>{pathCount(language,item.id)} {item.id==="methods"?"methods & functions":item.id==="basics"?"topics":item.id==="interviews"?"questions":"problems"}</span><span>{completed[`${language}:${item.id}`]?.length ? `${completed[`${language}:${item.id}`].length} ${item.id === "methods" && lessons[language] ? "explored" : "practiced"}` : item.action}</span></div></button>)}</div>
    </main> : path === "methods" && lessons[language] ? <MethodsWorkspace key={`${language}-${workspaceRevision}`} initialLanguage={language} initialExperiment={experiment} initialExplored={completed[`${language}:methods`]||[]} onExplored={markCompleted} profile={profile} editProfile={()=>setProfileOpen(true)} onExit={()=>choosePath(null)}/> : <PracticeWorkspace key={`${language}-${path}-${initialEntry || ""}`} language={language} path={path} initialEntry={initialEntry} profile={profile} editProfile={()=>setProfileOpen(true)} completed={completed[`${language}:${path}`]||[]} markCompleted={markCompleted} changePath={choosePath}/>} 
    <footer className="site-footer"><span>methodlab<span className="brand-period">.</span></span><span>Understand. Trace. Practice.</span><span>JavaScript · Python · Java · C</span></footer>
  </>;
}

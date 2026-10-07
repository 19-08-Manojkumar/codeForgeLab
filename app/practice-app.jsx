"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MethodsWorkspace, { Icon } from "./method-workspace";
import PracticeWorkspace from "./practice-workspace";
import WebWorkspace from "./web-workspace";
import LearnerDialog, { LearnerBanner } from "./learner-dialog";
import CodeAtmosphere from "./code-atmosphere";
import useLearningStore from "./use-learning-store";
import LearningDashboard, { SaveStatus } from "./learning-dashboard";
import DailyPractice from "./daily-practice";
import MistakeNotebook from "./mistake-notebook";
import { learningKey } from "../lib/learning-state.mjs";
import { readLearnerSession, saveLearnerSession } from "../lib/learner.mjs";
import { languages, practicePaths } from "../lib/practice.mjs";
import { curricula } from "../lib/curriculum.mjs";
import { lessons, defaultConfig } from "../lib/lessons.mjs";
import { buildTrace, format } from "../lib/engine.mjs";
import { webSessions, webLessons } from "../lib/web-lessons.mjs";

function LanguageMark({ language, small = false }) { return <span className={`language-mark ${language} ${small ? "small" : ""}`} aria-hidden="true">{languages[language].mark}</span>; }
const methodCount = language => lessons[language]?.length || curricula[language].references.length;
const pathCount = (language, path) => path === "methods" ? methodCount(language) : path === "basics" ? curricula[language].topics.length : path === "interviews" ? curricula[language].interviews.length : curricula[language].problems.length;

export default function PracticeApp() {
  const [language, setLanguage] = useState(null), [path, setPath] = useState(null), [initialEntry, setInitialEntry] = useState(null);
  const [profile, setProfile] = useState(null), [profileOpen, setProfileOpen] = useState(false);
  const learning=useLearningStore(), {state:learningState,dispatch}=learning,completed=learningState.completed;
  const [screen,setScreen]=useState("browse"),[resumeMode,setResumeMode]=useState("learn");
  const [experiment, setExperiment] = useState(null), [workspaceRevision, setWorkspaceRevision] = useState(0);
  const [backgroundPaused, setBackgroundPaused] = useState(false);
  const [session, setSession] = useState("home");
  const activeSession = screen==="daily"?session:screen==="notebook"?"test":!language ? "home" : !path ? "hub" : session;
  const headingRef = useRef(null), initializedRef = useRef(false),profileHydrated=useRef(false);
  useEffect(()=>{if(learning.status!=="loading"&&!profileHydrated.current){let storage;try{storage=sessionStorage;}catch{}const legacy=readLearnerSession(storage);profileHydrated.current=true;setProfile(learningState.handled?learningState.profile:legacy.profile);setProfileOpen(!learningState.handled&&!legacy.handled);}},[learning.status,learningState.handled,learningState.profile]);
  useEffect(() => { if (initializedRef.current) headingRef.current?.focus(); else initializedRef.current = true; }, [language, path]);
  function saveProfile(next) { let storage; try { storage = window.sessionStorage; } catch {} saveLearnerSession(storage, next); dispatch({type:"profile",profile:next});setProfile(next);setProfileOpen(false); }
  function closeProfile() { if (!profile){let storage;try{storage=sessionStorage;}catch{}saveLearnerSession(storage,null);dispatch({type:"welcome"});}setProfileOpen(false); }
  function chooseLanguage(next) { setScreen("browse");setLanguage(next); setPath(webSessions[next] ? "render" : null); setInitialEntry(null); setExperiment(null); setResumeMode("teach"); setSession(webSessions[next] ? "teach" : "hub"); }
  function choosePath(next, entry = null) { setScreen("browse");setResumeMode("teach");setPath(next); setInitialEntry(entry); setExperiment(null); setSession(next === "methods" && lessons[language] ? "learn" : "teach"); }
  function markCompleted(id) { dispatch({type:"complete",language,path,entryId:id}); }
  function goHome() { setScreen("browse");setLanguage(null);setPath(null);setExperiment(null);setSession("home"); }
  const onVisit=useCallback(visit=>{dispatch({type:"visit",visit});if(visit.config)dispatch({type:"draft",...visit,config:visit.config});},[dispatch]);
  const onAnswer=useCallback(answer=>dispatch({type:"answer",answer}),[dispatch]);
  const onQuizComplete=useCallback(quiz=>dispatch({type:"quiz",...quiz}),[dispatch]);
  const onDraft=useCallback(draft=>dispatch({type:"draft",...draft}),[dispatch]);
  const toggleBookmark=useCallback(item=>dispatch({type:"bookmark",...item}),[dispatch]);
  function openTopic(item){setScreen("browse");setLanguage(item.language);setPath(item.path);setInitialEntry(item.entryId);setResumeMode(item.mode||"learn");setSession(item.mode||"learn");if(lessons[item.language]&&item.path==="methods"){const topic=lessons[item.language].find(entry=>entry.id===item.entryId);if(topic)setExperiment({method:topic.id,config:learningState.drafts[learningKey(item)]?.config||item.config||defaultConfig(topic)});}else setExperiment(null);setWorkspaceRevision(value=>value+1);}
  function openDaily(next){if(learning.status==="loading")return;setLanguage(next);setPath(null);setScreen("daily");setSession("teach");}
  function openNotebook(){setScreen("notebook");setPath(null);setSession("test");}

  useEffect(() => {
    const registry = document.modelContext; if (!registry?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = { name: "configure_method_experiment", description: "Select a JavaScript or Python method, validate example values, and open its animation.", inputSchema: { type: "object", properties: { language: {type:"string",enum:["javascript","python"]}, method: {type:"string"}, input:{type:"string"},operation:{type:"string"},parameter:{type:"string"},extra:{type:"string"},additions:{type:"string"} }, required:["language","method"], additionalProperties:false }, annotations: {readOnlyHint:false,untrustedContentHint:true}, execute(data) {
      const lesson = lessons[data?.language]?.find(item => item.id === data.method); if (!lesson) throw new Error("Choose an available JavaScript or Python method.");
      const config = defaultConfig(lesson); for (const field of ["input","operation","parameter","extra","additions"]) if (data[field] !== undefined) { if (typeof data[field] !== "string") throw new Error(`${field} must be text.`); config[field] = data[field]; }
      const trace = buildTrace(lesson,config); setLanguage(data.language); setPath("methods"); setScreen("browse");setResumeMode("learn");setSession("learn"); setExperiment({method:lesson.id,config}); setWorkspaceRevision(current=>current+1);
      return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({language:data.language,method:lesson.id,result:format(trace.result,data.language),steps:trace.frames.length-1}))));
    }};
    try { Promise.resolve(registry.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{}); } catch {} return ()=>lifecycle.abort();
  }, []);

  return <div className="app-scene" data-scene={screen!=="browse"?"workspace":!language?"home":!path?"paths":"workspace"} data-language={language || "all"} data-session={activeSession} data-path={path || "none"} data-background-paused={backgroundPaused}>
    <CodeAtmosphere language={language} session={activeSession} path={path}/>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header practice-header">
      <button className="brand" aria-label="MethodLab home" onClick={goHome}><span className="brand-mark"><Icon name="code" size={20}/></span><span>method<span className="brand-bold">lab</span><span className="brand-period">.</span></span></button>
      <nav className="language-switch" aria-label="Choose language">{Object.keys(languages).map(id=><button key={id} aria-pressed={language===id} className={language===id?"selected":""} onClick={()=>chooseLanguage(id)}><LanguageMark language={id} small/>{languages[id].name}</button>)}</nav>
      <div className="header-actions"><button className="notebook-trigger" aria-label="Mistake notebook" title="Mistake notebook" onClick={openNotebook}><Icon name="book" size={17}/><span>Mistakes</span></button>{language && !webSessions[language] && <button className="text-button paths-trigger" onClick={()=>choosePath(null)}>Practice paths</button>}<button className="ambient-toggle" aria-pressed={backgroundPaused} aria-label={backgroundPaused ? "Resume background animations" : "Pause background animations"} title={backgroundPaused ? "Resume background animations" : "Pause background animations"} onClick={()=>setBackgroundPaused(current=>!current)}><Icon name={backgroundPaused ? "play" : "pause"} size={15}/><span>{backgroundPaused ? "Resume motion" : "Pause motion"}</span></button><button className="profile-trigger" disabled={learning.status==="loading"} onClick={()=>setProfileOpen(true)} aria-label="Your profile" title="Your profile"><Icon name="user" size={18}/></button></div>
    </header>
    <LearnerDialog open={profileOpen} profile={profile} save={saveProfile} cancel={closeProfile} clear={()=>saveProfile(null)}/>
    <SaveStatus status={learning.status} retry={learning.retry}/>
    {screen==="daily"?<DailyPractice key={language} language={language} state={learningState} dispatch={dispatch} profile={profile} onDraft={onDraft} onSessionChange={setSession} exit={goHome}/>:screen==="notebook"?<MistakeNotebook state={learningState} onAnswer={onAnswer} openTopic={openTopic} exit={goHome}/>:!language ? <main className="practice-home" id="main-content">
      <LearnerBanner profile={profile} edit={()=>setProfileOpen(true)}/>
      <div className="practice-intro"><span className="eyebrow">YOUR NEXT LINE OF CODE STARTS HERE</span><h1 ref={headingRef} tabIndex={-1}>What will you practice today?</h1><p>Explore a programming language, or build and style a page in the HTML and CSS sessions.</p></div>
      <LearningDashboard loading={learning.status==="loading"} state={learningState} openDaily={openDaily} openNotebook={openNotebook} openTopic={openTopic}/>
      <div className="practice-language-grid">{Object.entries(languages).map(([id,info])=><button key={id} className={`language-card ${id}-card`} data-language={id} onClick={()=>chooseLanguage(id)}><div className="language-card-top"><LanguageMark language={id}/><span className="small-tag">{webSessions[id] ? "Live browser preview" : "4 practice paths"}</span></div><h2>{info.name}</h2><p>{info.description}</p><div className="language-card-bottom"><span>{webSessions[id] ? `${webLessons[id].length} visual lessons` : `Explore ${info.name}`}</span><span className="round-icon"><Icon name="code"/></span></div></button>)}</div>
    </main> : webSessions[language] ? <WebWorkspace key={`${language}-${workspaceRevision}`} language={language} initialEntry={initialEntry} initialMode={resumeMode} profile={profile} editProfile={()=>setProfileOpen(true)} completed={completed[`${language}:render`]||[]} markCompleted={markCompleted} onVisit={onVisit} onDraft={onDraft} onSessionChange={setSession} drafts={learningState.drafts} bookmarks={learningState.bookmarks} toggleBookmark={toggleBookmark} exit={goHome} changeSession={chooseLanguage}/> : !path ? <main className="practice-home path-hub" id="main-content">
      <LearnerBanner profile={profile} edit={()=>setProfileOpen(true)}/>
      <div className="breadcrumb"><button onClick={goHome}>Languages</button><span>/</span><span>{languages[language].name}</span></div>
      <div className="practice-intro"><div className="path-language-heading"><LanguageMark language={language}/><div><span className="eyebrow">CHOOSE YOUR PRACTICE PATH</span><h1 ref={headingRef} tabIndex={-1}>{languages[language].name}: where do you want to start?</h1></div></div><p>Pick a focus. Each path gives you a topic, an explanation, and a way to practice.</p></div>
      <LearningDashboard state={learningState} language={language} openDaily={openDaily} openNotebook={openNotebook} openTopic={openTopic}/>
      <div className="practice-path-grid">{practicePaths.map(item=><button key={item.id} className={`practice-path-card ${item.id}`} data-path={item.id} onClick={()=>choosePath(item.id)}><div className="path-card-top"><span className="path-number">{item.number}</span><span className="path-icon"><Icon name={item.icon} size={24}/></span></div><h2>{item.title}</h2><p>{item.description}</p><div className="path-card-bottom"><span>{pathCount(language,item.id)} {item.id==="methods"?"methods & functions":item.id==="basics"?"topics":item.id==="interviews"?"questions":"problems"}</span><span>{completed[`${language}:${item.id}`]?.length ? `${completed[`${language}:${item.id}`].length} ${item.id === "methods" && lessons[language] ? "explored" : "practiced"}` : item.action}</span></div></button>)}</div>
    </main> : path === "methods" && lessons[language] ? <MethodsWorkspace key={`${language}-${workspaceRevision}`} initialLanguage={language} initialExperiment={experiment} initialExplored={completed[`${language}:methods`]||[]} onExplored={markCompleted} profile={profile} editProfile={()=>setProfileOpen(true)} onExit={()=>choosePath(null)} onSessionChange={setSession} onVisit={onVisit} onAnswer={onAnswer} onQuizComplete={onQuizComplete} initialMode={resumeMode} bookmarks={learningState.bookmarks} toggleBookmark={toggleBookmark}/> : <PracticeWorkspace key={`${language}-${path}-${initialEntry || ""}-${workspaceRevision}`} language={language} path={path} initialEntry={initialEntry} profile={profile} editProfile={()=>setProfileOpen(true)} completed={completed[`${language}:${path}`]||[]} markCompleted={markCompleted} changePath={choosePath} onSessionChange={setSession} onVisit={onVisit} onAnswer={onAnswer} onDraft={onDraft} initialMode={resumeMode} drafts={learningState.drafts} bookmarks={learningState.bookmarks} toggleBookmark={toggleBookmark}/>}
    <footer className="site-footer"><span>methodlab<span className="brand-period">.</span></span><a className="creator-credit" href="https://manojkumar-dev.vercel.app/" target="_blank" rel="noopener noreferrer"><span>Created by</span> Manoj Kumar <Icon name="code" size={15}/></a><span>JavaScript · Python · Java · C · HTML · CSS</span></footer>
  </div>;
}

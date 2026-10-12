"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MethodsWorkspace, { Icon } from "./method-workspace";
import PracticeWorkspace from "./practice-workspace";
import WebWorkspace from "./web-workspace";
import CodeAtmosphere from "./code-atmosphere";
import useLearningStore from "./use-learning-store";
import useAccount from "./use-account";
import AccountDialog from "./account-dialog";
import LearningDashboard, { SaveStatus } from "./learning-dashboard";
import DailyPractice from "./daily-practice";
import MistakeNotebook from "./mistake-notebook";
import { learningKey } from "../lib/learning-state.mjs";
import { accountLearningProfile } from "../lib/account-profile.mjs";
import useCodingTime from "./use-coding-time";
import usePracticeDay from "./use-practice-day";
import CodingJourney, { MilestoneCelebration, JourneyDetails } from "./coding-journey";
import { codingSummary } from "../lib/coding-activity.mjs";
import { languages, practicePaths } from "../lib/practice.mjs";
import { curricula } from "../lib/curriculum.mjs";
import { lessons, defaultConfig } from "../lib/lessons.mjs";
import { buildTrace, format } from "../lib/engine.mjs";
import { webSessions } from "../lib/web-lessons.mjs";
import { getWebPracticeEntries, webPracticePaths } from "../lib/web-practice.mjs";
import RelatedLearning from "./related-learning";
import { siteBrand } from "../lib/site.mjs";

function LanguageMark({ language, small = false }) { return <span className={`language-mark ${language} ${small ? "small" : ""}`} aria-hidden="true">{languages[language].mark}</span>; }
const methodCount = language => lessons[language]?.length || curricula[language].references.length;
const sessionLabels = { javascript:"Methods & web logic",python:"Python essentials",java:"Java fundamentals",c:"C programming",html:"Build page structure",css:"Style & layouts" };
const pathCount = (language, path) => webSessions[language] ? getWebPracticeEntries(language, path).length : path === "methods" ? methodCount(language) : path === "basics" ? curricula[language].topics.length : path === "interviews" ? curricula[language].interviews.length : curricula[language].problems.length;

export default function PracticeApp() {
  const [language, setLanguage] = useState(null), [path, setPath] = useState(null), [initialEntry, setInitialEntry] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountInitialMode, setAccountInitialMode] = useState("signin");
  const account=useAccount(), learning=useLearningStore(account), {state:learningState,dispatch}=learning,completed=learningState.completed,profile=accountLearningProfile(account.user, learningState);
  const profileUnavailable = ["unavailable", "account-unavailable"].includes(learning.status);
  const [screen,setScreen]=useState("browse"),[resumeMode,setResumeMode]=useState("learn");
  const [experiment, setExperiment] = useState(null), [workspaceRevision, setWorkspaceRevision] = useState(0);
  const [backgroundPaused, setBackgroundPaused] = useState(false);
  const [session, setSession] = useState("home");
  const practiceDay = usePracticeDay();
  const coding = practiceDay ? codingSummary(learningState, practiceDay) : null;
  useCodingTime({ enabled: learning.status !== "loading" && !accountOpen && (screen === "daily" || !!language && !!path), identity: learning.identity, dispatch });
  const activeSession = screen==="daily"?session:screen==="notebook"?"test":!language ? "home" : !path ? "hub" : session;
  const headingRef = useRef(null), initializedRef = useRef(false);
  useEffect(() => { if (initializedRef.current) headingRef.current?.focus(); else initializedRef.current = true; }, [language, path]);
  function saveProfile(next) { if (account.user && learning.status !== "loading" && !profileUnavailable) dispatch({type:"profile",profile:next}); }
  function openAccount(mode = "signin") { setAccountInitialMode(account.user ? mode === "edit" ? "edit" : "profile" : "signin"); setAccountOpen(true); }
  function editProfile() { openAccount("edit"); }
  function closeAccount() { setAccountOpen(false); }
  function chooseLanguage(next) { setScreen("browse");setLanguage(next); setPath(null); setInitialEntry(null); setExperiment(null); setResumeMode("teach"); setSession("hub"); }
  function choosePath(next, entry = null) { setScreen("browse");setResumeMode(webSessions[language] && next === "problems" ? "practice" : "teach");setPath(next); setInitialEntry(entry); setExperiment(null); setSession(next === "methods" && lessons[language] ? "learn" : "teach"); }
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
      <button className="brand" aria-label={`${siteBrand.name} home`} onClick={goHome}><span className="brand-mark"><Icon name="code" size={20}/></span><span className="brand-wordmark">Code<span className="brand-bold">Forge</span> <span className="brand-lab">Lab</span><span className="brand-period">.</span></span></button>
      <nav className="language-switch" aria-label="Choose language">{Object.keys(languages).map(id=><button key={id} aria-pressed={language===id} className={language===id?"selected":""} onClick={()=>chooseLanguage(id)}><LanguageMark language={id} small/>{languages[id].name}</button>)}</nav>
      <div className="header-actions"><button className="notebook-trigger" aria-label="Mistake notebook" title="Mistake notebook" onClick={openNotebook}><Icon name="book" size={17}/><span>Mistakes</span></button>{language && <button className="text-button paths-trigger" onClick={()=>choosePath(null)}>Practice paths</button>}<button className="ambient-toggle" aria-pressed={backgroundPaused} aria-label={backgroundPaused ? "Resume background animations" : "Pause background animations"} title={backgroundPaused ? "Resume background animations" : "Pause background animations"} onClick={()=>setBackgroundPaused(current=>!current)}><Icon name={backgroundPaused ? "play" : "pause"} size={15}/><span>{backgroundPaused ? "Resume motion" : "Pause motion"}</span></button><button className="account-trigger" disabled={account.status==="loading"} aria-haspopup="dialog" aria-expanded={accountOpen} aria-controls="account-dialog" onClick={()=>openAccount()}>{account.user?"Profile":"Login"}</button></div>
    </header>
    <AccountDialog open={accountOpen} account={account} profile={profile} coding={coding} motionPaused={backgroundPaused} initialMode={accountInitialMode} close={closeAccount} saveProfile={saveProfile} profileLoading={learning.status==="loading"} profileUnavailable={profileUnavailable} profileSaving={learning.status==="saving"} retryProfile={learning.retry}/>
    <MilestoneCelebration summary={coding} identity={learning.identity} loading={learning.status==="loading"} motionPaused={backgroundPaused}/>
    <SaveStatus status={learning.status} retry={learning.retry} configured={account.configured}/>
    {screen==="daily"?<DailyPractice key={language} language={language} state={learningState} dispatch={dispatch} profile={profile} onDraft={onDraft} onSessionChange={setSession} exit={webSessions[language] ? () => choosePath(null) : goHome}/>:screen==="notebook"?<MistakeNotebook state={learningState} onAnswer={onAnswer} openTopic={openTopic} exit={goHome}/>:!language ? <main className="practice-home home-overview" id="main-content">
      <div className="practice-intro"><h1 ref={headingRef} tabIndex={-1}>Your next coding session<span className="brand-period">.</span></h1><p>Pick a language. Keep your momentum.</p></div>
      <CodingJourney summary={coding} today={practiceDay} startPractice={()=>openDaily(learningState.lastVisited?.language||"javascript")} loading={learning.status==="loading"} signedIn={!!account.user} saveStatus={learning.status} motionPaused={backgroundPaused}/>
      <section className="home-sessions" aria-labelledby="home-sessions-title"><div className="home-section-heading"><h2 id="home-sessions-title">Learning sessions</h2><span>6 languages · 4 paths each</span></div><div className="practice-language-grid">{Object.entries(languages).map(([id,info])=><button key={id} className={`language-card ${id}-card`} data-language={id} onClick={()=>chooseLanguage(id)}><LanguageMark language={id}/><div className="home-session-label"><h3>{info.name}</h3><p>{sessionLabels[id]}</p></div><Icon name="chevron" size={17}/></button>)}</div></section>
      <RelatedLearning compact/>
      <LearningDashboard compact loading={learning.status==="loading"} state={learningState} openDaily={openDaily} openNotebook={openNotebook} openTopic={openTopic}/>
      <JourneyDetails summary={coding} today={practiceDay} loading={learning.status==="loading"}/>
    </main> : !path ? <main className="practice-home path-hub" id="main-content">
      <div className="breadcrumb"><button onClick={goHome}>Languages</button><span>/</span><span>{languages[language].name}</span></div>
      <div className="practice-intro"><div className="path-language-heading"><LanguageMark language={language}/><div><span className="eyebrow">CHOOSE YOUR PRACTICE PATH</span><h1 ref={headingRef} tabIndex={-1}>{languages[language].name}: where do you want to start?</h1></div></div><p>Pick a focus. Each path gives you a topic, an explanation, and a way to practice.</p></div>
      <LearningDashboard compact state={learningState} language={language} openDaily={openDaily} openNotebook={openNotebook} openTopic={openTopic}/>
      <div className="practice-path-grid">{(webSessions[language] ? webPracticePaths(language) : practicePaths).map(item=><button key={item.id} className={`practice-path-card ${item.id}`} data-path={item.id} onClick={()=>choosePath(item.id)}><div className="path-card-top"><span className="path-number">{item.number}</span><span className="path-icon"><Icon name={item.icon} size={24}/></span></div><h2>{item.title}</h2><p>{item.description}</p><div className="path-card-bottom"><span>{pathCount(language,item.id)} {item.id==="render"?"visual lessons":item.id==="methods"?"methods & functions":item.id==="basics"?"topics":item.id==="interviews"?"questions":"problems"}</span><span>{completed[`${language}:${item.id}`]?.length ? `${completed[`${language}:${item.id}`].length} ${item.id === "methods" && lessons[language] ? "explored" : "practiced"}` : item.action}</span></div></button>)}</div>
    </main> : webSessions[language] ? <WebWorkspace key={`${language}-${path}-${workspaceRevision}`} language={language} path={path} changePath={choosePath} initialEntry={initialEntry} initialMode={resumeMode} profile={profile} editProfile={editProfile} completed={completed[`${language}:${path}`]||[]} markCompleted={markCompleted} onVisit={onVisit} onDraft={onDraft} onSessionChange={setSession} drafts={learningState.drafts} bookmarks={learningState.bookmarks} toggleBookmark={toggleBookmark} exit={goHome}/> : path === "methods" && lessons[language] ? <MethodsWorkspace key={`${language}-${workspaceRevision}`} initialLanguage={language} initialExperiment={experiment} initialExplored={completed[`${language}:methods`]||[]} onExplored={markCompleted} profile={profile} editProfile={editProfile} onExit={()=>choosePath(null)} onSessionChange={setSession} onVisit={onVisit} onAnswer={onAnswer} onQuizComplete={onQuizComplete} initialMode={resumeMode} bookmarks={learningState.bookmarks} toggleBookmark={toggleBookmark}/> : <PracticeWorkspace key={`${language}-${path}-${initialEntry || ""}-${workspaceRevision}`} language={language} path={path} initialEntry={initialEntry} profile={profile} editProfile={editProfile} completed={completed[`${language}:${path}`]||[]} markCompleted={markCompleted} changePath={choosePath} onSessionChange={setSession} onVisit={onVisit} onAnswer={onAnswer} onDraft={onDraft} initialMode={resumeMode} drafts={learningState.drafts} bookmarks={learningState.bookmarks} toggleBookmark={toggleBookmark}/>}
    <footer className="site-footer"><span>{siteBrand.name}<span className="brand-period">.</span></span><a className="creator-credit" href="https://manojkumar-dev.vercel.app/" target="_blank" rel="noopener noreferrer"><span>Created by</span> Manoj Kumar <Icon name="code" size={15}/></a><span>JavaScript · Python · Java · C · HTML · CSS</span></footer>
  </div>;
}

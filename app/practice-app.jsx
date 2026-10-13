"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MethodsWorkspace, { Icon } from "./method-workspace";
import PracticeWorkspace from "./practice-workspace";
import WebWorkspace from "./web-workspace";
import WebDesignSession, { DesignLevelCards, DesignSessionLink } from "./web-design-session";
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
import useScrollToTop from "./use-scroll-to-top";
import usePageLocation from "./use-page-location";
import { LanguageCard, LanguageHubEffects, LanguagePortal, useLanguagePortal } from "./language-effects";
import CardDecoration from "./card-decoration";

function LanguageMark({ language, small = false }) { return <span className={`language-mark ${language} ${small ? "small" : ""}`} aria-hidden="true">{languages[language].mark}</span>; }
const methodCount = language => lessons[language]?.length || curricula[language].references.length;
const sessionLabels = { javascript:"Methods & web logic",python:"Python essentials",java:"Java fundamentals",c:"C programming",html:"Build page structure",css:"Style & layouts" };
const pathCount = (language, path) => webSessions[language] ? getWebPracticeEntries(language, path).length : path === "methods" ? methodCount(language) : path === "basics" ? curricula[language].topics.length : path === "interviews" ? curricula[language].interviews.length : curricula[language].problems.length;

export default function PracticeApp() {
  const { page, ready: navigationReady, revision: workspaceRevision, navigate, remember } = usePageLocation();
  const { language, path, screen, entryId: initialEntry, mode: resumeMode, level: designStartLevel, step: dailyStep } = page;
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountInitialMode, setAccountInitialMode] = useState("signin");
  const account=useAccount(), learning=useLearningStore(account), {state:learningState,dispatch}=learning,completed=learningState.completed,profile=accountLearningProfile(account.user, learningState);
  const profileUnavailable = ["unavailable", "account-unavailable"].includes(learning.status);
  const experiment = screen === "browse" && path === "methods" && lessons[language]?.find(topic => topic.id === initialEntry);
  const initialExperiment = experiment ? { method: experiment.id, config: learningState.drafts[learningKey({ language, path, entryId: initialEntry })]?.config || defaultConfig(experiment) } : null;
  const designTarget = screen === "design" ? initialEntry : null;
  const [backgroundPaused, setBackgroundPaused] = useState(false);
  const { portal, beginPortal, dismissPortal } = useLanguagePortal(backgroundPaused);
  const [session, setSession] = useState("home");
  const practiceDay = usePracticeDay();
  const coding = practiceDay ? codingSummary(learningState, practiceDay) : null;
  useCodingTime({ enabled: learning.status !== "loading" && !accountOpen && (screen === "daily" || screen === "design" || !!language && !!path), identity: learning.identity, dispatch });
  const activeSession = screen === "design" ? "practice" : screen==="daily"?session:screen==="notebook"?"test":!language ? "home" : !path ? "hub" : session;
  useScrollToTop(`${screen}:${language}:${path}:${activeSession}:${workspaceRevision}`);
  const headingRef = useRef(null), initializedRef = useRef(false);
  useEffect(() => { if (initializedRef.current) headingRef.current?.focus(); else initializedRef.current = true; }, [language, path]);
  function saveProfile(next) { if (account.user && learning.status !== "loading" && !profileUnavailable) dispatch({type:"profile",profile:next}); }
  function openAccount(mode = "signin") { setAccountInitialMode(account.user ? mode === "edit" ? "edit" : "profile" : "signin"); setAccountOpen(true); }
  function closeAccount() { setAccountOpen(false); }
  function chooseLanguage(next, event) { beginPortal(next, event?.currentTarget); navigate({ language: next }); setSession("hub"); }
  function choosePath(next, entry = null) { dismissPortal(); navigate({ language, path: next, entryId: entry }); setSession(next === "methods" && lessons[language] ? "learn" : "teach"); }
  function markCompleted(id) { dispatch({type:"complete",language,path,entryId:id}); }
  function goHome() { dismissPortal(); navigate({}); setSession("home"); }
  const onVisit=useCallback(visit=>{remember({ language: visit.language, path: visit.path, entryId: visit.entryId, mode: visit.mode });dispatch({type:"visit",visit});if(visit.config)dispatch({type:"draft",...visit,config:visit.config});},[dispatch,remember]);
  const onSessionChange = useCallback(mode => { setSession(mode); remember({ mode }); }, [remember]);
  const onDailyStepChange = useCallback(step => remember({ step }), [remember]);
  const onDesignLocationChange = useCallback(location => remember(location), [remember]);
  const onAnswer=useCallback(answer=>dispatch({type:"answer",answer}),[dispatch]);
  const onQuizComplete=useCallback(quiz=>dispatch({type:"quiz",...quiz}),[dispatch]);
  const onDraft=useCallback(draft=>dispatch({type:"draft",...draft}),[dispatch]);
  const toggleBookmark=useCallback(item=>dispatch({type:"bookmark",...item}),[dispatch]);
  function openTopic(item){dismissPortal();navigate({ screen: item.path === "design" ? "design" : "browse", language: item.language, path: item.path, entryId: item.entryId, mode: item.mode || "learn" });setSession(item.path === "design" ? "practice" : item.mode || "learn");}
  function openDaily(next){if(learning.status==="loading")return;dismissPortal();navigate({ screen: "daily", language: next });setSession("teach");}
  function openNotebook(){dismissPortal();navigate({ screen: "notebook" });setSession("test");}
  function openDesign(level = null){dismissPortal();navigate({ screen: "design", level });setSession("practice");}

  useEffect(() => {
    const registry = document.modelContext; if (!registry?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = { name: "configure_method_experiment", description: "Select a JavaScript or Python method, validate example values, and open its animation.", inputSchema: { type: "object", properties: { language: {type:"string",enum:["javascript","python"]}, method: {type:"string"}, input:{type:"string"},operation:{type:"string"},parameter:{type:"string"},extra:{type:"string"},additions:{type:"string"} }, required:["language","method"], additionalProperties:false }, annotations: {readOnlyHint:false,untrustedContentHint:true}, execute(data) {
      const lesson = lessons[data?.language]?.find(item => item.id === data.method); if (!lesson) throw new Error("Choose an available JavaScript or Python method.");
      const config = defaultConfig(lesson); for (const field of ["input","operation","parameter","extra","additions"]) if (data[field] !== undefined) { if (typeof data[field] !== "string") throw new Error(`${field} must be text.`); config[field] = data[field]; }
      const trace = buildTrace(lesson,config); dispatch({ type: "draft", language: data.language, path: "methods", entryId: lesson.id, config }); navigate({ language: data.language, path: "methods", entryId: lesson.id, mode: "learn" });setSession("learn");
      return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({language:data.language,method:lesson.id,result:format(trace.result,data.language),steps:trace.frames.length-1}))));
    }};
    try { Promise.resolve(registry.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{}); } catch {} return ()=>lifecycle.abort();
  }, [dispatch, navigate]);

  return <div className="app-scene" data-scene={screen!=="browse"?"workspace":!language?"home":!path?"paths":"workspace"} data-language={language || "all"} data-session={activeSession} data-path={path || "none"} data-background-paused={backgroundPaused}>
    <CodeAtmosphere language={screen === "design" ? "html" : language} session={activeSession} path={path}/>
    <LanguagePortal portal={portal}/>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header practice-header">
      <button className="brand" aria-label={`${siteBrand.name} home`} onClick={goHome}><span className="brand-mark"><Icon name="code" size={20}/></span><span className="brand-wordmark">Code<span className="brand-bold">Forge</span> <span className="brand-lab">Lab</span><span className="brand-period">.</span></span></button>
      <nav className="language-switch" aria-label="Choose language">{Object.keys(languages).map(id=><button key={id} aria-pressed={language===id} className={language===id?"selected":""} onClick={event=>chooseLanguage(id,event)}><LanguageMark language={id} small/>{languages[id].name}</button>)}</nav>
      <div className="header-actions"><button className="notebook-trigger" aria-label="Mistake notebook" title="Mistake notebook" onClick={openNotebook}><Icon name="book" size={17}/><span>Mistakes</span></button>{language && <button className="text-button paths-trigger" onClick={()=>choosePath(null)}>Practice paths</button>}<button className="ambient-toggle" aria-pressed={backgroundPaused} aria-label={backgroundPaused ? "Resume background animations" : "Pause background animations"} title={backgroundPaused ? "Resume background animations" : "Pause background animations"} onClick={()=>setBackgroundPaused(current=>!current)}><Icon name={backgroundPaused ? "play" : "pause"} size={15}/><span>{backgroundPaused ? "Resume motion" : "Pause motion"}</span></button><button className="account-trigger" disabled={account.status==="loading"} aria-haspopup="dialog" aria-expanded={accountOpen} aria-controls="account-dialog" onClick={()=>openAccount()}>{account.user?"Profile":"Login"}</button></div>
    </header>
    <AccountDialog open={accountOpen} account={account} profile={profile} coding={coding} motionPaused={backgroundPaused} initialMode={accountInitialMode} close={closeAccount} saveProfile={saveProfile} profileLoading={learning.status==="loading"} profileUnavailable={profileUnavailable} profileSaving={learning.status==="saving"} retryProfile={learning.retry}/>
    <MilestoneCelebration summary={coding} identity={learning.identity} loading={learning.status==="loading"} motionPaused={backgroundPaused}/>
    <SaveStatus status={learning.status} retry={learning.retry} configured={account.configured}/>
    {!navigationReady || learning.status === "loading" && (path || screen === "daily" || screen === "design") ? <main className="practice-home" id="main-content" aria-busy="true"><p role="status">Opening your session...</p></main> : screen === "design" ? <WebDesignSession key={`${learning.identity}-${workspaceRevision}`} state={learningState} dispatch={dispatch} identity={learning.identity} loading={learning.status === "loading"} exit={goHome} bookmarks={learningState.bookmarks} toggleBookmark={toggleBookmark} initialChallenge={designTarget} initialLevel={designStartLevel} onLocationChange={onDesignLocationChange}/> : screen==="daily"?<DailyPractice key={`${language}-${workspaceRevision}`} language={language} initialStep={dailyStep} initialMode={resumeMode} onStepChange={onDailyStepChange} state={learningState} dispatch={dispatch} profile={profile} onDraft={onDraft} onSessionChange={onSessionChange} exit={webSessions[language] ? () => choosePath(null) : goHome}/>:screen==="notebook"?<MistakeNotebook state={learningState} onAnswer={onAnswer} openTopic={openTopic} exit={goHome}/>:!language ? <main className="practice-home home-overview" id="main-content">
      <div className="practice-intro"><h1 ref={headingRef} tabIndex={-1}>Your next coding session<span className="brand-period">.</span></h1><p>Pick a language. Keep your momentum.</p></div>
      <CodingJourney summary={coding} today={practiceDay} startPractice={()=>openDaily(learningState.lastVisited?.language||"javascript")} loading={learning.status==="loading"} signedIn={!!account.user} saveStatus={learning.status} motionPaused={backgroundPaused}/>
      <section className="home-sessions" aria-labelledby="home-sessions-title"><div className="home-section-heading"><h2 id="home-sessions-title">Learning sessions</h2><span>6 languages · 4 paths each</span></div><div className="practice-language-grid">{Object.keys(languages).map(id=><LanguageCard key={id} language={id} description={sessionLabels[id]} onSelect={chooseLanguage}/>)}</div></section>
      <DesignLevelCards open={openDesign}/>
      <RelatedLearning compact/>
      <LearningDashboard compact loading={learning.status==="loading"} state={learningState} openDaily={openDaily} openNotebook={openNotebook} openTopic={openTopic}/>
      <JourneyDetails summary={coding} today={practiceDay} loading={learning.status==="loading"}/>
    </main> : !path ? <main className="practice-home path-hub" id="main-content">
      <LanguageHubEffects language={language}/>
      <div className="breadcrumb"><button onClick={goHome}>Languages</button><span>/</span><span>{languages[language].name}</span></div>
      <div className="practice-intro"><div className="path-language-heading"><LanguageMark language={language}/><div><span className="eyebrow">CHOOSE YOUR PRACTICE PATH</span><h1 ref={headingRef} tabIndex={-1}>{languages[language].name}: where do you want to start?</h1></div></div><p>Pick a focus. Each path gives you a topic, an explanation, and a way to practice.</p></div>
      <LearningDashboard compact state={learningState} language={language} openDaily={openDaily} openNotebook={openNotebook} openTopic={openTopic}/>
      {webSessions[language] && <DesignSessionLink compact open={openDesign}/>}
      <div className="practice-path-grid">{(webSessions[language] ? webPracticePaths(language) : practicePaths).map(item=><button key={item.id} className={`practice-path-card ${item.id}`} data-path={item.id} onClick={()=>choosePath(item.id)}><CardDecoration variant={item.id}/><div className="path-card-top"><span className="path-number">{item.number}</span><span className="path-icon"><Icon name={item.icon} size={24}/></span></div><h2>{item.title}</h2><p>{item.description}</p><div className="path-card-bottom"><span>{pathCount(language,item.id)} {item.id==="render"?"visual lessons":item.id==="methods"?"methods & functions":item.id==="basics"?"topics":item.id==="interviews"?"questions":"problems"}</span><span>{completed[`${language}:${item.id}`]?.length ? `${completed[`${language}:${item.id}`].length} ${item.id === "methods" && lessons[language] ? "explored" : "practiced"}` : item.action}</span></div></button>)}</div>
    </main> : webSessions[language] ? <WebWorkspace key={`${language}-${path}-${workspaceRevision}`} language={language} path={path} changePath={choosePath} openDesign={openDesign} initialEntry={initialEntry} initialMode={resumeMode} profile={profile} completed={completed[`${language}:${path}`]||[]} markCompleted={markCompleted} onVisit={onVisit} onDraft={onDraft} onSessionChange={onSessionChange} drafts={learningState.drafts} bookmarks={learningState.bookmarks} toggleBookmark={toggleBookmark} exit={goHome}/> : path === "methods" && lessons[language] ? <MethodsWorkspace key={`${language}-${workspaceRevision}`} initialLanguage={language} initialExperiment={initialExperiment} initialExplored={completed[`${language}:methods`]||[]} onExplored={markCompleted} profile={profile} onExit={()=>choosePath(null)} onSessionChange={onSessionChange} onVisit={onVisit} onAnswer={onAnswer} onQuizComplete={onQuizComplete} initialMode={resumeMode} bookmarks={learningState.bookmarks} toggleBookmark={toggleBookmark}/> : <PracticeWorkspace key={`${language}-${path}-${initialEntry || ""}-${workspaceRevision}`} language={language} path={path} initialEntry={initialEntry} profile={profile} completed={completed[`${language}:${path}`]||[]} markCompleted={markCompleted} changePath={choosePath} onSessionChange={onSessionChange} onVisit={onVisit} onAnswer={onAnswer} onDraft={onDraft} initialMode={resumeMode} drafts={learningState.drafts} bookmarks={learningState.bookmarks} toggleBookmark={toggleBookmark}/>}
    <footer className="site-footer"><span>{siteBrand.name}<span className="brand-period">.</span></span><a className="creator-credit" href="https://manojkumar-dev.vercel.app/" target="_blank" rel="noopener noreferrer"><span>Created by</span> Manoj Kumar <Icon name="code" size={15}/></a><span>JavaScript · Python · Java · C · HTML · CSS</span></footer>
  </div>;
}

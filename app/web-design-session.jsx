"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "./method-workspace";
import CodeTextarea from "./code-textarea";
import { designLevels, designChallenges, getDesignChallenge } from "../lib/web-design-challenges.mjs";
import { createDesignRun, designCodeLimit, designDraftKey, getDesignProgress } from "../lib/web-design-session.mjs";
import { buildDesignPreview, gradeDesignChecks } from "../lib/web-design-preview.mjs";
import { formatDesignCode } from "../lib/web-design-format.mjs";
import useScrollToTop from "./use-scroll-to-top";
import { TopicBookmark } from "./learning-dashboard";

const emptyCode = () => ({ html: "", css: "", js: "" });
const fileLabels = { html: "HTML", css: "CSS", js: "JavaScript" };
const designBookmark = challenge => ({ language: "html", path: "design", entryId: challenge.id, title: challenge.title });

function DesignMark({ small = false }) {
  return <span className={`design-mark${small ? " small" : ""}`} aria-hidden="true"><Icon name="code" size={small ? 18 : 24}/></span>;
}

export function DesignSessionLink({ open, compact = false }) {
  return <button className={`home-design-session${compact ? " compact" : ""}`} onClick={open}><DesignMark small/><span><strong>Web Design</strong><small>Recreate real interfaces · 4 levels · 60 challenges</small></span><span className="design-link-action">Start building <Icon name="chevron" size={16}/></span></button>;
}

export function DesignLevelCards({ open }) {
  return <section className="home-design-levels" aria-labelledby="home-design-title">
    <div className="home-design-levels-heading"><div><span className="eyebrow">BUILD REAL INTERFACES</span><h2 id="home-design-title">Web Design</h2><p>Choose a level and create your own version of real interfaces.</p></div><DesignMark small/></div>
    <div className="home-design-level-grid">{designLevels.map(item => <button key={item.id} className={`home-design-level-card level-${item.level}`} onClick={() => open(item.level)}><span className="home-design-level-meta"><b>0{item.level}</b><small>{item.level < 3 ? "HTML + CSS" : "HTML + CSS + JS"}</small></span><strong>{item.title}</strong><span className="home-design-level-description">{item.description}</span><span className="home-design-level-action">Explore level <Icon name="chevron" size={14}/></span></button>)}</div>
  </section>;
}

function DesignChallenge({ challenge, run, state, dispatch, identity, select, back, fresh, bookmarks, toggleBookmark }) {
  const draft = state.design?.drafts?.[designDraftKey(challenge.id, challenge.variant)];
  const [code, setCode] = useState(() => draft?.code || emptyCode());
  const [assisted, setAssisted] = useState(() => !!draft?.assisted || !!run.revealed?.includes(challenge.id));
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [editor, setEditor] = useState("html"), [solutionTab, setSolutionTab] = useState("html");
  const [width, setWidth] = useState("full");
  const [preview, setPreview] = useState(null), [feedback, setFeedback] = useState(null);
  const [checking, setChecking] = useState(false), [previewError, setPreviewError] = useState("");
  const [fullPreview, setFullPreview] = useState(null);
  const [fullPreviewWidth, setFullPreviewWidth] = useState("full");
  const iframe = useRef(null), serial = useRef(0), pending = useRef(null), timeout = useRef(null), saveTimer = useRef(null);
  const namespace = useId(), latest = useRef({ code, assisted, dirty: false });
  const scoreLimit = useRef(state.design?.results?.[challenge.id]?.bestScore || 0);
  if (!assisted) scoreLimit.current = Math.max(scoreLimit.current, state.design?.results?.[challenge.id]?.bestScore || 0);
  const heading = useRef(null), fullPreviewDialog = useRef(null), fullPreviewClose = useRef(null);
  const allowJavaScript = challenge.level >= 3;
  useScrollToTop(`${run.id}:${run.index}:${challenge.variant}`);
  const fields = allowJavaScript ? ["html", "css", "js"] : ["html", "css"];
  const saveRef = useRef(null);
  saveRef.current = () => {
    clearTimeout(saveTimer.current);
    if (!latest.current.dirty) return;
    dispatch({ type: "design-draft", level: challenge.level, challengeId: challenge.id, variant: challenge.variant, code: latest.current.code, assisted: latest.current.assisted }, identity);
    latest.current.dirty = false;
  };
  function save() { saveRef.current?.(); }
  function update(field, value) {
    if (pending.current) { pending.current = null; clearTimeout(timeout.current); setChecking(false); }
    const next = { ...latest.current.code, [field]: value };
    latest.current = { ...latest.current, code: next, dirty: true };
    setCode(next); setFeedback(null);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveRef.current?.(), 450);
  }
  function loadPreview(nextCode, checkingRequest = null) {
    const channel = `${namespace}-design-${++serial.current}`;
    if (checkingRequest) pending.current = { channel, requestId: checkingRequest };
    setPreview({ channel, srcDoc: buildDesignPreview({ ...nextCode, checks: challenge.checks, channel, allowJavaScript }) });
    setPreviewError("");
  }
  const reference = useMemo(() => buildDesignPreview({ ...challenge.solution, channel: `${namespace}-target`, reference: true, allowJavaScript }), [challenge, namespace, allowJavaScript]);
  const fullReference = useMemo(() => buildDesignPreview({ ...challenge.solution, channel: `${namespace}-target-live`, reference: true, allowJavaScript, fitContent: true }), [challenge, namespace, allowJavaScript]);
  const fullYourDesign = useMemo(() => buildDesignPreview({ ...code, checks: challenge.checks, channel: `${namespace}-your-live`, allowJavaScript, fitContent: true }), [code, challenge, namespace, allowJavaScript]);

  useEffect(() => {
    if (checking) return;
    const timer = setTimeout(() => loadPreview(code), 300);
    return () => clearTimeout(timer);
    // A fresh iframe resets previous interactions before a check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, checking]);
  useEffect(() => () => { saveRef.current?.(); clearTimeout(timeout.current); pending.current = null; }, []);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    const dialog = fullPreviewDialog.current;
    if (!dialog) return;
    if (fullPreview && !dialog.open) {
      dialog.showModal();
      fullPreviewClose.current?.focus();
    } else if (!fullPreview && dialog.open) dialog.close();
  }, [fullPreview]);
  useEffect(() => {
    function receive(event) {
      const data = event.data;
      if (event.source !== iframe.current?.contentWindow || !data || data.channel !== preview?.channel) return;
      if (data.type === "error") { setPreviewError(String(data.error || "JavaScript could not run.").slice(0, 400)); return; }
      if (data.type === "ready") {
        if (data.error) setPreviewError(String(data.error).slice(0, 400));
        const request = pending.current;
        if (request?.channel === data.channel) iframe.current.contentWindow.postMessage({ channel: data.channel, type: "check", requestId: request.requestId }, "*");
        return;
      }
      const request = pending.current;
      if (data.type !== "checked" || !request || data.requestId !== request.requestId || data.channel !== request.channel) return;
      clearTimeout(timeout.current); pending.current = null; setChecking(false);
      if (data.error || !Array.isArray(data.checks) || data.checks.length !== challenge.checks.length || data.checks.some(item => typeof item?.passed !== "boolean")) {
        setFeedback({ error: String(data.error || "The preview could not finish its checks. Try again.").slice(0, 400) });
        return;
      }
      // Use the authored weights and labels for this challenge.
      const checks = data.checks.map((item, index) => ({ ...challenge.checks[index], passed: item.passed, label: challenge.checks[index].label || challenge.checks[index].message, message: challenge.checks[index].message || challenge.checks[index].label || "Review this requirement." }));
      const grade = gradeDesignChecks(checks);
      const isAssisted = latest.current.assisted;
      const score = isAssisted ? Math.min(grade.score, scoreLimit.current) : grade.score;
      const passed = grade.passed && score >= 80;
      const perfect = grade.perfect && score === 100 && !isAssisted;
      setFeedback({ ...grade, score, passed, perfect, checks });
      dispatch({ type: "design-result", level: challenge.level, challengeId: challenge.id, variant: challenge.variant, score, passed, perfect, assisted: isAssisted }, identity);
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [preview, challenge, dispatch, identity]);

  function check() {
    save(); setFeedback(null); setChecking(true);
    const requestId = `${namespace}-check-${serial.current + 1}`;
    loadPreview(latest.current.code, requestId);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      pending.current = null; setChecking(false);
      setFeedback({ error: "The preview took too long. Check for a loop or JavaScript error, then try again." });
    }, 8000);
  }
  function reveal() {
    if (!latest.current.assisted) {
      scoreLimit.current = Math.max(scoreLimit.current, state.design?.results?.[challenge.id]?.bestScore || 0, feedback && !feedback.error ? feedback.score : 0);
      latest.current = { ...latest.current, assisted: true, dirty: true };
      setAssisted(true); save();
      // A previously checked solution should not retain a pending completion message.
      setFeedback(null);
    }
    setSolutionOpen(value => !value);
  }
  function move(index) { save(); select(index); }
  return <main className="design-workspace" id="main-content">
    <div className="design-topbar"><button className="text-button" onClick={() => { save(); back(); }}><Icon name="chevron" size={15}/>All levels</button><span>Level {challenge.level} <span className="design-dot">·</span> Challenge {run.index + 1} of 15</span><button className="text-button" onClick={() => { save(); fresh(); }}>Fresh run <Icon name="reset" size={14}/></button></div>
    <div className="design-challenge-heading"><div><span className="eyebrow">BUILD WHAT YOU SEE</span><h1 ref={heading} tabIndex={-1}>{challenge.title}</h1><p>{challenge.prompt}</p></div><div className="design-heading-actions"><TopicBookmark item={designBookmark(challenge)} bookmarks={bookmarks} toggle={toggleBookmark}/><span className={`design-score-tag${assisted ? " assisted" : ""}`}>{assisted ? `Assisted · capped at ${scoreLimit.current} points` : "Up to 100 points"}</span></div></div>
    <div className="design-run-track" aria-label="Challenges in this run">{run.order.map((id, index) => <button key={id} aria-label={`Challenge ${index + 1}: ${getDesignChallenge(id, run.variants[id]).title}`} aria-current={index === run.index ? "step" : undefined} className={index === run.index ? "current" : state.design?.results?.[id]?.passed ? "complete" : ""} onClick={() => move(index)}>{state.design?.results?.[id]?.passed && index !== run.index ? <Icon name="check" size={13}/> : index + 1}</button>)}</div>
    <div className="design-build-grid">
      <section className="design-editor-panel" aria-label="Your code">
        <div className="design-panel-header"><h2>Your code</h2><span>{allowJavaScript ? "HTML + CSS + JS" : "HTML + CSS"}</span></div>
        <div className="design-file-tabs" role="tablist" aria-label="Code files">{fields.map((field, index) => <button key={field} id={`${namespace}-tab-${field}`} role="tab" tabIndex={editor === field ? 0 : -1} aria-selected={editor === field} aria-controls={`${namespace}-editor`} onClick={() => setEditor(field)} onKeyDown={event => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); const next = event.key === "Home" ? fields[0] : event.key === "End" ? fields.at(-1) : fields[(index + (event.key === "ArrowRight" ? 1 : fields.length - 1)) % fields.length]; setEditor(next); document.getElementById(`${namespace}-tab-${next}`)?.focus(); }}><span className={`design-file-dot ${field}`}/>{fileLabels[field]}</button>)}</div>
        <div role="tabpanel" id={`${namespace}-editor`} aria-labelledby={`${namespace}-tab-${editor}`} className="design-code-area"><label className="sr-only" htmlFor={`${namespace}-code`}>Your {fileLabels[editor]} code</label><CodeTextarea id={`${namespace}-code`} language={editor === "js" ? "javascript" : editor} value={code[editor]} onValueChange={value => update(editor, value)} onBlur={save} spellCheck={false} maxLength={designCodeLimit} placeholder={editor === "html" ? "Build the target with your own HTML…" : editor === "css" ? "Add the colors, spacing, and layout…" : "Make the interface respond to the user…"} aria-label={`Your ${fileLabels[editor]} code`}/></div>
        <div className="design-editor-footer"><span>Live preview <i aria-hidden="true"/> <span className="design-code-count">{code[editor].length.toLocaleString()} / {designCodeLimit.toLocaleString()}</span></span><button className="primary-button" disabled={checking} onClick={check}>{checking ? "Checking…" : "Check my design"}<Icon name="check" size={15}/></button></div>
      </section>
      <section className="design-preview-panel" aria-label="Compare your design">
        <div className="design-panel-header"><h2>Compare the result</h2><div className="design-width-controls" aria-label="Preview width"><button aria-pressed={width === "full"} onClick={() => setWidth("full")}>Full</button><button aria-pressed={width === "mobile"} onClick={() => setWidth("mobile")}>320px</button></div></div>
        <div className="design-comparison">
          <div className="design-preview-card"><div className="design-preview-label"><span className="design-target-dot"/>Target design<span>Try its interactions</span><button type="button" className="design-live-view" aria-label="Open full-screen Target design preview" onClick={() => setFullPreview("target")}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 3H3v4M13 3h4v4M17 13v4h-4M3 13v4h4M3 7l5-5m9 5-5-5m5 11-5 5m-9-5 5 5"/></svg>Live view</button></div><div className="design-preview-canvas" data-width={width}><iframe title="Target design" sandbox="allow-scripts" srcDoc={reference}/></div></div>
          <div className="design-preview-card"><div className="design-preview-label"><span className="design-your-dot"/>Your design<span>Updates as you type</span><button type="button" className="design-live-view" aria-label="Open full-screen Your design preview" onClick={() => setFullPreview("your")}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 3H3v4M13 3h4v4M17 13v4h-4M3 13v4h4M3 7l5-5m9 5-5-5m5 11-5 5m-9-5 5 5"/></svg>Live view</button></div><div className="design-preview-canvas" data-width={width}>{preview && <iframe ref={iframe} title="Your design" sandbox="allow-scripts" srcDoc={preview.srcDoc}/>}</div></div>
        </div>
        {previewError && <p className="design-runtime-error" role="status">{previewError}</p>}
      </section>
    </div>
    <div className="design-review-grid">
      <section className="design-brief"><h2>What to build</h2><ul>{challenge.requirements.map((requirement, index) => <li key={index}>{requirement}</li>)}</ul><p>Use the required selectors so your work can be checked. Structure, content, styles, and interactions contribute to your score.</p></section>
      <section className="design-feedback" aria-live="polite" aria-atomic="true">
        {!feedback ? <><span className="design-feedback-icon"><Icon name="code" size={23}/></span><h2>Make it yours. Match the target.</h2><p>100 points is a full match. Score at least 80 and meet the essential requirements to pass, with feedback for the finishing touches.</p></> : feedback.error ? <><h2>Check your preview</h2><p className="design-runtime-error">{feedback.error}</p></> : <><div className="design-result-heading"><span className={`design-result-score${feedback.passed ? " passed" : ""}`}>{feedback.score}<small>/100</small></span><div><h2>{feedback.perfect ? "Full match!" : feedback.passed ? "Correct — a few touches left" : "Keep building"}</h2><p>{assisted ? "Assisted result. Try a fresh run to earn independent completion." : feedback.passed ? "Your progress and points are recorded." : "Use the feedback below, then check again."}</p></div></div><ul className="design-check-results">{feedback.checks.filter(item => !item.passed).map((item, index) => <li key={index} className="improve"><Icon name="chevron" size={13}/><span>{item.message}{item.essential ? " (essential)" : ""}</span></li>)}</ul>{feedback.checks.some(item => item.passed) && <details className="design-passed-checks"><summary>{feedback.checks.filter(item => item.passed).length} checks passed</summary><ul className="design-check-results">{feedback.checks.filter(item => item.passed).map((item, index) => <li key={index} className="passed"><Icon name="check" size={13}/><span>{item.label}</span></li>)}</ul></details>}</>}
      </section>
    </div>
    <div className="design-bottom-actions"><button className="text-button" onClick={reveal}>{solutionOpen ? "Hide answer" : "Reveal answer"}<Icon name={solutionOpen ? "chevron" : "code"} size={15}/></button><span>{assisted ? `Points are locked at ${scoreLimit.current}/100 for this version.` : "Revealing locks in your current points for this version."}</span><button className="secondary-button" onClick={() => move(run.index + 1)}>{run.index === 14 ? "Finish run" : "Next challenge"}<Icon name="chevron" size={15}/></button></div>
    {solutionOpen && <section className="design-solution" aria-label="Reference answer"><div className="design-panel-header"><h2>Reference answer</h2><span>One way to build this interface</span></div><div className="design-file-tabs" aria-label="Answer file">{fields.map(field => <button key={field} aria-pressed={solutionTab === field} onClick={() => setSolutionTab(field)}>{fileLabels[field]}</button>)}</div><pre><code>{formatDesignCode(challenge.solution[solutionTab], solutionTab)}</code></pre></section>}
    <dialog ref={fullPreviewDialog} className="design-live-dialog" aria-label={`${fullPreview === "target" ? "Target design" : "Your design"} full-screen preview`} onClose={() => setFullPreview(null)}>
      <div className="design-live-dialog-header"><div><span className={`design-${fullPreview === "target" ? "target" : "your"}-dot`}/><div><strong>{fullPreview === "target" ? "Target design" : "Your design"}</strong><span>{fullPreview === "target" ? "Interactive reference preview" : "Live preview of your current code"}</span></div></div><button ref={fullPreviewClose} type="button" className="design-live-close" onClick={() => setFullPreview(null)} aria-label="Close full-screen preview"><Icon name="close" size={18}/><span>Close preview</span></button></div>
      {fullPreview && <>
        <div className="design-live-dialog-header design-live-view-controls" role="group" aria-label="Live preview width">
          <span>Preview width</span>
          <div className="design-width-controls"><button type="button" aria-pressed={fullPreviewWidth === "full"} onClick={() => setFullPreviewWidth("full")}>Full</button><button type="button" aria-pressed={fullPreviewWidth === "mobile"} onClick={() => setFullPreviewWidth("mobile")}>320px</button></div>
        </div>
        <div className="design-live-dialog-canvas"><iframe className={fullPreviewWidth === "mobile" ? "mobile-preview" : ""} title={`${fullPreview === "target" ? "Target design" : "Your design"} full-screen preview`} sandbox="allow-scripts" srcDoc={fullPreview === "target" ? fullReference : fullYourDesign}/></div>
      </>}
    </dialog>
  </main>;
}

export default function WebDesignSession({ state, dispatch, identity, loading, exit, bookmarks = [], toggleBookmark, initialChallenge = null, initialLevel = null }) {
  const [level, setLevel] = useState(null);
  const openedChallenge = useRef(null);
  const openedLevel = useRef(null);
  const run = level ? state.design?.runs?.[level] : null;
  const challengeId = run?.order[run.index];
  const variant = challengeId ? run.variants[challengeId] : null;
  const challenge = useMemo(() => challengeId ? getDesignChallenge(challengeId, variant) : null, [challengeId, variant]);
  const totalCompleted = designLevels.reduce((sum, item) => sum + getDesignProgress(state, item.level).completed, 0);
  const savedChallenges = bookmarks.filter(item => item.path === "design").map(item => getDesignChallenge(item.entryId)).filter(Boolean);
  const openChallenge = useCallback((challengeId) => {
    const challenge = getDesignChallenge(challengeId);
    if (!challenge || loading) return;
    const targetRun = state.design?.runs?.[challenge.level];
    const runForLevel = targetRun && targetRun.index < targetRun.order.length
      ? targetRun
      : createDesignRun(challenge.level, targetRun, null, state.design?.recentVariants);
    if (runForLevel !== targetRun) dispatch({ type: "design-start", run: runForLevel }, identity);
    const index = runForLevel.order.indexOf(challengeId);
    dispatch({ type: "design-select", level: challenge.level, index, runId: runForLevel.id }, identity);
    setLevel(challenge.level);
  }, [dispatch, identity, loading, state.design]);
  useEffect(() => {
    if (loading || !initialChallenge || openedChallenge.current === initialChallenge) return;
    openedChallenge.current = initialChallenge;
    openChallenge(initialChallenge);
  }, [initialChallenge, loading, openChallenge]);
  function start(nextLevel) {
    if (loading) return;
    const next = createDesignRun(nextLevel, state.design?.runs?.[nextLevel], null, state.design?.recentVariants);
    dispatch({ type: "design-start", run: next }, identity); setLevel(nextLevel);
  }
  useEffect(() => {
    if (loading || !initialLevel || openedLevel.current === initialLevel) return;
    openedLevel.current = initialLevel;
    const current = state.design?.runs?.[initialLevel];
    if (current && current.index < current.order.length) setLevel(initialLevel);
    else start(initialLevel);
  }, [initialLevel, loading, state.design]);
  function select(index) { dispatch({ type: "design-select", level, index }, identity); }
  if (challenge && run) return <DesignChallenge key={`${identity}:${run.id}:${run.index}`} challenge={challenge} run={run} state={state} dispatch={dispatch} identity={identity} select={select} back={() => setLevel(null)} fresh={() => start(level)} bookmarks={bookmarks} toggleBookmark={toggleBookmark}/>;
  if (run && run.index >= run.order.length) {
    const progress = getDesignProgress(state, level);
    return <main className="design-run-finished" id="main-content"><DesignMark/><span className="eyebrow">LEVEL {level} · RUN FINISHED</span><h1>Keep shaping your skills.</h1><p>You reached the end of this run. Start again for a new order and different target content.</p><div className="design-finished-stats"><span><strong>{progress.completed}/15</strong>Independently passed</span><span><strong>{progress.points}</strong>Best points in this level</span></div><div><button className="primary-button" onClick={() => start(level)}>New shuffled run<Icon name="reset" size={15}/></button><button className="secondary-button" onClick={() => setLevel(null)}>All levels</button></div></main>;
  }
  return <main className="design-levels" id="main-content">
    <div className="breadcrumb"><button onClick={exit}>Learning sessions</button><span>/</span><span>Web Design</span></div>
    <div className="design-levels-heading"><div><span className="eyebrow">LEARN BY BUILDING</span><h1>See it. Build it. Make it work<span className="brand-period">.</span></h1><p>Recreate a target interface with your own code. Four levels, 60 challenges, and a fresh mix each run.</p></div><DesignMark/></div>
    <div className="design-levels-summary"><span><strong>{totalCompleted}/60</strong> challenges passed</span><span>HTML <i/> CSS <i/> JavaScript</span><span>Up to 6,000 points</span></div>
    {savedChallenges.length > 0 && <section className="design-bookmarked-topics" aria-labelledby="design-bookmarks-title"><div className="design-topic-section-heading"><div><span className="eyebrow">YOUR SAVED CHALLENGES</span><h2 id="design-bookmarks-title">Bookmarked topics</h2></div><span>{savedChallenges.length} saved</span></div><div className="design-bookmark-list">{savedChallenges.map(item => <button key={item.id} onClick={() => openChallenge(item.id)}><span className={`design-bookmark-level level-${item.level}`}>0{item.level}</span><span><strong>{item.title}</strong><small>Level {item.level} · Open challenge</small></span><Icon name="chevron" size={15}/></button>)}</div></section>}
    <div className="design-topic-section-heading design-level-section-heading"><div><span className="eyebrow">EXPLORE THE CURRICULUM</span><h2>Choose a level</h2></div><span>4 levels · 60 challenges</span></div>
    <section className="design-level-grid" aria-label="Choose Web Design level">{designLevels.map(item => {
      const progress = getDesignProgress(state, item.level), current = progress.run;
      return <article key={item.id} className={`design-level-card level-${item.level}`}>
        <div className="design-level-card-top"><span className="design-level-number">0{item.level}</span><span className="design-language-tag">{item.level < 3 ? "HTML + CSS" : item.level === 3 ? "HTML + CSS · Intro JS" : "HTML + CSS + JS"}</span></div>
        <h2>{item.title}</h2><p>{item.description}</p>
        <div className="design-level-progress"><span>15 challenges</span><span>{progress.completed} passed</span><div role="progressbar" aria-label={`Level ${item.level} completion`} aria-valuemin={0} aria-valuemax={15} aria-valuenow={progress.completed}><i style={{ width: `${progress.percent}%` }}/></div></div>
        <div className="design-level-actions"><button className="primary-button" disabled={loading} onClick={() => current && current.index < 15 ? setLevel(item.level) : start(item.level)}>{current && current.index < 15 ? `Continue · ${current.index + 1}/15` : "Start level"}<Icon name="chevron" size={15}/></button>{current && <button className="text-button" disabled={loading} onClick={() => start(item.level)}>New run</button>}</div>
      </article>;
    })}</section>
    <section className="design-other-topics" aria-labelledby="design-other-topics-title"><div className="design-topic-section-heading"><div><span className="eyebrow">BROWSE ALL CHALLENGES</span><h2 id="design-other-topics-title">Other topics</h2></div><span>Choose a challenge to open it directly</span></div><div className="design-topic-levels">{designLevels.map(item => <section key={item.id} className="design-topic-level"><h3><span className={`design-bookmark-level level-${item.level}`}>0{item.level}</span>{item.title}<small>{item.level < 3 ? "HTML + CSS" : "HTML + CSS + JavaScript"}</small></h3><div>{designChallenges.filter(challenge => challenge.level === item.level).map(challenge => <button key={challenge.id} onClick={() => openChallenge(challenge.id)}>{challenge.title}<Icon name="chevron" size={13}/></button>)}</div></section>)}</div></section>
    <div className="design-how-it-works"><span><strong>01</strong> Study the target</span><span><strong>02</strong> Write your code</span><span><strong>03</strong> Check and improve</span><span><strong>04</strong> Build the next one</span></div>
  </main>;
}

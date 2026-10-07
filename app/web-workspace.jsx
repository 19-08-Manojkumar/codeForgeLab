"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "./method-workspace";
import { LearnerBanner } from "./learner-dialog";
import { TopicBookmark } from "./learning-dashboard";
import { webLessons, webSessions, filterWebLessons } from "../lib/web-lessons.mjs";
import { buildWebPreview } from "../lib/web-preview.mjs";
import { learningKey, webEditorLimit } from "../lib/learning-state.mjs";
import WebExplorer from "./web-explorer";
import CodeTextarea from "./code-textarea";
import { InterviewPractice } from "./practice-workspace";
import { getWebPracticeEntries, webPracticePaths } from "../lib/web-practice.mjs";

const steps = ["Teach", "Learn", "Practice"];

function ExplorationPractice({ lesson, finish }) {
  const [reviewed, setReviewed] = useState(false), [marked, setMarked] = useState(false);
  return <><span className="eyebrow">TRY THIS {lesson.property ? "STYLE" : "TAG"}</span><h2>Make a change and compare the result</h2><p>{lesson.tryIt || (lesson.property ? `Change ${lesson.property}, then inspect the demo to see which value the browser applies.` : `Edit the ${lesson.tag || lesson.id} example, then compare its structure and appearance in the preview.`)}</p><label className="web-explorer-review"><input type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)}/>I compared my changes with the starting example.</label><button className="secondary-button" disabled={!reviewed || marked} onClick={() => { finish(); setMarked(true); }}>{marked ? "Exploration recorded" : "Mark this explorer practiced"}</button>{marked && <p role="status" className="web-hint">Your exploration is saved. Choose another tag or style to keep learning.</p>}</>;
}

function styleOverride(css, selector, property, value) {
  const base = css.replace(/\n?\/\* Explorer value \*\/[\s\S]*?\/\* End explorer value \*\//g, "");
  return `${base}\n\n/* Explorer value */\n${selector} { ${property}: ${value}; }\n/* End explorer value */`;
}

function readDraft(value, lesson) {
  try {
    const draft = JSON.parse(value);
    if (typeof draft.html === "string" && typeof draft.css === "string") return draft;
  } catch {}
  return { html: lesson.html, css: lesson.css };
}

function initialStyleValue(value, lesson) {
  const css = readDraft(value, lesson).css;
  const override = css.match(/\/\* Explorer value \*\/[\s\S]*?\{[\s\S]*?:\s*([\s\S]*?);\s*\}[\s\S]*?\/\* End explorer value \*\//);
  return override?.[1]?.trim() || String(lesson.value || "");
}

function Inspector({ inspection, nodes, inspect }) {
  const [view, setView] = useState("element");
  return <section className="web-inspector" aria-label="Rendered element inspector">
    <div className="web-panel-heading"><h2>How this element renders</h2><div className="web-inspector-switch" aria-label="Inspector view"><button aria-pressed={view === "element"} onClick={() => setView("element")}>Element</button><button aria-pressed={view === "tree"} onClick={() => setView("tree")}>Page structure</button></div></div>
    {view === "tree" ? <div className="web-dom-tree"><p>Select a tag to inspect its rendered styles.</p>{nodes.map(node => <button key={node.index} aria-pressed={inspection?.index === node.index} onClick={() => inspect(node.index)}><code>&lt;{node.tag}{node.id ? ` id="${node.id}"` : ""}{node.classes?.length ? ` class="${Array.isArray(node.classes) ? node.classes.join(" ") : node.classes}"` : ""}&gt;</code><span>{node.text}</span></button>)}</div> : !inspection ? <p className="web-empty-inspector">Turn on Inspect elements and select something in the preview.</p> : <>
      <div className="web-element-summary"><code>{inspection.pseudo ? `${inspection.tag}${inspection.pseudo}` : <>&lt;{inspection.tag}&gt;</>}</code><p>{inspection.pseudo ? <>A CSS pseudo-element belonging to <code>&lt;{inspection.tag}&gt;</code>. It has no separate HTML tag.</> : <>{inspection.parentTag ? <>Inside <code>&lt;{inspection.parentTag}&gt;</code>. </> : null}{inspection.children?.length ? `${inspection.children.length} child ${inspection.children.length === 1 ? "element" : "elements"}.` : "No child elements."}</>}</p></div>
      {inspection.attributes?.length > 0 && <div className="web-attributes"><h3>HTML attributes</h3><dl>{inspection.attributes.map(attribute => <div key={attribute.name}><dt><code>{attribute.name}</code></dt><dd>{attribute.value}</dd></div>)}</dl></div>}
      <div className="web-inspector-columns"><div><h3>Matching CSS rules</h3>{inspection.matchingCss?.length ? inspection.matchingCss.map((rule, index) => <pre key={index}><strong>{rule.selector}</strong>{" {\n"}{rule.declarations}{"\n}"}</pre>) : <p>No author rule matches this element. Browser defaults and inherited styles still apply.</p>}</div><div><h3>Styles the browser applies</h3><dl className="web-computed-styles">{Object.entries(inspection.styles || {}).map(([property, value]) => <div key={property}><dt><code>{property}</code></dt><dd><code>{value}</code></dd></div>)}</dl></div></div>
      <p className="field-hint">Matching rules can override one another. Applied values include the cascade, inheritance, browser defaults, and the current preview width.</p>
    </>}
  </section>;
}

export function WebLesson({ lesson: sessionLesson, example, language, path = "render", draftEntryId, practiceContent, initialMode, draftValue, onDraft, onVisit, onSessionChange, markCompleted, bookmarks, toggleBookmark, profile }) {
  const lesson = example || sessionLesson;
  const item = useMemo(() => ({ language, path, entryId: sessionLesson.id, title: sessionLesson.title }), [language, path, sessionLesson.id, sessionLesson.title]);
  const [mode, setMode] = useState(steps.map(step => step.toLowerCase()).includes(initialMode) ? initialMode : "teach");
  const [code, setCode] = useState(() => readDraft(draftValue, lesson));
  const [editor, setEditor] = useState(language);
  const [preview, setPreview] = useState({ srcDoc: "", channel: "", code: null });
  const [nodes, setNodes] = useState([]), [inspection, setInspection] = useState(null), [ready, setReady] = useState(false);
  const [inspectEnabled, setInspectEnabled] = useState(true), [width, setWidth] = useState("full");
  const [feedback, setFeedback] = useState(null), [checking, setChecking] = useState(false), [hint, setHint] = useState(false), [solutionShown, setSolutionShown] = useState(false);
  const [styleValue, setStyleValue] = useState(() => initialStyleValue(draftValue, lesson)), [styleError, setStyleError] = useState(null);
  const iframeRef = useRef(null), editedRef = useRef(false), serialRef = useRef(0), headingRef = useRef(null), checkTimeoutRef = useRef(null), pendingCheckRef = useRef(null);
  const channelId = useId();

  useEffect(() => { headingRef.current?.focus(); }, []);
  useEffect(() => { onSessionChange?.(mode); onVisit?.({ ...item, mode }); }, [item, mode, onSessionChange, onVisit]);
  useEffect(() => { if (!editedRef.current) { const next = readDraft(draftValue, lesson); setCode(previous => previous.html === next.html && previous.css === next.css ? previous : next); setStyleValue(initialStyleValue(draftValue, lesson)); } }, [draftValue, lesson]);
  useEffect(() => {
    setReady(false); setChecking(false); setFeedback(null);
    clearTimeout(checkTimeoutRef.current); pendingCheckRef.current = null;
    const timer = setTimeout(() => {
      const channel = `${channelId}-${++serialRef.current}`;
      setPreview({ srcDoc: buildWebPreview({ ...code, lesson, channel }), channel, code });
    }, 250);
    return () => clearTimeout(timer);
  }, [code, lesson, channelId]);

  function send(command) { iframeRef.current?.contentWindow?.postMessage({ channel: preview.channel, ...command }, "*"); }
  useEffect(() => {
    function receive(event) {
      if (event.source !== iframeRef.current?.contentWindow || event.data?.channel !== preview.channel) return;
      const data = event.data;
      if (data.type === "ready") {
        setReady(true); setNodes(data.nodes || []); setInspection(data.inspection || null);
        iframeRef.current?.contentWindow?.postMessage({ channel: preview.channel, type: "set-inspect", enabled: inspectEnabled }, "*");
        const selector = example?.selector || example?.explain?.find(point => point.selector)?.selector;
        if (selector) iframeRef.current?.contentWindow?.postMessage({ channel: preview.channel, type: "inspect-selector", selector }, "*");
      } else if (data.type === "inspection") setInspection(data.inspection || null);
      else if (data.type === "checked") {
        if (pendingCheckRef.current !== preview.channel) return;
        pendingCheckRef.current = null; clearTimeout(checkTimeoutRef.current); setChecking(false);
        const checks = data.checks || [], correct = checks.length > 0 && checks.every(check => check.passed);
        setFeedback({ correct, checks });
        if (correct && !solutionShown) markCompleted(sessionLesson.id);
      }
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [preview.channel, inspectEnabled, solutionShown, markCompleted, sessionLesson.id, example]);
  useEffect(() => () => clearTimeout(checkTimeoutRef.current), []);

  function update(next, save = true) {
    pendingCheckRef.current = null; clearTimeout(checkTimeoutRef.current); setChecking(false);
    if (next.html === lesson.html && next.css === lesson.css) { setStyleValue(String(lesson.value || "")); setStyleError(null); }
    editedRef.current = true; setCode(next); setSolutionShown(false); setFeedback(null);
    if (save) onDraft?.({ ...item, entryId: draftEntryId || item.entryId, value: JSON.stringify({ html: next.html, css: next.css, ...(path === "interviews" ? { answer: readDraft(draftValue, lesson).answer || "" } : {}), ...(example ? { explorerId: example.id } : {}) }) });
  }
  function applyValue(value) {
    if (!lesson.property || !lesson.selector) return;
    setStyleValue(value);
    if (!value.trim() || !CSS.supports(lesson.property, value)) { setStyleError(`This browser does not accept ${value || "an empty value"} for ${lesson.property}. Try a preset or another value.`); return; }
    const css = styleOverride(code.css, lesson.selector, lesson.property, value);
    if (css.length > webEditorLimit) { setStyleError("The CSS file is full. Shorten it before adding another value."); return; }
    setStyleError(null); update({ ...code, css });
  }
  function applyVariant(variant) {
    if (variant.value !== undefined && lesson.property) applyValue(String(variant.value));
    else { setStyleError(null); update({ html: variant.html ?? code.html, css: variant.css ?? code.css }); }
  }
  function changeMode(next) { setMode(next); setFeedback(null); }
  function tabKey(event, index) {
    const next = event.key === "ArrowRight" ? (index + 1) % 3 : event.key === "ArrowLeft" ? (index + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
    if (next === null) return;
    event.preventDefault(); changeMode(steps[next].toLowerCase()); document.getElementById(`web-step-${next}`)?.focus();
  }
  function editorKey(event) {
    if (event.key !== "Tab" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
    event.preventDefault();
    const field = event.currentTarget, start = field.selectionStart, end = field.selectionEnd;
    const next = code[editor].slice(0, start) + "  " + code[editor].slice(end);
    if (next.length > webEditorLimit) return;
    update({ ...code, [editor]: next });
    requestAnimationFrame(() => { field.selectionStart = field.selectionEnd = start + 2; });
  }
  function check() {
    if (!ready || checking || solutionShown) return;
    pendingCheckRef.current = preview.channel; setChecking(true); send({ type: "check" });
    checkTimeoutRef.current = setTimeout(() => { pendingCheckRef.current = null; setChecking(false); setFeedback({ error: "The preview could not check this page. Restore the example or edit your code and try again." }); }, 5000);
  }
  const updated = ready && preview.code?.html === code.html && preview.code?.css === code.css;
  return <>
    <div className="breadcrumb"><span>{webSessions[language].name}</span><span>/</span><span>Browser session</span><span>/</span><span>{lesson.group || (lesson.property ? "Style explorer" : "Tag explorer")}</span></div>
    <div className={`practice-lesson-heading web-lesson-heading ${example ? "web-explorer-current" : ""}`} data-explorer-id={example?.id}><div><span className="eyebrow">{language === "html" ? "HTML · BUILD THE STRUCTURE" : "CSS · STYLE THE PAGE"}</span>{example ? <h2 ref={headingRef} tabIndex={-1}>{lesson.title}</h2> : <h1 ref={headingRef} tabIndex={-1}>{lesson.title}</h1>}<p>{lesson.summary}</p>{lesson.previewNote && <p className="web-preview-note">{lesson.previewNote}</p>}</div>{toggleBookmark && <TopicBookmark item={item} bookmarks={bookmarks} toggle={toggleBookmark}/>}</div>
    <div className="practice-flow-tabs" role="tablist" aria-label="Learning steps">{steps.map((step, index) => <button key={step} id={`web-step-${index}`} role="tab" aria-selected={mode === step.toLowerCase()} aria-controls="web-step-panel" tabIndex={mode === step.toLowerCase() ? 0 : -1} onKeyDown={event => tabKey(event, index)} onClick={() => changeMode(step.toLowerCase())}><span>{String(index + 1).padStart(2, "0")}</span>{step}</button>)}</div>
    <section className="web-teaching-panel" id="web-step-panel" role="tabpanel" aria-labelledby={`web-step-${steps.findIndex(step => step.toLowerCase() === mode)}`}>
      {mode === "practice" && practiceContent ? practiceContent : mode === "practice" && !lesson.challenge ? <ExplorationPractice lesson={lesson} finish={() => markCompleted(sessionLesson.id)}/> : mode === "practice" ? <><span className="eyebrow">YOUR TURN</span><h2>{lesson.challenge.prompt}</h2><p>Edit the code below, then check the elements and styles in your rendered page.</p><div className="exercise-actions"><button className="primary-button" onClick={check} disabled={!updated || checking || solutionShown}>{checking ? "Checking page…" : "Check my page"}</button><button className="secondary-button" onClick={() => setHint(value => !value)}>{hint ? "Hide hint" : "Show hint"}</button><button className="text-button" onClick={() => { update(lesson.challenge.solution, false); setSolutionShown(true); }}>Show solution</button></div>{hint && <p className="web-hint">{lesson.challenge.hint}</p>}{solutionShown && <p className="web-hint" role="status">This is the solution. Compare its code and preview, then restore the example and try it yourself to complete the lesson.</p>}{feedback && <div className={`practice-feedback ${feedback.correct ? "correct" : "retry"}`} role="status"><strong>{feedback.error || (feedback.correct ? `${profile?.name ? `Well done, ${profile.name}!` : "Well done!"} Your page meets the challenge.` : "A few things still need changing")}</strong>{feedback.checks && <ul>{feedback.checks.map((check, index) => <li key={index}><Icon name={check.passed ? "check" : "bulb"} size={15}/>{check.message || check.label || (check.passed ? "Requirement met" : "Try this requirement again")}</li>)}</ul>}</div>}</> : <><h2>{mode === "teach" ? "Understand what the browser does" : "Change the code. See the result."}</h2>{mode === "teach" ? <ul className="web-concepts">{lesson.concepts.map((concept, index) => <li key={index}>{concept}</li>)}</ul> : <p>{language === "html" ? "Change a tag, its attributes, or its content. Select an element in the preview to connect the markup to what appears on the page." : "Change a selector or a property value. Inspect the affected element to compare matching rules with the browser's applied styles."}</p>}{mode === "learn" && lesson.answer && <div className="interview-review"><h3>A clear answer</h3><p>{lesson.answer}</p><ul>{lesson.keyPoints.map(point => <li key={point}>{point}</li>)}</ul></div>}<div className="web-explanations">{lesson.explain.map((point, index) => <article key={index}><button className="web-token-button" disabled={!updated || !point.selector} onClick={() => send({ type: "inspect-selector", selector: point.selector })}><code>{point.token}</code>{point.selector && <Icon name="chevron" size={14}/>}</button><h3>{point.title}</h3><p>{point.description}</p></article>)}</div><button className="text-button" onClick={() => changeMode(mode === "teach" ? "learn" : "practice")}>{mode === "teach" ? "Try the live example" : lesson.question ? "Practice your explanation" : lesson.challenge ? "Try the challenge" : "Practice this example"}<Icon name="chevron" size={15}/></button></>}
    </section>
    {example && <section className="web-explorer-controls" aria-label="Try example values">{lesson.variants?.length > 0 && <div className="web-example-presets"><span className="eyebrow">COMPARE EXAMPLES</span><div>{lesson.variants.map((variant, index) => <button key={index} type="button" className="secondary-button" data-value={variant.value} onClick={() => applyVariant(variant)}>{variant.label || variant.value}</button>)}</div></div>}{lesson.property && lesson.selector && <form className="web-style-value-form" onSubmit={event => { event.preventDefault(); applyValue(styleValue); }}><label htmlFor="web-style-value"><code>{lesson.property}</code> value to try</label><div><input id="web-style-value" value={styleValue} maxLength={500} spellCheck={false} onChange={event => { setStyleValue(event.target.value); setStyleError(null); }} aria-invalid={!!styleError} aria-describedby={styleError ? "web-style-error" : "web-style-value-help"}/><button type="submit" className="primary-button">Apply value</button></div><p id="web-style-value-help">The value is added to the CSS for <code>{lesson.selector}</code>. The preview and inspector show the result.</p>{styleError && <p id="web-style-error" className="web-value-error" role="alert">{styleError}</p>}</form>}</section>}
    <div className="web-live-workspace">
      <section className="web-editor-panel" aria-label="Page code editor"><div className="web-panel-heading"><div className="web-file-tabs" aria-label="Choose code file">{["html", "css"].map(file => <button key={file} aria-pressed={editor === file} onClick={() => setEditor(file)}>{file === "html" ? "index.html" : "styles.css"}</button>)}</div><button className="text-button" onClick={() => update({ html: lesson.html, css: lesson.css })} title="Restore the starting code"><Icon name="reset" size={15}/>Restore</button></div><label className="sr-only" htmlFor="web-code-editor">{editor === "html" ? "HTML code" : "CSS code"}</label><CodeTextarea language={editor} id="web-code-editor" data-editor={editor} value={code[editor]} onValueChange={value => update({ ...code, [editor]: value })} onKeyDown={editorKey} maxLength={webEditorLimit} spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap="off" aria-describedby="web-editor-help"/><div className="web-editor-footer" id="web-editor-help"><span>Edits update the preview automatically. Shift+Tab leaves the editor.</span><span>{code[editor].length.toLocaleString()}/{webEditorLimit.toLocaleString()}</span></div></section>
      <section className="web-preview-panel" aria-label="Live browser preview"><div className="web-panel-heading"><h2><span className="web-live-dot"/>Browser preview</h2><label className="web-preview-width">Width<select aria-label="Preview width" value={width} onChange={event => setWidth(event.target.value)}><option value="full">Fit panel</option><option value="375">Mobile · 375px</option><option value="768">Tablet · 768px</option><option value="1024">Desktop · 1024px</option></select></label></div><div className="web-browser-toolbar"><label><input type="checkbox" checked={inspectEnabled} onChange={event => { setInspectEnabled(event.target.checked); send({ type: "set-inspect", enabled: event.target.checked }); }}/>Inspect elements</label><span role="status">{updated ? "Preview up to date" : "Rendering changes…"}</span></div><div className="web-preview-stage"><div className="web-preview-viewport" style={{ width: width === "full" ? "100%" : `${width}px` }}><iframe ref={iframeRef} title={`${webSessions[language].name} live preview: ${lesson.title}`} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={preview.srcDoc}/></div></div><p className="web-preview-help">{inspectEnabled ? "Select an element to see its tag and applied styles below. Turn off inspection to try controls." : "Try the page's inputs, buttons, and expandable sections. Links stay inside this learning preview."}</p></section>
    </div>
    <Inspector inspection={inspection} nodes={nodes} inspect={index => send({ type: "inspect", index })}/>
    <div className="practice-source"><a href={lesson.source} target="_blank" rel="noopener noreferrer">Read the HTML / CSS documentation <Icon name="book" size={16}/></a></div>
  </>;
}

export default function WebWorkspace({ language, path = "render", changePath, initialEntry, initialMode, profile, editProfile, completed, markCompleted, onVisit, onDraft, onSessionChange, drafts = {}, bookmarks = [], toggleBookmark, exit, changeSession }) {
  const entries = useMemo(() => getWebPracticeEntries(language, path), [language, path]);
  const [selectedId, setSelectedId] = useState(initialEntry || entries[0].id), [query, setQuery] = useState(""), [group, setGroup] = useState("all");
  const selected = entries.find(lesson => lesson.id === selectedId) || entries[0], groups = [...new Set(entries.map(lesson => lesson.group))], filtered = filterWebLessons(entries, query, group);
  const count = entries.filter(entry => completed.includes(entry.id)).length;
  const draftValue = drafts[learningKey({ language, path, entryId: selected.id })]?.value;
  const lessonProps = { lesson: selected, language, path, initialMode: selected.id === initialEntry ? initialMode : path === "problems" ? "practice" : "teach", onDraft, onVisit, onSessionChange, markCompleted, bookmarks, toggleBookmark, profile };
  const lessonContent = selected.explorer
    ? <WebExplorer key={selected.id} language={language} lesson={selected} draftValue={draftValue} onDraft={onDraft} renderLesson={(example, exampleDraft, saveExample, modeOverride) => <WebLesson key={`${selected.id}:${example.id}`} {...lessonProps} example={example} initialMode={modeOverride || lessonProps.initialMode} draftValue={exampleDraft} onDraft={saveExample}/>}/>
    : <WebLesson key={selected.id} {...lessonProps} draftValue={draftValue} practiceContent={path === "interviews" ? <InterviewPractice entry={selected} language={language} profile={profile} complete={() => markCompleted(selected.id)} initialAnswer={readDraft(draftValue, selected).answer || ""} onDraft={draft => onDraft?.({ ...draft, value: JSON.stringify({ ...readDraft(draftValue, selected), answer: draft.value }) })}/> : undefined}/>;
  return <><nav className="path-navigation web-path-navigation" aria-label="Practice paths">{webPracticePaths(language).map(info => <button key={info.id} aria-current={path === info.id ? "page" : undefined} className={path === info.id ? "selected" : ""} onClick={() => changePath(info.id)}><Icon name={info.icon} size={17}/>{info.title}</button>)}</nav><div className="workspace practice-workspace web-workspace"><aside className="sidebar" aria-label={`${webSessions[language].name} lessons`}><div className="sidebar-heading"><span className="eyebrow">{webSessions[language].name} LESSONS</span><span className="topic-count">{entries.length}</span></div><div className="method-filters"><div className="method-search-field"><label className="sr-only" htmlFor="web-lesson-search">Search lessons</label><Icon name="code" size={17}/><input id="web-lesson-search" type="search" placeholder="Search tags or topics…" value={query} onChange={event => setQuery(event.target.value)} aria-controls="web-lesson-results"/>{query && <button className="method-clear" aria-label="Clear lesson search" onClick={() => setQuery("")}><Icon name="close" size={15}/></button>}</div><div className="method-group-field"><label className="sr-only" htmlFor="web-lesson-group">Filter lesson group</label><select id="web-lesson-group" value={group} onChange={event => setGroup(event.target.value)} aria-controls="web-lesson-results"><option value="all">All topics</option>{groups.map(item => <option key={item}>{item}</option>)}</select></div></div><p className="method-result-count" role="status">Showing {filtered.length} of {entries.length}</p><div className="sidebar-topic-groups" id="web-lesson-results">{groups.filter(item => filtered.some(entry => entry.group === item)).map(item => <div className="topic-group" key={item}><h2>{item}</h2>{filtered.filter(entry => entry.group === item).map(entry => <button key={entry.id} data-entry={entry.id} className={`topic-button practice-topic-button ${selected.id === entry.id ? "selected" : ""}`} aria-current={selected.id === entry.id ? "page" : undefined} onClick={() => setSelectedId(entry.id)}><span className="topic-name">{entry.title}</span>{completed.includes(entry.id) && <span className="explored-check" aria-label="Practiced"><Icon name="check" size={13}/></span>}</button>)}</div>)}{!filtered.length && <div className="method-empty"><strong>No matching lessons</strong><p>Try another tag, property, or topic.</p><button className="text-button" onClick={() => { setQuery(""); setGroup("all"); }}>Clear filters</button></div>}</div><div className="sidebar-bottom"><div className="lesson-progress"><div><span>Practiced</span><strong>{count}/{entries.length}</strong></div><div className="progress-track"><span style={{ width: `${count / entries.length * 100}%` }}/></div></div><button className="text-button" onClick={() => changePath(null)}><Icon name="home" size={15}/>Choose a practice path</button></div></aside><main className="lesson-main web-lesson-main" id="main-content"><LearnerBanner profile={profile} edit={editProfile}/>{lessonContent}<div className="next-topic-row"><span>{entries.indexOf(selected) + 1} of {entries.length}</span><button className="secondary-button" disabled={entries.indexOf(selected) === entries.length - 1} onClick={() => setSelectedId(entries[entries.indexOf(selected) + 1].id)}>Next lesson<Icon name="chevron" size={15}/></button></div></main></div></>;
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { htmlTags, htmlTagGroups } from "../lib/html-tags.mjs";
import { cssStyles, cssStyleGroups, cssStyleCoverage } from "../lib/css-styles.mjs";
import { Icon } from "./method-workspace";

function savedSource(value) {
  try { const source = JSON.parse(value); return typeof source.html === "string" && typeof source.css === "string" ? source : null; } catch { return null; }
}

export default function WebExplorer({ language, lesson, draftValue, onDraft, renderLesson }) {
  const entries = language === "html" ? htmlTags : cssStyles, groups = language === "html" ? htmlTagGroups : cssStyleGroups;
  const defaultId = language === "html" ? "h1" : "color", saved = useMemo(() => savedSource(draftValue), [draftValue]);
  const initial = entries.find(entry => entry.id === saved?.explorerId) || entries.find(entry => entry.id === defaultId) || entries[0];
  const [selectedId, setSelectedId] = useState(initial.id), [groupId, setGroupId] = useState(initial.groupId), [query, setQuery] = useState("");
  const touched = useRef(false), workingDrafts = useRef(new Map(saved ? [[initial.id, draftValue]] : []));
  const selected = entries.find(entry => entry.id === selectedId) || initial;
  useEffect(() => {
    const savedEntry = entries.find(item => item.id === (saved?.explorerId || defaultId));
    if (saved && savedEntry && !workingDrafts.current.has(savedEntry.id)) workingDrafts.current.set(savedEntry.id, draftValue);
    if (touched.current || !saved?.explorerId) return;
    const entry = entries.find(item => item.id === saved.explorerId);
    if (entry) { setSelectedId(entry.id); setGroupId(entry.groupId); }
  }, [saved, entries, draftValue, defaultId]);
  const term = query.trim().toLowerCase(), plainTerm = term.replace(/^<\/?|>$/g, "");
  const exactEntry = term ? entries.find(entry => entry.id === (language === "html" ? plainTerm : term) || entry.property === term) : null;
  const filtered = exactEntry ? [exactEntry] : entries.filter(entry => {
    const family = groups.find(group => group.id === entry.groupId);
    return [entry.id, entry.title, entry.property, entry.summary, family?.title, family?.description, ...(entry.concepts || [])].filter(Boolean).join(" ").toLowerCase().includes(term);
  });
  const visibleGroups = groups.filter(group => filtered.some(entry => entry.groupId === group.id));
  const activeGroup = visibleGroups.find(group => group.id === groupId) || visibleGroups[0];
  const visibleEntries = filtered.filter(entry => entry.groupId === activeGroup?.id);
  const currentSaved = saved && (saved.explorerId === selected.id || !saved.explorerId && selected.id === defaultId) ? draftValue : undefined;
  const currentDraft = workingDrafts.current.get(selected.id) || currentSaved;

  function select(entry) {
    if (currentDraft) workingDrafts.current.set(selected.id, currentDraft);
    touched.current = true; setSelectedId(entry.id); setGroupId(entry.groupId);
    const cached = workingDrafts.current.get(entry.id) || (saved?.explorerId === entry.id ? draftValue : null);
    const value = cached || JSON.stringify({ html: entry.html, css: entry.css, explorerId: entry.id });
    workingDrafts.current.set(entry.id, value);
    onDraft?.({ language, path: "render", entryId: lesson.id, title: lesson.title, value });
  }
  function groupSelected(group) {
    setGroupId(group.id);
    if (selected.groupId !== group.id) {
      const entry = filtered.find(item => item.groupId === group.id);
      if (entry) select(entry);
    }
  }
  function saveExample(draft) {
    touched.current = true;
    workingDrafts.current.set(selected.id, draft.value);
    onDraft?.(draft);
  }

  return <div className="web-explorer">
    <div className="breadcrumb"><span>{language === "html" ? "HTML" : "CSS"}</span><span>/</span><span>Lesson 1</span></div>
    <div className="practice-lesson-heading web-explorer-heading"><div><span className="eyebrow">START WITH ONE {language === "html" ? "TAG" : "PROPERTY"}</span><h1>{lesson.title}</h1><p>{lesson.summary}</p></div><span className="web-library-count">{entries.length} {language === "html" ? "tags & elements" : "styles"}</span></div>
    {language === "css" && <p className="field-hint">{cssStyleCoverage}</p>}
    <section className="web-explorer-picker" aria-label={language === "html" ? "HTML tag library" : "CSS style library"}>
      <div className="web-explorer-search"><Icon name="code" size={17}/><label className="sr-only" htmlFor="web-explorer-search">Search {language === "html" ? "HTML tags" : "CSS styles"}</label><input id="web-explorer-search" type="search" placeholder={language === "html" ? "Find a tag: h1, p, input…" : "Find a style: color, padding, grid…"} value={query} onChange={event => setQuery(event.target.value)} aria-controls="web-explorer-items"/>{query && <button aria-label="Clear library search" onClick={() => { setQuery(""); document.getElementById("web-explorer-search")?.focus(); }}><Icon name="close" size={16}/></button>}<span role="status">{filtered.length}/{entries.length}</span></div>
      <div className="web-explorer-picker-body"><nav className="web-explorer-groups" aria-label={language === "html" ? "Tag families" : "Style groups"}>{visibleGroups.map(group => <button key={group.id} className={`web-explorer-group ${activeGroup?.id === group.id ? "selected" : ""}`} data-group={group.id} aria-pressed={activeGroup?.id === group.id} onClick={() => groupSelected(group)}><span>{group.title}</span><span>{filtered.filter(entry => entry.groupId === group.id).length}</span></button>)}</nav><div className="web-explorer-items" id="web-explorer-items">{activeGroup ? <><div className="web-explorer-group-heading"><h2>{activeGroup.title}</h2><p>{activeGroup.description}</p></div><div className="web-explorer-item-list">{visibleEntries.map(entry => <button key={entry.id} className={`web-explorer-item ${selected.id === entry.id ? "selected" : ""}`} data-explorer-id={entry.id} aria-pressed={selected.id === entry.id} title={entry.summary} onClick={() => select(entry)}><code>{language === "html" ? `<${entry.tag || entry.id}>` : entry.property || entry.title}</code>{entry.experimental && <span className="web-experimental">Experimental</span>}</button>)}</div></> : <div className="method-empty"><strong>No matching {language === "html" ? "tags" : "styles"}</strong><p>Try another name or clear your search.</p><button className="text-button" onClick={() => setQuery("")}>Clear library search</button></div>}</div></div>
    </section>
    {renderLesson(selected, currentDraft, saveExample, touched.current ? "teach" : undefined)}
  </div>;
}

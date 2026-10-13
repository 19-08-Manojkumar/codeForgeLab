"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { languages } from "../lib/practice.mjs";
import { Icon } from "./method-workspace";

const scenes = {
  javascript: { motif: "orbit", symbol: "{ }", caption: "Make ideas interactive", code: ["const spark = () => 'hello';", "ideas.map(build);", "return somethingGreat;", "await nextAdventure();"] },
  python: { motif: "weave", symbol: "Py", caption: "A little code. Big possibilities.", code: ["def next_adventure():", "    return 'hello, world'", "for idea in possibilities:", "    build(idea)"] },
  java: { motif: "steam", symbol: "Jv", caption: "Build something that lasts", code: ["public class Adventure {", "  public static void main(String[] args) {", "    System.out.println(\"Hello, world!\");", "  }"] },
  c: { motif: "circuit", symbol: "C", caption: "Get closer to the machine", code: ["#include <stdio.h>", "int main(void) {", "  printf(\"Hello, world!\");", "  return 0;"] },
  html: { motif: "assemble", symbol: "</>", caption: "Give your ideas a home", code: ["<main class=\"adventure\">", "  <h1>Hello, world!</h1>", "  <button>Let's build</button>", "</main>"] },
  css: { motif: "layers", symbol: "{ }", caption: "Bring a little color to the web", code: [".idea {", "  display: grid;", "  color: rebeccapurple;", "  border-radius: 24px;"] },
};

function LanguageArtwork({ language }) {
  const { motif, symbol } = scenes[language];
  return <span className={`language-art art-${motif}`} aria-hidden="true">
    <span className="language-art-grid"/>
    <span className="language-art-ring ring-one"/><span className="language-art-ring ring-two"/>
    <span className="language-art-core">
      {language === "java" ? <svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path className="java-steam steam-one" d="M25 24c-9-8 9-8 0-17"/><path className="java-steam steam-two" d="M35 24c-8-8 9-8 1-17"/><path className="java-steam steam-three" d="M44 24c-7-8 7-8 1-16"/><path className="java-cup" d="M17 29h29v10c0 9-6 14-14 14s-15-5-15-14V29Z"/><path d="M46 32h4a7 7 0 0 1 0 14h-5M13 57h38"/></svg> : <span>{symbol}</span>}
    </span>
    <code className="language-art-bit bit-one">{language === "c" ? "01" : language === "html" ? "<h1>" : language === "css" ? "#a78bfa" : language === "python" ? "def" : language === "java" ? "class" : "=>"}</code>
    <code className="language-art-bit bit-two">{language === "c" ? "10" : language === "html" ? "</h1>" : language === "css" ? "grid" : language === "python" ? "for" : language === "java" ? "new" : "()"}</code>
    <i className="language-art-trail trail-one"/><i className="language-art-trail trail-two"/><i className="language-art-trail trail-three"/>
  </span>;
}

export function LanguageCard({ language, description, onSelect }) {
  const scene = scenes[language];
  return <button className={`language-card language-effect-card ${language}-card`} data-language={language} data-motif={scene.motif} aria-label={`Open ${languages[language].name} practice`} onClick={event => onSelect(language, event)}>
    <span className="language-card-heading"><span className={`language-mark ${language}`} aria-hidden="true">{languages[language].mark}</span><h3>{languages[language].name}</h3><span className="language-card-arrow"><Icon name="chevron" size={15}/></span></span>
    <LanguageArtwork language={language}/>
    <span className="language-card-copy"><span>{description}</span><code aria-hidden="true">{scene.code[0]}</code></span>
  </button>;
}

export function LanguageHubEffects({ language }) {
  return <div className="language-hub-effects language-theme" data-language={language} data-motif={scenes[language].motif} aria-hidden="true" inert>
    <LanguageArtwork language={language}/>
    <div className="language-hub-code">{scenes[language].code.map((line, index) => <code key={line} style={{ "--line-index": index }}>{line}</code>)}</div>
  </div>;
}

export function LanguagePortal({ portal }) {
  if (!portal) return null;
  const scene = scenes[portal.language];
  return <div key={portal.id} className="language-portal language-theme" data-language={portal.language} data-motif={scene.motif} aria-hidden="true" inert style={{ "--portal-origin-x": `${portal.x}px`, "--portal-origin-y": `${portal.y}px` }}>
    <div className="language-portal-veil"/>
    <div className="language-portal-stage"><span className="portal-ring portal-ring-outer"/><span className="portal-ring portal-ring-inner"/>
      <div className="language-portal-center"><LanguageArtwork language={portal.language}/><strong>{languages[portal.language].name}</strong><span>{scene.caption}</span></div>
      <div className="language-portal-code">{scene.code.map((line, index) => <code key={line} style={{ "--line-index": index }}>{line}</code>)}</div>
    </div>
  </div>;
}

export function useLanguagePortal(paused) {
  const [portal, setPortal] = useState(null), timer = useRef(null), sequence = useRef(0);
  const dismissPortal = useCallback(() => { clearTimeout(timer.current); setPortal(null); }, []);
  const beginPortal = useCallback((language, target) => {
    clearTimeout(timer.current);
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setPortal(null); return; }
    const rect = target?.getBoundingClientRect();
    setPortal({ language, id: ++sequence.current, x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2, y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2 });
    timer.current = setTimeout(() => setPortal(null), 920);
  }, [paused]);
  useEffect(() => { if (paused) dismissPortal(); }, [paused, dismissPortal]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => { if (media.matches) dismissPortal(); };
    media.addEventListener("change", changed);
    window.addEventListener("popstate", dismissPortal);
    return () => { media.removeEventListener("change", changed); window.removeEventListener("popstate", dismissPortal); clearTimeout(timer.current); };
  }, [dismissPortal]);
  return { portal, beginPortal, dismissPortal };
}

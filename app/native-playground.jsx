"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultNativeConfig, nativeExperiments } from "../lib/native-animation.mjs";
import { buildAnimationTrace } from "../lib/animation.mjs";
import TracePlayer from "./trace-player";
import { CodeBlock } from "./method-workspace";

export default function NativePlayground({ entry, language }) {
  const [config, setConfig] = useState(() => defaultNativeConfig(entry)), [step, setStep] = useState(0), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(1);
  const controls = nativeExperiments[entry.id];
  const { trace, error } = useMemo(() => { try { return { trace: buildAnimationTrace(entry, config, language), error: null }; } catch (error) { return { trace: buildAnimationTrace(entry, defaultNativeConfig(entry), language), error: error.message }; } }, [entry, config, language]);
  useEffect(() => { if (!playing || error) return; if (step >= trace.frames.length - 1) { setPlaying(false); return; } const timer = setTimeout(() => setStep(current => current + 1), 1000 / speed); return () => clearTimeout(timer); }, [playing, step, trace, error, speed]);
  function update(key, value) { setPlaying(false); setStep(0); setConfig(current => ({ ...current, [key]: value })); }
  return <div className="native-playground"><TracePlayer lesson={entry} trace={trace} step={step} setStep={setStep} playing={playing} setPlaying={setPlaying} speed={speed} setSpeed={setSpeed} error={error}/><div className="native-editor"><section className="editor-card" aria-label="Editable example"><div className="section-heading"><div><span className="eyebrow">MAKE IT YOURS</span><h3>Change the experiment</h3></div></div>{Object.entries(controls).filter(([, control]) => typeof control === "object").map(([key, control]) => <div className="native-field" key={key}><label htmlFor={`native-${key}`}>{control.label}</label>{["array", "bytes", "object"].includes(control.kind) ? <textarea id={`native-${key}`} rows={2} value={config[key]} aria-invalid={!!error} aria-describedby="native-error" spellCheck={false} onChange={event => update(key, event.target.value)}/> : <input id={`native-${key}`} value={config[key]} inputMode={control.kind === "number" ? "decimal" : undefined} aria-invalid={!!error} aria-describedby="native-error" spellCheck={false} onChange={event => update(key, event.target.value)}/>} {control.help && <p className="field-hint">{control.help}</p>}</div>)}<p id="native-error" className={error ? "input-error" : "input-ready"} role={error ? "alert" : undefined}>{error || "Edits update the code and reset the animation."}</p><button className="text-button restore" onClick={() => { setConfig(defaultNativeConfig(entry)); setPlaying(false); setStep(0); }}>Restore example</button></section><CodeBlock code={error ? "// Fix the values above to update this example." : trace.code} language={language}/><p className="code-footnote">A step-by-step teaching model of this {language === "java" ? "Java" : "C"} example. C examples use ASCII bytes; character functions use the C locale.</p></div></div>;
}

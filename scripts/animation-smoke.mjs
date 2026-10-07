import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join, resolve, extname } from "node:path";
import assert from "node:assert/strict";
import vm from "node:vm";
import { lessons, defaultConfig } from "../lib/lessons.mjs";
import { format } from "../lib/engine.mjs";
import { buildAnimationTrace, animationFormat } from "../lib/animation.mjs";
import { defaultNativeConfig } from "../lib/native-animation.mjs";
import { editedNativeCases } from "../tests/animation-cases.mjs";
import { curricula, getPracticeEntries } from "../lib/curriculum.mjs";
import { programmingLanguages as languages } from "../lib/practice.mjs";

// A bounded local smoke check using the installed Edge browser; no browser downloads.
const root=resolve("out"),runtime=resolve(".sites-runtime");
await mkdir(runtime,{recursive:true});
const errors=[];
const types={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".txt":"text/plain"};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,"http://localhost").pathname);const target=resolve(root,"."+path+(path.endsWith("/")?"index.html":""));if(!target.startsWith(root+"\\")&&target!==root){res.writeHead(403);res.end();return;}const bytes=await readFile(target);res.writeHead(200,{"Content-Type":types[extname(target)]||"application/octet-stream"});res.end(bytes);}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const url=`http://127.0.0.1:${server.address().port}/`;
const browser=spawn("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","--remote-debugging-port=0",`--user-data-dir=${join(runtime,`smoke-browser-${process.pid}`)}`,"about:blank"],{windowsHide:true,stdio:["ignore","ignore","pipe"]});
let socket;
try{
 const endpoint=await new Promise((resolve,reject)=>{let output="";const timeout=setTimeout(()=>reject(new Error("Browser startup timed out.")),20000);browser.on("error",reject);browser.stderr.on("data",b=>{output+=b;const match=output.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timeout);resolve(match[1]);}});});
 socket=new WebSocket(endpoint);await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true});});
 let nextId=0;const pending=new Map();socket.addEventListener("message",event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}}if(m.method==="Runtime.exceptionThrown")errors.push(m.params.exceptionDetails.text);});
 const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
 const {targetId}=await call("Target.createTarget",{url:"about:blank"});const {sessionId}=await call("Target.attachToTarget",{targetId,flatten:true});
 const pageCall=(m,p)=>call(m,p,sessionId);await pageCall("Runtime.enable");await pageCall("Page.enable");
 const evalJS=async(expression)=>{const r=await pageCall("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const waitFor=async(expression)=>{for(let i=0;i<80;i++){if(await evalJS(`Boolean(${expression})`))return;await new Promise(r=>setTimeout(r,100));}throw new Error("Expected browser state did not appear: "+expression);};
 const click=async(text)=>{assert.equal(await evalJS(`(()=>{const text=${JSON.stringify(text)};const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().replace(/→$/,'').trim()===text || b.closest('.language-switch') && b.textContent.trim().endsWith(text));if(!b)return false;b.click();return true})()`),true,"Button exists: "+text);if(["JavaScript","Python"].includes(text)){await waitFor("document.querySelectorAll('.practice-path-card').length===4");await evalJS("document.querySelector('[data-path=methods]').click()");await waitFor("document.querySelector('.workspace')");}};
 const setField=async(id,value)=>{await evalJS(`(()=>{const e=document.getElementById(${JSON.stringify(id)});const prototype=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);await waitFor(`document.getElementById(${JSON.stringify(id)}).value===${JSON.stringify(value)}`);};
 const openProfile=async()=>{await evalJS("document.querySelector('.profile-trigger').focus();document.querySelector('.profile-trigger').click()");await waitFor("document.querySelector('.learner-dialog').open");};
 const escapeDialog=async()=>{await pageCall("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});await pageCall("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});await waitFor("!document.querySelector('.learner-dialog').open");};
 const selectTopic=async(id,language="javascript")=>{const lesson=lessons[language].find(l=>l.id===id);await evalJS(`(()=>{const b=[...document.querySelectorAll('.topic-button')].find(b=>b.querySelector('.topic-name').textContent===${JSON.stringify(lesson.name)});if(!b)throw new Error('Missing topic');b.click()})()`);await waitFor(`document.querySelector('.lesson-title-line h1')?.textContent===${JSON.stringify(lesson.name)}`);};
 const chooseAnswer=async(i)=>{await evalJS(`document.querySelectorAll('.answer-option')[${i}].click()`);await waitFor(`document.querySelectorAll('.answer-option input')[${i}]?.checked`);};
 const questionCode=()=>evalJS("[...document.querySelectorAll('.quiz-card .code-line code')].map(e=>e.textContent).join('\\n')");
 const correctIndex=async()=>{const code=await questionCode();const result=format(vm.runInNewContext(code,{console:{log(){}}}));const options=await evalJS("[...document.querySelectorAll('.answer-option>code')].map(e=>e.textContent)");const i=options.indexOf(result);assert.ok(i>=0,"Displayed code has a correct choice: "+code);return i;};
 const chooseCorrect=async()=>{const code=await questionCode();await chooseAnswer(await correctIndex());assert.equal(await questionCode(),code,"Choosing an option keeps the question stable");};
 const chooseWrong=async()=>chooseAnswer(((await correctIndex())+1)%4);
 const chooseLanguage=async(language)=>{await evalJS(`(()=>{const b=[...document.querySelectorAll('.language-switch button')].find(b=>b.textContent.endsWith(${JSON.stringify(languages[language].name)}));b.click();})()`);await waitFor("document.querySelectorAll('.practice-path-card').length===4");};
 const hub=async()=>{await evalJS("document.querySelector('.header-actions .paths-trigger').click()");await waitFor("document.querySelectorAll('.practice-path-card').length===4");};
 const choosePath=async(path)=>{await evalJS(`document.querySelector('[data-path="${path}"]').click()`);await waitFor("document.querySelector('.workspace')");};
 const chooseEntry=async(entry)=>{await evalJS(`document.querySelector('[data-entry="${entry.id}"]').click()`);await waitFor(`document.querySelector('.practice-lesson-heading h1')?.textContent===${JSON.stringify(entry.title||entry.name||entry.question)}`);};
 const tab=async(index)=>{await evalJS(`document.querySelector('#flow-tab-${index}').click()`);await waitFor(`document.querySelector('#flow-tab-${index}').getAttribute('aria-selected')==='true'`);};
 const shot=async(name)=>{await new Promise(resolve=>setTimeout(resolve,250));const result=await pageCall("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});await writeFile(join(runtime,name),Buffer.from(result.data,"base64"));};
 const seek=async(step)=>{await setField('trace-position',String(step));await waitFor(`Number(document.querySelector('#trace-position').value)===${step}`);};
 const finish=async()=>{const total=await evalJS("Number(document.querySelector('#trace-position').max)");await seek(total);await waitFor("document.querySelector('.trace-player').dataset.stage==='return'");};
 const expectedText=(trace,language)=>Array.isArray(trace.result)?trace.result.length?trace.result.map(v=>animationFormat(v,language)).join(''):'[ ] — empty result':trace.resultPresentation==='label'&&typeof trace.result==='string'?trace.result:animationFormat(trace.result,language);
 await pageCall("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await pageCall("Page.navigate",{url});await waitFor("document.querySelectorAll('.language-card').length===6 && Object.keys(document.querySelector('.language-card')).some(k=>k.startsWith('__reactProps'))");await waitFor("document.querySelector('.learner-dialog').open");await click('Skip for now');await waitFor("!document.querySelector('.learner-dialog').open");
 for(const language of ['javascript','python']){
   await chooseLanguage(language);await choosePath('methods');
   for(const lesson of lessons[language]){await selectTopic(lesson.id,language);const trace=buildAnimationTrace(lesson,defaultConfig(lesson));await waitFor("document.querySelector('.trace-player')");assert.equal(await evalJS("document.querySelector('.trace-player').dataset.animationMode"),trace.mode);await seek(1);assert.equal(await evalJS("document.querySelector('.trace-player').dataset.stage"),'read');await finish();assert.equal(await evalJS("document.querySelector('.output-row').textContent.trim()"),expectedText(trace,language),language+':'+lesson.id);}
 }
 await chooseLanguage('javascript');await choosePath('methods');await selectTopic('filter');await setField('operation','even');await setField('input-data','[2, 7, 4]');
 await seek(1);assert.ok(!(await evalJS("document.querySelector('.output-row').textContent")).includes('2'),'Read does not commit');
 await seek(2);assert.equal(await evalJS("document.querySelector('.trace-verdict').textContent"),'true · keep');assert.ok((await evalJS("document.querySelector('.trace-evaluation code').textContent")).includes('2 % 2 === 0'));
 await seek(3);assert.equal(await evalJS("document.querySelector('.output-row').textContent.trim()"),'2');
 await seek(6);assert.ok((await evalJS("document.querySelector('.trace-rejected').textContent")).includes('7'));assert.equal(await evalJS("document.querySelector('.output-row').textContent.trim()"),'2');await shot('animation-filter.png');
 await finish();assert.equal(await evalJS("document.querySelector('.output-row').textContent.trim()"),'24');await click('Back');await waitFor("document.querySelector('.trace-player').dataset.stage==='commit'");
 await setField('input-data','[1, 8, 3]');await waitFor("document.querySelector('.trace-player').dataset.stage==='ready'");assert.ok((await evalJS("document.querySelector('.code-block').textContent")).includes('[1, 8, 3]'));await finish();assert.equal(await evalJS("document.querySelector('.output-row').textContent.trim()"),'8');
 await setField('input-data','[1,');await waitFor("!!document.querySelector('.input-error')");assert.equal(await evalJS("document.querySelector('.play-button').disabled"),true);await setField('input-data','[4, 6]');await waitFor("!document.querySelector('.input-error')");
 await click('Play animation');await waitFor("document.querySelector('.play-button').textContent==='Pause'");await click('Pause');const paused=await evalJS("document.querySelector('#trace-position').value");await new Promise(r=>setTimeout(r,1200));assert.equal(await evalJS("document.querySelector('#trace-position').value"),paused,'Pause stays paused');
 await evalJS("document.querySelector('[aria-label=\"Reset animation\"]').click()");await waitFor("document.querySelector('#trace-position').value==='0'");
 for(const language of ['java','c']){
   await chooseLanguage(language);await choosePath('methods');
   for(const entry of curricula[language].references){await chooseEntry(entry);await tab(1);await waitFor("document.querySelector('.native-playground .trace-player')");const defaults=buildAnimationTrace(entry,defaultNativeConfig(entry),language);await finish();assert.equal(await evalJS("document.querySelector('.output-row').textContent.trim()"),expectedText(defaults,language),'default:'+entry.id);
     const fixture=editedNativeCases.find(([lang,id])=>lang===language&&id===entry.id), changes=fixture[2];for(const [key,value]of Object.entries(changes))await setField('native-'+key,value);await waitFor("!document.querySelector('.native-playground .input-error')");const edited=buildAnimationTrace(entry,{...defaultNativeConfig(entry),...changes},language);await finish();assert.equal(await evalJS("document.querySelector('.output-row').textContent.trim()"),expectedText(edited,language),'edited:'+entry.id);
     if(edited.mutated!==null)assert.equal(await evalJS("document.querySelectorAll('.trace-memory .trace-cell').length"),edited.mutated.length,entry.id+' changed state');
     if(entry.id==='java-list-set')await shot('animation-java.png');if(entry.id==='memmove')await shot('animation-memory.png');
   }
 }
 await chooseLanguage('c');await choosePath('methods');await chooseEntry(curricula.c.references.find(e=>e.id==='bsearch'));await tab(1);await setField('native-input','[3, 1]');await waitFor("document.querySelector('.native-playground .input-error')");assert.equal(await evalJS("document.querySelector('.play-button').disabled"),true);await click('Restore example');await waitFor("!document.querySelector('.native-playground .input-error')");
 await pageCall('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 for(const language of ['javascript','python','java','c']){await chooseLanguage(language);await choosePath('methods');const list=['java','c'].includes(language)?curricula[language].references:lessons[language];for(const entry of list){if(['java','c'].includes(language)){await chooseEntry(entry);await tab(1);}else await selectTopic(entry.id,language);await waitFor("document.querySelector('.trace-player')");await finish();assert.equal(await evalJS("document.documentElement.scrollWidth<=window.innerWidth"),true,language+':'+entry.id+' mobile');} }
 await chooseLanguage('javascript');await choosePath('methods');await selectTopic('filter');await seek(6);await shot('animation-mobile.png');
 await pageCall('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert.equal(await evalJS("getComputedStyle(document.querySelector('.trace-transfer'),'::after').display"),'none','Reduced motion removes moving dots');
 await evalJS("document.querySelector('#trace-position').focus()");await pageCall('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await pageCall('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await waitFor("document.querySelector('#trace-position').value==='7'");
 assert.equal(errors.length,0,'No runtime exceptions');console.log(JSON.stringify({passed:true,checks:['all 100 method animations','all 50 Java/C examples with changed values','filter read/check/keep/skip phases','code follows edited values','independent before/after state','invalid inputs pause playback','backward steps and scrubbing','pause and reset','all 100 mobile layouts','keyboard timeline','reduced motion'],screenshots:['animation-filter.png','animation-java.png','animation-memory.png','animation-mobile.png']}));await call('Browser.close');
}finally{socket?.close();browser.kill();server.closeAllConnections();server.close();}

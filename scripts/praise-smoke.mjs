import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join, resolve, extname } from "node:path";
import assert from "node:assert/strict";
import vm from "node:vm";
import { lessons, defaultConfig } from "../lib/lessons.mjs";
import { buildTrace, format } from "../lib/engine.mjs";
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
 const popupTitle=()=>evalJS("document.querySelector('.success-copy strong')?.textContent");
 const dismiss=async()=>{await evalJS("document.querySelector('.success-dismiss').click()");await waitFor("!document.querySelector('.success-popup')");};
 await pageCall('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await pageCall('Page.navigate',{url});await waitFor("document.querySelectorAll('.language-card').length===6 && Object.keys(document.querySelector('.language-card')).some(k=>k.startsWith('__reactProps'))");await waitFor("document.querySelector('.learner-dialog').open");await click('Skip for now');await waitFor("!document.querySelector('.learner-dialog').open");
 for(const language of Object.keys(languages)){
   await chooseLanguage(language);await choosePath('basics');await tab(2);const entry=curricula[language].topics[0];
   await setField('output-prediction','wrong output');await click('Check prediction');await waitFor("document.querySelector('.practice-feedback.retry')");assert.equal(await evalJS("!!document.querySelector('.success-popup')"),false,'Wrong answers do not celebrate');
   await click('Show explanation');assert.equal(await evalJS("!!document.querySelector('.success-popup')"),false,'Explanations do not celebrate');
   await setField('output-prediction',entry.output);await click('Check prediction');await waitFor("document.querySelector('.success-popup.prediction')");assert.equal(await popupTitle(),'Well done!');await dismiss();
   await hub();await choosePath('problems');await tab(2);const problem=curricula[language].problems[0];await click('Show solution');assert.equal(await evalJS("!!document.querySelector('.success-popup')"),false,'Solution reveal does not celebrate');
   await setField('code-expression',problem.answers[0]);await click('Check expression');await waitFor("document.querySelector('.success-popup.problem')");assert.equal(await popupTitle(),'Well done!');await setField('code-expression','wrong expression');await waitFor("!document.querySelector('.success-popup')");
 }
 await openProfile();await setField('profile-name','Manoj');await setField('profile-role','student');await setField('profile-domain','Computer science');await click('Start learning');await waitFor("!document.querySelector('.learner-dialog').open");
 for(const language of Object.keys(languages)){
   await chooseLanguage(language);await choosePath('basics');await tab(2);await setField('output-prediction',curricula[language].topics[0].output);await click('Check prediction');await waitFor("document.querySelector('.success-popup.prediction')");assert.equal(await popupTitle(),'Well done, Manoj!');await dismiss();
   await hub();await choosePath('problems');await tab(2);await setField('code-expression',curricula[language].problems[0].answers[0]);await click('Check expression');await waitFor("document.querySelector('.success-popup.problem')");assert.equal(await popupTitle(),'Well done, Manoj!');
   if(language==='java')await shot('praise-personalized.png');
   await pageCall('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await pageCall('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await waitFor("!document.querySelector('.success-popup')");
 }
 for(const language of ['javascript','python']){
   await chooseLanguage(language);await choosePath('methods');await click('Test this method');await waitFor("document.querySelector('.answer-options')");
   if(language==='javascript')await chooseCorrect();else{
     const q=await questionCode(),slice=q.match(/len\(values\[:(\d+)\]\)/);let result;
     if(slice)result=Number(slice[1]);else{const expression=q.match(/^len\((.*)\)$/)[1];const repeat=expression.match(/^("(?:[^"\\]|\\.)*") \* (\d+)$/);const data=repeat?JSON.parse(repeat[1]).repeat(Number(repeat[2])):vm.runInNewContext('('+expression+')',{});result=typeof data==='string'?Array.from(data).length:Array.isArray(data)?data.length:Object.keys(data).length;}
     const options=await evalJS("[...document.querySelectorAll('.answer-option>code')].map(e=>e.textContent)");assert.ok(options.includes(String(result)),q);await chooseAnswer(options.indexOf(String(result)));
   }
   await click('Check answer');await waitFor("document.querySelector('.success-popup')");assert.equal(await popupTitle(),'Well done, Manoj!');await dismiss();
 }
 await chooseLanguage('java');await choosePath('methods');await tab(2);await setField('output-prediction',curricula.java.references[0].output);await click('Check prediction');await waitFor("document.querySelector('.success-popup.prediction')");assert.equal(await popupTitle(),'Well done, Manoj!');
 await pageCall('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.equal(await evalJS("document.documentElement.scrollWidth<=window.innerWidth"),true,'Mobile popup fits');await shot('praise-mobile.png');
 await waitFor("!document.querySelector('.success-popup')");assert.ok(await evalJS("!!document.querySelector('.practice-feedback.correct')"),'Auto dismissal keeps answer feedback');await click('Check prediction');await waitFor("document.querySelector('.success-popup.prediction')");await click('Next topic');await waitFor("!document.querySelector('.success-popup')");
 assert.equal(errors.length,0,'No runtime exceptions');console.log(JSON.stringify({passed:true,checks:['correct output and coding popups in all four languages','saved learner name','anonymous praise','JS/Python method quiz praise','Java method prediction praise','no praise for wrong answers or revealed solutions','editing clears old celebration','manual and Escape dismissal','automatic dismissal keeps feedback','navigation clears popup','mobile popup layout'],screenshots:['praise-personalized.png','praise-mobile.png']}));await call('Browser.close');
}finally{socket?.close();browser.kill();server.closeAllConnections();server.close();}

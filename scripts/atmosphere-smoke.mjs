import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join, resolve, extname } from "node:path";
import assert from "node:assert/strict";
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
 const click=async(text)=>{assert.equal(await evalJS(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)return false;b.click();return true})()`),true,"Button exists: "+text);};
 const chooseLanguage=async(language)=>{await evalJS(`(()=>{const b=[...document.querySelectorAll('.language-switch button')].find(b=>b.textContent.endsWith(${JSON.stringify(languages[language].name)}));b.click();})()`);await waitFor("document.querySelectorAll('.practice-path-card').length===4");};
 const hub=async()=>{await evalJS("document.querySelector('.header-actions .paths-trigger').click()");await waitFor("document.querySelectorAll('.practice-path-card').length===4");};
 const choosePath=async(path)=>{await evalJS(`document.querySelector('[data-path="${path}"]').click()`);await waitFor("document.querySelector('.workspace')");};
 const shot=async(name)=>{await new Promise(resolve=>setTimeout(resolve,750));const result=await pageCall("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});await writeFile(join(runtime,name),Buffer.from(result.data,"base64"));};
 const motionState=()=>evalJS("[...document.querySelectorAll('.code-atmosphere *')].filter(e=>getComputedStyle(e).animationName!=='none').map(e=>getComputedStyle(e).animationPlayState)");
 const toggle=async()=>{await evalJS("document.querySelector('.ambient-toggle').click()");};
 const fits=async(label)=>assert.equal(await evalJS("document.documentElement.scrollWidth<=window.innerWidth"),true,label);
 const scene=async(session,motion)=>{await waitFor(`document.querySelector('.app-scene').dataset.session===${JSON.stringify(session)}`);assert.equal(await evalJS("getComputedStyle(document.querySelector('.shooting-star')).animationName"),motion,session+' motion');assert.notEqual(await evalJS("getComputedStyle(document.querySelector('.star-tail')).transform"),'none','Trail follows its trajectory');};
 const ownerVisible=async()=>{const owner=await evalJS("(()=>{const a=document.querySelector('.creator-credit');return {href:a.href,text:a.textContent.includes('Manoj Kumar'),visible:getComputedStyle(a).display!=='none',width:a.getBoundingClientRect().width}})()");assert.equal(owner.href,'https://manojkumar-dev.vercel.app/');assert.ok(owner.text&&owner.visible&&owner.width>0,'Creator credit is visible');};
 await pageCall('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await pageCall('Page.navigate',{url});await waitFor("document.querySelectorAll('.language-card').length===6 && Object.keys(document.querySelector('.language-card')).some(k=>k.startsWith('__reactProps'))");await waitFor("document.querySelector('.learner-dialog').open");await click('Skip for now');await waitFor("!document.querySelector('.learner-dialog').open");
 assert.equal(await evalJS("document.querySelector('.code-atmosphere').getAttribute('aria-hidden')"),'true');assert.equal(await evalJS("document.querySelector('.code-atmosphere').inert"),true);assert.equal(await evalJS("getComputedStyle(document.querySelector('.code-atmosphere')).pointerEvents"),'none');
 assert.ok((await motionState()).length>=20,'Background elements animate');
 await scene('home','meteor-diagonal');await ownerVisible();
 const position=()=>evalJS("(()=>{const m=new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.shooting-star')).transform);return [m.m41,m.m42]})()");
 const before=await position();await new Promise(r=>setTimeout(r,700));const after=await position();assert.ok(Math.hypot(after[0]-before[0],after[1]-before[1])>80,'Shooting stars travel across the viewport');await fits('desktop home');await shot('atmosphere-home.png');
 await toggle();await waitFor("document.querySelector('.app-scene').dataset.backgroundPaused==='true'");assert.ok((await motionState()).every(s=>s==='paused'),'Pause freezes all ambient motion');
 await evalJS("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
 const paused=await position();await new Promise(r=>setTimeout(r,500));assert.deepEqual(await position(),paused);await toggle();await waitFor("document.querySelector('.app-scene').dataset.backgroundPaused==='false'");assert.ok((await motionState()).every(s=>s==='running'));
 await evalJS("document.querySelector('[data-language=python].language-card').click()");await waitFor("document.querySelectorAll('.practice-path-card').length===4");assert.ok((await evalJS("document.querySelector('.code-snippet-field').textContent")).includes('def learn():'));await shot('atmosphere-paths.png');
 await scene('hub','meteor-fan');
 await choosePath('methods');await scene('learn','meteor-stream');await waitFor("document.querySelector('.trace-player')");await click('Next step');await waitFor("document.querySelector('#trace-position').value==='1'");await fits('method player remains interactive');await shot('atmosphere-lesson.png');
 await click('Test this method');await scene('test','meteor-reverse');await shot('atmosphere-test.png');await click('Learn');await scene('learn','meteor-stream');
 const palettes=new Set();for(const language of Object.keys(languages)){await chooseLanguage(language);palettes.add(await evalJS("getComputedStyle(document.querySelector('.app-scene')).getPropertyValue('--sky-one').trim()"));}assert.equal(palettes.size,4,'Each language has its own color palette');
 for(const width of [390,360]){await pageCall('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});await evalJS("document.querySelector('.brand').click()");await waitFor("document.querySelectorAll('.language-card').length===6");await scene('home','meteor-diagonal');await fits(width+' home');await ownerVisible();if(width===390)await shot('atmosphere-mobile.png');
   for(const language of Object.keys(languages)){await chooseLanguage(language);await scene('hub','meteor-fan');await fits(width+':'+language+' paths');for(const path of ['methods','basics','interviews','problems']){await choosePath(path);await fits(width+':'+language+':'+path);if(path==='methods'&&['javascript','python'].includes(language)){await scene('learn','meteor-stream');await click('Test this method');await scene('test','meteor-reverse');await click('Learn');await scene('learn','meteor-stream');}else{await scene('teach','meteor-rising');await evalJS("document.querySelector('#flow-tab-1').click()");await scene('learn','meteor-stream');await evalJS("document.querySelector('#flow-tab-2').click()");await scene('practice','meteor-rising');await evalJS("document.querySelectorAll('[data-entry]')[1].click()");await scene('teach','meteor-rising');}await toggle();await waitFor("document.querySelector('.app-scene').dataset.backgroundPaused==='true'");await hub();assert.ok((await motionState()).every(s=>s==='paused'),'Pause survives scene changes');await toggle();}}
 }
 await pageCall('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert.equal((await motionState()).length,0,'Reduced motion disables ambient animations');assert.equal(await evalJS("getComputedStyle(document.querySelector('.ambient-toggle')).display"),'none');await fits('reduced motion layout');
 assert.equal(errors.length,0,'No runtime exceptions');console.log(JSON.stringify({passed:true,checks:['viewport-scale shooting-star travel','four language palettes','home/hub/teach/learn/test/practice themes','topic and navigation theme resets','portfolio creator link','no pointer interception or screen-reader noise','pause/resume across scene changes','learning player remains interactive','all 16 paths at 390px and 360px','reduced motion'],screenshots:['atmosphere-home.png','atmosphere-paths.png','atmosphere-lesson.png','atmosphere-test.png','atmosphere-mobile.png']}));await call('Browser.close');
}finally{socket?.close();browser.kill();server.closeAllConnections();server.close();}

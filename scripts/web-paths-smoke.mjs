import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";
import { startLearningPreview } from "./local-learning.mjs";
import { webLessons } from "../lib/web-lessons.mjs";
import { dailyPlan } from "../lib/daily-plan.mjs";
import { curricula } from "../lib/curriculum.mjs";
import { cssStyles, cssStyleGroups } from "../lib/css-styles.mjs";

const runtime=resolve(".sites-runtime");
await mkdir(runtime,{recursive:true});
const preview=await startLearningPreview(), errors=[];
const profile=join(runtime,`web-paths-browser-${process.pid}`);
const browser=spawn("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",[
  "--headless=new","--no-sandbox","--no-first-run","--no-default-browser-check","--remote-debugging-port=0",
  "--disable-background-networking","--disable-component-update","--disable-sync",
  "--disable-background-timer-throttling","--disable-renderer-backgrounding","--disable-backgrounding-occluded-windows",
  `--user-data-dir=${profile}`,"about:blank",
],{windowsHide:true,stdio:["ignore","ignore","pipe"]});
let socket,failureShot;

try {
  let endpoint,stderr="";
  browser.stderr.on("data",data=>{stderr=(stderr+data).slice(-3000);});
  for(let attempt=0;attempt<150;attempt++){
    try {
      const [port]=(await readFile(join(profile,"DevToolsActivePort"),"utf8")).trim().split(/\r?\n/);
      const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      endpoint=targets.find(target=>target.type==="page")?.webSocketDebuggerUrl;
      if(endpoint)break;
    } catch {}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  if(!endpoint)throw new Error("Explorer browser startup timed out: "+stderr);
  socket=new WebSocket(endpoint);
  await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true});});
  let serial=0;
  const pending=new Map();
  socket.addEventListener("message",event=>{
    const message=JSON.parse(event.data),item=pending.get(message.id);
    if(item){pending.delete(message.id);clearTimeout(item.timeout);message.error?item.reject(new Error(message.error.message)):item.resolve(message.result);}
    if(message.method==="Runtime.exceptionThrown")errors.push(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);
  });
  const disconnect=()=>{for(const item of pending.values()){clearTimeout(item.timeout);item.reject(new Error("Explorer browser debugger disconnected"));}pending.clear();};
  socket.addEventListener("close",disconnect);browser.on("exit",disconnect);
  const command=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++serial,timeout=setTimeout(()=>{pending.delete(id);reject(new Error("CDP timed out: "+method));},20000);
    pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));
  });
  await command("Runtime.enable");await command("Page.enable");await command("Page.bringToFront");
  const evaluate=async expression=>{const result=await command("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;};
  const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(`Boolean(${expression})`))return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error("Expected state: "+expression);};
  const click=async(text,scope="button")=>assert.equal(await evaluate(`(()=>{const button=[...document.querySelectorAll(${JSON.stringify(scope)})].find(item=>item.textContent.trim().startsWith(${JSON.stringify(text)}));if(!button)return false;button.click();return true;})()`),true,"Button: "+text);
  const field=async(selector,value)=>{
    await evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});if(!element)throw new Error('Missing field '+${JSON.stringify(selector)});const prototype=element.tagName==='SELECT'?HTMLSelectElement.prototype:element.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,${JSON.stringify(value)});element.dispatchEvent(new Event(element.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);
    await wait(`document.querySelector(${JSON.stringify(selector)})?.value===${JSON.stringify(value)}`);
  };
  const ready=async()=>{await evaluate("document.querySelector('.web-preview-panel iframe')?.scrollIntoView({block:'center'})");await wait("document.querySelector('.web-browser-toolbar [role=status]')?.textContent==='Preview up to date'");};
  const saved=()=>wait("document.querySelector('.learning-save-status')?.classList.contains('saved')");
  const state=async()=>{await saved();return(await(await fetch(preview.url+"api/learning")).json()).state;};
  const fits=async label=>assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"),true,label+" fits without document overflow");
  const screenshot=async name=>{await new Promise(resolve=>setTimeout(resolve,250));const shot=await command("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});await writeFile(join(runtime,name),Buffer.from(shot.data,"base64"));};
  failureShot=()=>screenshot("web-paths-failure.png");
  const record=()=>evaluate("(()=>{window.__explorerMessages=[];addEventListener('message',event=>{if(event.source===document.querySelector('.web-preview-panel iframe')?.contentWindow)window.__explorerMessages.push(event.data);});})()");
  const last=type=>evaluate(`window.__explorerMessages.filter(item=>item.type===${JSON.stringify(type)}).at(-1)`);
  const home=async()=>{await evaluate("document.querySelector('.brand').click()");await wait("document.querySelector('.learning-dashboard')&&document.querySelectorAll('.language-card').length===6");};
  const open=async language=>{
    await evaluate(`document.querySelector('.language-card[data-language=${language}]').click()`);
    await wait("document.querySelectorAll('.practice-path-card').length===4");
    await evaluate("document.querySelector('.practice-path-card[data-path=render]').click()");
    await wait("document.querySelector('.web-workspace')&&document.querySelectorAll('.web-workspace .topic-button').length===10");
    await ready();
    assert.equal(await evaluate("document.querySelector('.topic-button.selected').dataset.entry"),language==="html"?"tag-explorer":"style-explorer");
    const groups=[...new Set(webLessons[language].map(lesson=>lesson.group))], ordered=groups.flatMap(group=>webLessons[language].filter(lesson=>lesson.group===group).map(lesson=>lesson.id));
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.web-workspace .topic-button')].map(button=>button.dataset.entry)"),ordered,"Explorer comes before the original nine lessons in the existing grouped sidebar");
  };
  const inspect=async selector=>{
    const before=await evaluate("window.__explorerMessages.filter(item=>item.type==='inspection').length");
    await evaluate(`(()=>{const channel=window.__explorerMessages.filter(item=>item.type==='ready').at(-1).channel;document.querySelector('.web-preview-panel iframe').contentWindow.postMessage({channel,type:'inspect-selector',selector:${JSON.stringify(selector)}},'*');})()`);
    await wait(`window.__explorerMessages.filter(item=>item.type==='inspection').length>${before}`);
    return(await last("inspection")).inspection;
  };
  const reload=async()=>{await saved();await command("Page.reload",{ignoreCache:true});await wait("document.querySelector('.learning-dashboard')&&document.querySelectorAll('.language-card').length===6");await saved();await record();};

  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await command("Page.navigate",{url:preview.url});
  await wait("document.querySelector('.learner-dialog')?.open");await click("Skip for now");await wait("!document.querySelector('.learner-dialog')?.open");await saved();await record();


  const openHub=async language=>{
    await home();await evaluate("document.querySelector('.language-card[data-language="+language+"]').click()");
    await wait("document.querySelectorAll('.practice-path-card').length===4");
    assert.equal(await evaluate("document.querySelectorAll('.path-hub .daily-card').length"),1);
    assert.equal(await evaluate("document.querySelector('.daily-card p').textContent.includes('rendering exercises')"),true);
  };
  const path=async id=>{
    await evaluate("document.querySelector('.practice-path-card[data-path="+id+"]').click()");
    await ready();assert.equal(await evaluate("document.querySelector('.app-scene').dataset.path"),id);
    assert.equal(await evaluate("document.querySelectorAll('.web-workspace .topic-button').length"),id==='render'?10:9);
    assert.equal(await evaluate("document.querySelectorAll('.web-path-navigation button').length"),4);
  };
  const back=async()=>{await click('Practice paths');await wait("document.querySelectorAll('.practice-path-card').length===4");};
  const edit=async(type,value)=>{await click(type==='html'?'index.html':'styles.css','.web-file-tabs button');await field('#web-code-editor',value);await ready();};
  const commentKey=async selector=>{
    await evaluate("(()=>{const field=document.querySelector("+JSON.stringify(selector)+");field.focus();field.setSelectionRange(0,field.value.length);})()");
    await command('Input.dispatchKeyEvent',{type:'keyDown',key:'/',code:'Slash',modifiers:2,windowsVirtualKeyCode:191});
    await command('Input.dispatchKeyEvent',{type:'keyUp',key:'/',code:'Slash',modifiers:2,windowsVirtualKeyCode:191});
  };
  for(const language of ['html','css']){
    await openHub(language);await screenshot('web-paths-'+language+'-hub.png');
    await path('render');await back();await path('basics');
    await edit('html','<p id="comment-target">Visible before commenting</p>');
    await commentKey('#web-code-editor');await ready();
    assert.equal(await evaluate("document.querySelector('#web-code-editor').value"),'<!-- <p id="comment-target">Visible before commenting</p> -->');
    assert.equal((await last('ready')).nodes.some(node=>node.id==='comment-target'),false,'Commented HTML stops rendering');
    await click('Comment / uncomment','.code-comment-tools button');await ready();
    assert.equal((await last('ready')).nodes.some(node=>node.id==='comment-target'),true,'Uncommented HTML renders again');
    await edit('css','#comment-target { color: rgb(0, 128, 0); }');
    await commentKey('#web-code-editor');await ready();
    assert.equal(await evaluate("document.querySelector('#web-code-editor').value"),'/* #comment-target { color: rgb(0, 128, 0); } */');
    await click('Comment / uncomment','.code-comment-tools button');await ready();
    assert.equal(await evaluate("document.querySelector('#web-code-editor').value"),'#comment-target { color: rgb(0, 128, 0); }');
    await back();await path('interviews');
    await evaluate("document.querySelector('#web-step-1').click()");await wait("document.querySelector('.interview-review h3')?.textContent==='A clear answer'");
    await evaluate("document.querySelector('#web-step-2').click()");
    const answer=language.toUpperCase()+': my explanation and a concrete example.';
    await field('#interview-answer',answer);await click('Compare with model answer');await click('Mark this question practiced');await saved();
    let stored=await state();
    const entry=webLessons[language][1];
    assert.deepEqual(stored.completed[language+':interviews'],[entry.id]);
    assert.equal(JSON.parse(stored.drafts[language+':interviews:'+entry.id].value).answer,answer);
    await home();await reload();await click('Continue learning');await ready();
    assert.equal(await evaluate("document.querySelector('#interview-answer').value"),answer,'Interview answer resumes after reload');
    await back();await path('problems');
    assert.equal(await evaluate("document.querySelector('#web-step-2').getAttribute('aria-selected')"),'true');
    await click('Show solution');await ready();
    assert.equal((await state()).completed[language+':problems'],undefined,'Revealing a solution does not finish the challenge');
    await click('Restore','.web-editor-panel button');await ready();
    await edit('html',entry.challenge.solution.html);await edit('css',entry.challenge.solution.css);
    await click('Check my page');await wait("document.querySelector('.practice-feedback.correct')");
    assert.deepEqual((await state()).completed[language+':problems'],[entry.id]);
    await back();await click('Start daily practice','.daily-card button');await ready();
    await click('Next rendering exercise','.daily-next button');await ready();
    const date=await evaluate("(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})()");
    const plan=dailyPlan(language,date);
    await edit('html',plan.predictions[0].challenge.solution.html);await saved();
    await home();await reload();await openHub(language);await click('Continue daily practice','.daily-card button');await ready();
    assert.equal(await evaluate("[...document.querySelectorAll('.daily-step-list li')].findIndex(item=>item.classList.contains('current'))"),1,'Daily session resumes first unfinished step');
    await click('index.html','.web-file-tabs button');
    assert.equal(await evaluate("document.querySelector('#web-code-editor').value"),plan.predictions[0].challenge.solution.html,'Daily source resumes separately from topic source');
    for(let step=1;step<=4;step++){
      const dailyEntry=step<4?plan.predictions[step-1]:plan.problem;
      await edit('html',dailyEntry.challenge.solution.html);await edit('css',dailyEntry.challenge.solution.css);
      await click('Check my page');await wait("document.querySelector('.practice-feedback.correct')");await saved();
      assert.equal((await state()).daily[plan.key].completed.length,step+1,'Daily marker saved after actual page check');
      if(step===2&&language==='css')await screenshot('web-daily-css-desktop.png');
      await click(step===4?"Finish today's practice":step===3?'Continue to coding':'Next rendering exercise','.daily-next button');
      if(step<4)await ready();
    }
    await wait("document.querySelector('.daily-finish')");
    stored=await state();assert.equal(stored.daily[plan.key].completed.length,5);
    assert.deepEqual(stored.stats,{attempts:0,correct:0},'Web checks keep programming quiz statistics independent');
    await click('Back to practice');await wait("document.querySelectorAll('.practice-path-card').length===4");
    assert.equal(await evaluate("document.querySelector('.daily-card-bottom span').textContent"),'5/5 steps complete');
  }
  for(const width of [390,360]){
    await command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
    for(const language of ['html','css']){
      await openHub(language);await fits(width+'px '+language+' hub');
      if(width===390&&language==='html')await screenshot('web-paths-mobile-hub.png');
      for(const id of ['render','basics','interviews','problems']){await path(id);await fits(width+'px '+language+' '+id);await back();}
      await click("Review today's practice",'.daily-card button');await wait("document.querySelector('.daily-finish')");await fits(width+'px '+language+' daily finish');
    }
  }
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  for(const language of ['javascript','python','java','c']){
    await home();await evaluate("document.querySelector('.language-card[data-language="+language+"]').click()");await wait("document.querySelectorAll('.practice-path-card').length===4");
    await evaluate("document.querySelector('.practice-path-card[data-path=problems]').click()");await wait("document.querySelector('.practice-flow-tabs')");await evaluate("document.querySelector('#flow-tab-2').click()");
    const problem=curricula[language].problems[0], marker=language==='python'?'#':'//';
    await field('#code-expression',problem.answers[0]);await commentKey('#code-expression');
    assert.equal(await evaluate("document.querySelector('#code-expression').value.startsWith("+JSON.stringify(marker+' ')+")"),true);
    await click('Comment / uncomment','.code-comment-tools button');
    assert.equal(await evaluate("document.querySelector('#code-expression').value"),problem.answers[0]);
    await field('#code-expression',marker+' My explanation'+String.fromCharCode(10)+problem.answers[0]);
    await click('Check expression');await wait("document.querySelector('.practice-feedback.correct')");
  }
  assert.deepEqual(errors,[],'No browser runtime exceptions');
  console.log(JSON.stringify({passed:true,checks:['HTML/CSS four-path hubs and dashboards','source-preserving HTML/CSS Ctrl+/ and touch commenting','saved interview answers and review completion','rendered coding challenges with solution reveal protection','five-step native browser daily exercise and source reload','all eight web paths and daily layouts at390/360px','commented guided code accepted in JavaScript/Python/Java/C','no runtime exceptions']}));
  await command('Browser.close').catch(()=>{});
} catch(error){try{await failureShot?.();}catch{}throw error;}
finally{socket?.close();browser.kill();preview.close();}

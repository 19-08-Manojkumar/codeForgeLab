import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";
import { startLearningPreview } from "./local-learning.mjs";
import { webLessons } from "../lib/web-lessons.mjs";
import { cssStyles, cssStyleGroups } from "../lib/css-styles.mjs";

const runtime=resolve(".sites-runtime");
await mkdir(runtime,{recursive:true});
const preview=await startLearningPreview(), errors=[];
const profile=join(runtime,`explorer-browser-${process.pid}`);
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
  failureShot=()=>screenshot("explorer-failure.png");
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

  const search="#web-explorer-search";
  const choose=async id=>{
    await field(search,id);
    if(await evaluate("document.querySelector('.app-scene').dataset.language==='css'")){
      const entry=cssStyles.find(entry=>entry.id===id);
      await evaluate(`document.querySelector('.web-explorer-group[data-group=${entry.groupId}]').click()`);
    }
    await wait(`document.querySelector('.web-explorer-item[data-explorer-id=${id}]')`);
    await evaluate(`document.querySelector('.web-explorer-item[data-explorer-id=${id}]').click()`);
    await ready();
    assert.equal(await evaluate(`document.querySelector('.web-explorer-item[data-explorer-id=${id}]')?.getAttribute('aria-pressed')`),"true","Selected example: "+id);
    await field(search,"");
  };
  const preset=async value=>{
    await evaluate(`(()=>{const button=[...document.querySelectorAll('[data-value]')].find(item=>item.dataset.value===${JSON.stringify(value)});if(!button)throw new Error('Missing preset '+${JSON.stringify(value)});button.click();})()`);
    await ready();
  };
  const customValue=async value=>{await field("#web-style-value",value);await click("Apply value");await ready();};

  await open("html");
  await click("Headings",".web-explorer-group");
  await wait("document.querySelector('[data-explorer-id=h6]')");
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.web-explorer-item')].map(item=>item.dataset.explorerId)"),["h1","h2","h3","h4","h5","h6"],"Headings expose all six levels as individual subtopics");
  await field(search,"Headings");
  await wait("document.querySelectorAll('.web-explorer-item').length===6");
  await field(search,"");
  const sizes=[];
  for(const tag of ["h1","h2","h3","h4","h5","h6"]){
    await evaluate(`document.querySelector('[data-explorer-id=${tag}]').click()`);
    await ready();
    const inspected=await inspect(tag);
    assert.equal(inspected.tag,tag);
    sizes.push(parseFloat(inspected.styles["font-size"]));
  }
  assert.ok(sizes.every((size,index)=>index===0||size<sizes[index-1]),"Native h1 through h6 sizes descend without CSS overrides");
  await choose("p");
  assert.equal((await inspect("p")).styles.display,"block","Paragraphs retain native block layout");
  await field(search,"a-tag-that-does-not-exist");
  await wait("!document.querySelector('.web-explorer-item')");
  assert.equal(await evaluate("document.querySelector('.web-explorer-current')!==null"),true,"Search keeps the current rendered example visible");
  await field(search,"");
  await choose("h3");
  await click("index.html",".web-file-tabs button");
  const customHtml='<h3 id="my-heading">My own level-three heading</h3><p>My own paragraph</p>';
  await field("#web-code-editor",customHtml);await ready();
  assert.equal((await inspect("#my-heading")).text,"My own level-three heading");
  await choose("p");await choose("h3");
  assert.equal(await evaluate("document.querySelector('#web-code-editor').value"),customHtml,"Switching tags keeps edits in this browser session");
  let stored=await state();
  assert.equal(JSON.parse(stored.drafts["html:render:tag-explorer"].value).explorerId,"h3");
  assert.equal(JSON.parse(stored.drafts["html:render:tag-explorer"].value).html,customHtml);
  await screenshot("explorer-html-desktop.png");
  await home();await reload();await click("Continue learning");await ready();
  assert.equal(await evaluate("document.querySelector('[data-explorer-id=h3]')?.getAttribute('aria-pressed')"),"true","Selected HTML tag survives reload");
  assert.equal(await evaluate("document.querySelector('#web-code-editor').value"),customHtml,"Edited tag example survives reload");
  await choose("p");await choose("h3");
  assert.equal(await evaluate("document.querySelector('#web-code-editor').value"),customHtml,"Reloaded HTML edits survive switching away before any edit");
  await click("Restore",".web-editor-panel button");await ready();
  const restoredHtml=await evaluate("document.querySelector('#web-code-editor').value");
  await choose("p");await choose("h3");
  assert.equal(await evaluate("document.querySelector('#web-code-editor').value"),restoredHtml,"Restored HTML remains restored after switching away and returning");
  await field("#web-code-editor",customHtml);await ready();
  await home();
  console.log("Explorer smoke: heading levels, paragraph, grouped tags, search, edits and persistence checked");

  await open("css");
  await field(search,cssStyleGroups.find(group=>group.id==="flex").title);
  await evaluate("document.querySelector('.web-explorer-group[data-group=flex]').click()");
  assert.equal(await evaluate("document.querySelectorAll('.web-explorer-item').length"),cssStyles.filter(entry=>entry.groupId==="flex").length,"Family search includes every property in that family");
  await field(search,"");
  for(const property of ["display","flex","grid","height"]){
    await field(search,property);
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.web-explorer-item')].map(item=>item.dataset.explorerId)"),[property],"Exact property search: "+property);
  }
  await field(search,"");
  await choose("color");
  const color=cssStyles.find(entry=>entry.id==="color"),padding=cssStyles.find(entry=>entry.id==="padding"),flex=cssStyles.find(entry=>entry.id==="flex-direction"),opacity=cssStyles.find(entry=>entry.id==="opacity");
  await preset("#b43e66");
  assert.equal((await inspect(color.selector)).styles.color,"rgb(180, 62, 102)","Color preset changes rendered text");
  await customValue("#6a28a0");
  assert.equal((await inspect(color.selector)).styles.color,"rgb(106, 40, 160)","Custom color changes rendered text");
  const validCss=await evaluate("document.querySelector('#web-code-editor').value");
  await field("#web-style-value","not-a-color");await click("Apply value");
  await wait("document.querySelector('#web-style-error')&&document.querySelector('#web-style-value').getAttribute('aria-invalid')==='true'");
  assert.equal(await evaluate("document.querySelector('#web-code-editor').value"),validCss,"An invalid property value keeps the CSS draft intact");
  await click("Restore",".web-editor-panel button");await ready();
  assert.equal(await evaluate("document.querySelector('#web-style-value').value"),color.value,"Restore also resets the CSS value control");
  assert.equal(await evaluate("document.querySelector('#web-style-error')===null"),true,"Restore clears invalid-value feedback");
  await choose("padding");await preset("24px");
  assert.equal((await inspect(padding.selector)).styles.padding,"24px","Padding preset changes the rendered box");
  await customValue("40px");
  assert.equal((await inspect(padding.selector)).styles.padding,"40px","Custom padding changes the rendered box");
  await choose("opacity");await customValue("0.4");
  const translucent=await inspect(opacity.selector);
  assert.equal(Object.keys(translucent.styles)[0],"opacity","Selected CSS property appears first in computed styles");
  assert.equal(translucent.styles.opacity,"0.4");
  await choose("content");await customValue('"Generated: "');
  const generated=await inspect(cssStyles.find(entry=>entry.id==="content").selector);
  assert.equal(generated.pseudo,"::before");
  assert.equal(generated.styles.content,'"Generated: "',"Generated content inspects the pseudo-element value");
  const points=await evaluate("document.querySelectorAll('.web-token-button').length");
  for(let index=0;index<points;index++){
    const before=await evaluate("window.__explorerMessages.filter(item=>item.type==='inspection').length");
    await evaluate(`document.querySelectorAll('.web-token-button')[${index}].click()`);
    await wait(`window.__explorerMessages.filter(item=>item.type==='inspection').length>${before}`);
    assert.equal((await last("inspection")).inspection.pseudo,"::before","Content explanation points to its pseudo-element");
  }
  await choose("flex-direction");await preset("column");
  const stacked=await inspect(flex.selector);
  assert.equal(stacked.styles.display,"flex");
  assert.equal(stacked.styles["flex-direction"],"column","Flex preset changes layout direction");
  assert.ok(stacked.children.length>=3,"Flex demonstration contains multiple visible items");
  const savedCss=await evaluate("document.querySelector('#web-code-editor').value");
  await evaluate("document.querySelector('#web-step-2').click()");
  assert.equal(await evaluate("[...document.querySelectorAll('.web-teaching-panel button')].find(button=>button.textContent==='Mark this explorer practiced').disabled"),true,"Exploration asks learners to compare the changes before recording practice");
  await evaluate("document.querySelector('.web-explorer-review input').click()");await click("Mark this explorer practiced");
  await wait("document.querySelector('.web-teaching-panel button')?.textContent==='Exploration recorded'");
  stored=await state();
  assert.deepEqual(stored.completed["css:render"],["style-explorer"]);
  assert.deepEqual(stored.stats,{attempts:0,correct:0},"Browser exploration preserves programming statistics");
  assert.equal(JSON.parse(stored.drafts["css:render:style-explorer"].value).explorerId,"flex-direction");
  assert.equal(JSON.parse(stored.drafts["css:render:style-explorer"].value).css,savedCss);
  await screenshot("explorer-css-desktop.png");
  await home();await reload();await click("Continue learning");await ready();
  assert.equal(await evaluate("document.querySelector('[data-explorer-id=flex-direction]')?.getAttribute('aria-pressed')"),"true","Selected CSS style survives reload");
  assert.equal(await evaluate("document.querySelector('#web-code-editor').value"),savedCss,"Edited CSS survives reload");
  assert.equal(await evaluate("document.querySelector('#web-style-value').value"),"column","Selected CSS value survives reload");
  assert.equal(await evaluate("document.querySelector('#web-step-2').getAttribute('aria-selected')"),"true","Explorer mode survives reload");
  await choose("color");await choose("flex-direction");
  assert.equal(await evaluate("document.querySelector('#web-code-editor').value"),savedCss,"Reloaded CSS edits survive switching away before any edit");
  await click("Restore",".web-editor-panel button");await ready();
  const restoredCss=await evaluate("document.querySelector('#web-code-editor').value");
  await choose("color");await choose("flex-direction");
  assert.equal(await evaluate("document.querySelector('#web-code-editor').value"),restoredCss,"Restored CSS remains restored after switching away and returning");
  assert.equal(await evaluate("document.querySelector('#web-style-value').value"),flex.value,"Restored CSS value remains restored after switching tags");
  await home();
  console.log("Explorer smoke: color, padding, opacity, flex presets, invalid/custom values, practice and CSS persistence checked");
  for(const width of [390,360]){
    await command("Emulation.setDeviceMetricsOverride",{width,height:844,deviceScaleFactor:1,mobile:true});
    for(const language of ["html","css"]){
      await open(language);await fits(`${width}px ${language} explorer`);
      await field(search,language==="html"?"h6":"padding");
      await fits(`${width}px ${language} search results`);
      await field(search,"");
      if(width===390&&language==="html")await screenshot("explorer-mobile.png");
      await home();
    }
  }
  assert.equal(errors.length,0,"No browser runtime exceptions");
  console.log(JSON.stringify({passed:true,checks:["new first lesson before the original nine","grouped heading tags h1 through h6","native heading sizes and paragraph layout","tag search and empty results","live edits and selected tag survive reload","rendered color, padding, opacity and flex presets","custom CSS values and invalid-value feedback","explorer practice and saved mode/content/selection","mobile390/360 search and previews","no runtime exceptions"],screenshots:["explorer-html-desktop.png","explorer-css-desktop.png","explorer-mobile.png"]}));
  await command("Browser.close").catch(()=>{});
} catch(error){try{await failureShot?.();}catch{}throw error;}
finally{socket?.close();browser.kill();preview.close();}

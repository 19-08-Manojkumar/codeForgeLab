import assert from "node:assert/strict";

export async function checkPageRefresh({ evaluate, wait, click, call, field }) {
  const base = await evaluate("location.origin");
  const home = async () => { await evaluate("document.querySelector('.brand').click()"); await wait("document.querySelector('.home-overview')"); };
  const refresh = async expected => {
    const url = await evaluate("location.href"), origin = await evaluate("performance.timeOrigin");
    await call("Page.reload");
    await wait(`performance.timeOrigin!==${origin} && !document.querySelector('main[aria-busy=true]') && (${expected})`);
    assert.equal(await evaluate("location.href"), url, "Refresh preserves the current destination");
  };
  await home();
  for (const language of ["javascript", "python", "java", "c", "html", "css"]) {
    await evaluate(`document.querySelector('.language-card[data-language=${language}]').click()`);
    await wait("document.querySelector('.path-hub')");
    await refresh(`document.querySelector('.path-hub') && document.querySelector('.app-scene').dataset.language==='${language}'`);
    const path = ["html", "css"].includes(language) ? "render" : "methods";
    await evaluate(`document.querySelector('.practice-path-card[data-path=${path}]').click()`);
    await wait("document.querySelectorAll('.topic-button').length>2");
    await evaluate("document.querySelectorAll('.topic-button')[2].click()");
    await wait("new URLSearchParams(location.search).get('topic')!==null");
    const selected = await evaluate("document.querySelector('.topic-button.selected .topic-name').textContent");
    if (["javascript", "python"].includes(language)) await click("Test yourself", ".mode-switch button");
    else await evaluate("document.querySelectorAll('.practice-flow-tabs button')[2].click()");
    const mode = ["javascript", "python"].includes(language) ? "test" : "practice";
    await wait(`new URLSearchParams(location.search).get('mode')==='${mode}'`);
    await refresh(`document.querySelector('.topic-button.selected .topic-name')?.textContent===${JSON.stringify(selected)} && document.querySelector('.app-scene').dataset.session==='${mode}'`);
    await home();
  }
  await click("Mistake notebook", ".notebook-trigger");
  await wait("document.querySelector('.notebook-workspace')");
  await refresh("document.querySelector('.notebook-workspace')");
  await home();
  await call("Page.navigate", { url: `${base}/?screen=daily&language=python` });
  await wait("document.querySelector('.daily-workspace')");
  await evaluate("document.querySelector('.daily-step-list button').click()");
  await wait("document.querySelector('.daily-concept')");
  await refresh("document.querySelector('.daily-workspace')");
  await click("Continue to predictions");
  await wait("new URLSearchParams(location.search).get('step')==='1'");
  await click("Concept", ".daily-step-list button");
  await wait("new URLSearchParams(location.search).get('step')==='0'");
  await refresh("document.querySelector('.daily-concept') && new URLSearchParams(location.search).get('step')==='0'");
  await home();
  for (const language of ["html", "css"]) {
    await call("Page.navigate", { url: `${base}/?screen=daily&language=${language}` });
    await wait("document.querySelector('.web-daily-workspace')");
    await evaluate("document.querySelectorAll('.practice-flow-tabs button')[1].click()");
    await wait("new URLSearchParams(location.search).get('mode')==='learn'");
    await refresh("document.querySelector('.web-daily-workspace') && document.querySelectorAll('.practice-flow-tabs button')[1]?.getAttribute('aria-selected')==='true'");
    await home();
  }
  assert.equal(await evaluate("new URLSearchParams(location.search).has('screen') || new URLSearchParams(location.search).has('language')"), false, "Home clears the previous destination");
  await refresh("document.querySelector('.home-overview')");
  await evaluate("history.back()");
  await wait("document.querySelector('.daily-workspace')");
  await evaluate("history.forward()");
  await wait("document.querySelector('.home-overview')");
  await evaluate("document.querySelector('.home-design-level-card.level-1').click()");
  await wait("document.querySelector('.design-topbar') && new URLSearchParams(location.search).get('topic')");
  await field(".design-code-area textarea", "<h1>Keep this draft after refresh</h1>");
  await evaluate("new Promise(resolve=>setTimeout(resolve,500))");
  const firstChallenge = await evaluate("new URLSearchParams(location.search).get('topic')");
  await refresh("document.querySelector('.design-topbar') && document.querySelector('.design-code-area textarea')?.value==='<h1>Keep this draft after refresh</h1>'");
  await click("Next challenge");
  await wait(`new URLSearchParams(location.search).get('topic')!==${JSON.stringify(firstChallenge)}`);
  const nextTitle = await evaluate("document.querySelector('.design-challenge-heading h1').textContent");
  await refresh(`document.querySelector('.design-topbar') && document.querySelector('.design-challenge-heading h1')?.textContent===${JSON.stringify(nextTitle)}`);
  await click("All levels", ".design-topbar button");
  await wait("document.querySelector('.design-levels') && !new URLSearchParams(location.search).has('level')");
  await refresh("document.querySelectorAll('.design-level-card').length===4");
  await home();
}

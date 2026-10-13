import assert from "node:assert/strict";
import { checkSessionCards } from "./session-card-browser-checks.mjs";

export async function checkLanguageEffects({ evaluate, wait, click, call, screenshot }) {
  const ids = ["javascript", "python", "java", "c", "html", "css"];
  const home = async () => { await evaluate("document.querySelector('.brand').click()"); await wait("document.querySelectorAll('.language-effect-card').length===6"); };
  const fits = async () => assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"), true, "The layout fits the viewport");
  const animated = selector => evaluate(`[...document.querySelectorAll(${JSON.stringify(selector)})].filter(node=>getComputedStyle(node).animationName!=='none').map(node=>({name:getComputedStyle(node).animationName,state:getComputedStyle(node).animationPlayState}))`);
  await home();
  assert.equal(await evaluate("new Set([...document.querySelectorAll('.language-effect-card')].map(card=>getComputedStyle(card).backgroundImage)).size"), 6, "Every language has a distinct card background");
  assert.equal(await evaluate("new Set([...document.querySelectorAll('.language-effect-card')].map(card=>card.dataset.motif)).size"), 6, "Each language has its own illustration and motion");
  for (const width of [1440, 390, 360]) {
    await call("Emulation.setDeviceMetricsOverride", { width, height:1000, deviceScaleFactor:1, mobile:width<760 });
    await fits();
    await evaluate("new Promise(resolve=>setTimeout(resolve,650))");
    assert.equal(await evaluate("[...document.querySelectorAll('.language-effect-card')].every(card=>getComputedStyle(card).opacity==='1' && card.getBoundingClientRect().height>=120)"), true, "The complete cards are visible and usable");
    await screenshot(`language-cards-${width}.png`);
  }
  await call("Emulation.setDeviceMetricsOverride", { width:1440, height:1000, deviceScaleFactor:1, mobile:false });
  for (const language of ids) {
    await evaluate(`document.querySelector('.language-effect-card[data-language=${language}]').click()`);
    await wait(`document.querySelector('.path-hub') && document.querySelector('.language-portal')?.dataset.language==='${language}'`);
    assert.equal(await evaluate("new URLSearchParams(location.search).get('language')"), language, "The destination changes immediately");
    assert.equal(await evaluate("document.querySelector('.language-portal').inert && getComputedStyle(document.querySelector('.language-portal')).pointerEvents==='none'"), true, "The portal never captures input");
    if (language === "java") {
      await evaluate("new Promise(resolve=>setTimeout(resolve,300))");
      await screenshot("java-code-portal.png");
    }
    await wait("!document.querySelector('.language-portal')");
    if (language === "java") {
      const origin = await evaluate("performance.timeOrigin"), href = await evaluate("location.href");
      await call("Page.reload");
      await wait(`performance.timeOrigin!==${origin} && document.querySelector('.path-hub') && document.querySelector('.app-scene').dataset.language==='java'`);
      assert.equal(await evaluate("location.href"), href, "Refreshing after a portal preserves the selected language");
      assert.equal(await evaluate("Boolean(document.querySelector('.language-portal'))"), false, "Refreshing does not replay the entrance portal");
    }
    assert.equal(await evaluate("document.querySelector('.language-hub-effects').getAttribute('aria-hidden')==='true' && document.querySelector('.language-hub-effects').inert"), true);
    assert.ok((await animated(".language-hub-effects *")).length>0, "The hub has its own animated code scene");
    await fits();
    await home();
  }
  await click("Pause motion", ".ambient-toggle");
  assert.ok((await animated(".language-effect-card *")).every(item=>item.state==="paused"), "Pause freezes all card illustrations");
  await evaluate("document.querySelector('.language-effect-card[data-language=java]').click()");
  await wait("document.querySelector('.path-hub')");
  assert.equal(await evaluate("Boolean(document.querySelector('.language-portal'))"), false, "Paused motion navigates without a portal");
  assert.ok((await animated(".language-hub-effects *")).every(item=>item.state==="paused"), "The hub also respects Pause motion");
  await home();
  assert.equal(await evaluate("[...document.querySelectorAll('.language-effect-card')].every(card=>getComputedStyle(card).opacity==='1')"), true, "Returning home with motion paused never hides cards");
  await click("Resume motion", ".ambient-toggle");
  await call("Emulation.setEmulatedMedia", { features:[{name:"prefers-reduced-motion",value:"reduce"}] });
  assert.deepEqual(await animated(".language-effect-card *"), [], "Reduced motion leaves static card artwork");
  await evaluate("document.querySelector('.language-effect-card[data-language=css]').click()");
  await wait("document.querySelector('.path-hub')");
  assert.equal(await evaluate("Boolean(document.querySelector('.language-portal'))"), false, "Reduced motion navigates immediately");
  await call("Emulation.setEmulatedMedia", { features:[{name:"prefers-reduced-motion",value:"no-preference"}] });
  await home();
  await evaluate("document.querySelector('.language-effect-card[data-language=java]').click();document.querySelector('.brand').click();document.querySelector('.language-effect-card[data-language=python]')?.click()");
  await wait("document.querySelector('.app-scene').dataset.language==='python' && document.querySelector('.path-hub')");
  await wait("!document.querySelector('.language-portal')");
  assert.equal(await evaluate("new URLSearchParams(location.search).get('language')"), "python", "Rapid selection never sends the user to an earlier destination");
  await screenshot("python-language-hub.png");
  await checkSessionCards({evaluate,wait,click,call,screenshot});
}

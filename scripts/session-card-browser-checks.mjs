import assert from "node:assert/strict";

export async function checkSessionCards({ evaluate, wait, click, call, screenshot }) {
  const home = async () => { await evaluate("document.querySelector('.brand').click()"); await wait("document.querySelector('.home-design-levels')"); };
  const fits = async () => assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"), true, "Decorated cards fit the viewport");
  const paletteCount = selector => evaluate(`new Set([...document.querySelectorAll(${JSON.stringify(selector)})].map(card=>getComputedStyle(card).backgroundImage)).size`);
  const states = selector => evaluate(`[...document.querySelectorAll(${JSON.stringify(selector)})].filter(node=>getComputedStyle(node).animationName!=='none').map(node=>getComputedStyle(node).animationPlayState)`);
  const family = ".home-design-level-card *, .home-related-link *, .design-level-card *, .practice-path-card *";
  await home();
  assert.equal(await paletteCount(".home-design-level-card"), 4, "Each home Web Design level has its own background");
  assert.equal(await paletteCount(".home-related-link"), 2, "Database and data science have distinct backgrounds");
  assert.equal(await evaluate("[...document.querySelectorAll('.home-related-link')].every(link=>link.target==='_blank' && link.rel.includes('noopener') && new URL(link.href).origin!==location.origin)"), true, "Learning project links keep their original behavior");
  for (const width of [1440, 390, 360]) {
    await call("Emulation.setDeviceMetricsOverride", { width, height:1000, deviceScaleFactor:1, mobile:width<760 });
    await fits();
    await evaluate("document.querySelector('.home-design-levels').scrollIntoView({block:'start',behavior:'instant'})");
    await screenshot(`session-cards-home-${width}.png`);
    for (const language of ["javascript", "python", "java", "c", "html", "css"]) {
      await evaluate(`document.querySelector('.language-switch .language-mark.${language}').closest('button').click()`);
      await wait(`document.querySelector('.path-hub') && document.querySelector('.app-scene').dataset.language==='${language}'`);
      assert.equal(await paletteCount(".practice-path-card"), 4, "All four practice paths have their own background");
      assert.equal(await evaluate("document.querySelectorAll('.practice-path-card .card-decoration').length"), 4);
      await fits();
      if (language === "java") {
        await wait("!document.querySelector('.language-portal')");
        await screenshot(`java-practice-cards-${width}.png`);
      }
    }
    await home();
    await evaluate("document.querySelector('.home-design-level-card.level-1').click()");
    await wait("document.querySelector('.design-workspace')");
    await click("All levels", ".design-topbar button");
    await wait("document.querySelectorAll('.design-level-card').length===4");
    assert.equal(await paletteCount(".design-level-card"), 4, "The Web Design session has four distinct backgrounds");
    await fits();
    await screenshot(`web-design-level-cards-${width}.png`);
    await home();
  }
  assert.ok((await states(family)).length>0, "The new card illustrations animate");
  assert.equal(await evaluate("[...document.querySelectorAll('.card-decoration')].every(node=>node.inert && node.getAttribute('aria-hidden')==='true' && getComputedStyle(node).pointerEvents==='none')"), true, "Decorations never capture input or add screen reader noise");
  await click("Pause motion", ".ambient-toggle");
  assert.ok((await states(family)).every(state=>state==="paused"), "Pause freezes Web Design and related-learning artwork");
  await evaluate("document.querySelector('.language-switch .language-mark.java').closest('button').click()");
  await wait("document.querySelector('.path-hub')");
  assert.ok((await states(family)).every(state=>state==="paused"), "Newly opened path cards stay paused");
  assert.equal(await evaluate("[...document.querySelectorAll('.practice-path-card')].every(card=>getComputedStyle(card).opacity==='1')"), true, "Paused entry effects leave path cards visible");
  await evaluate("document.querySelector('.practice-path-card[data-path=basics]').click()");
  await wait("document.querySelector('.practice-workspace')");
  await home();
  await click("Resume motion", ".ambient-toggle");
  await call("Emulation.setEmulatedMedia", { features:[{name:"prefers-reduced-motion",value:"reduce"}] });
  assert.deepEqual(await states(family), [], "Reduced motion keeps the decorative artwork static");
  await call("Emulation.setEmulatedMedia", { features:[{name:"prefers-reduced-motion",value:"no-preference"}] });
}

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { designChallenges, getDesignChallenge } from "../lib/web-design-challenges.mjs";
import { createDesignRun, designDraftKey } from "../lib/web-design-session.mjs";
import { applyLearningEvent } from "../lib/learning-state.mjs";

// Reuse the real Next/Supabase browser harness, with only its simulated accounts.
export async function checkWebDesign({ states, accounts, signIn, signOut, saved, evaluate, wait, click, field, call, screenshot }) {
  const owner = accounts[1];
  const run = createDesignRun(1, null, "browser-design");
  run.order = ["l1-table", ...run.order.filter(id => id !== "l1-table")];
  run.variants["l1-table"] = 0;
  states.get(owner.id).state = applyLearningEvent(states.get(owner.id).state, { type: "design-start", id: randomUUID(), run });
  const backendWait = async predicate => {
    for (let tries = 0; tries < 200; tries++) {
      if (predicate(states.get(owner.id).state.design)) return;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error("Web Design account update did not finish saving.");
  };
  const open = async () => { await evaluate("document.querySelector('.home-design-session').click()"); await wait("document.querySelectorAll('.design-level-card').length===4"); };
  const fillSolution = async challenge => {
    for (const file of challenge.level >= 3 ? ["html", "css", "js"] : ["html", "css"]) {
      await click(({ html:"HTML", css:"CSS", js:"JavaScript" })[file], ".design-editor-panel [role=tab]");
      await field(".design-code-area textarea", challenge.solution[file]);
    }
  };
  await signIn(owner); await saved(); await open();
  assert.equal(await evaluate("[...document.querySelectorAll('.design-level-progress')].every(item=>item.textContent.includes('15 challenges'))"), true);
  for (const width of [1440, 390, 360]) {
    await call("Emulation.setDeviceMetricsOverride", { width, height:900, deviceScaleFactor:1, mobile:width<760 });
    assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"), true, `${width}px design levels fit the viewport`);
    await screenshot(`web-design-levels-${width}.png`);
  }
  await click("Continue · 1/15", ".design-level-card.level-1 button");
  await wait("document.querySelector('.design-code-area textarea') && document.querySelectorAll('.design-preview-canvas iframe').length===2");
  assert.equal(await evaluate("document.querySelector('.design-code-area textarea').value==='' && !document.querySelector('.design-solution')"), true, "The exercise starts without the solution code");
  assert.equal(await evaluate("[...document.querySelectorAll('.design-preview-canvas iframe')].every(frame=>frame.getAttribute('sandbox')==='allow-scripts')"), true);
  await click("Check my design"); await wait("document.querySelector('.design-result-score')");
  assert.equal(await evaluate("document.querySelector('.design-result-score').textContent"), "0/100", "Blank code does not pass");
  const table = getDesignChallenge("l1-table", 0);
  await fillSolution(table);
  await click("Check my design"); await wait("document.querySelector('.design-feedback h2')?.textContent==='Full match!'");
  await backendWait(design => design.results[table.id]?.perfect);
  assert.equal(states.get(owner.id).state.design.results[table.id].bestScore, 100);
  for (const width of [1440, 390, 360]) {
    await call("Emulation.setDeviceMetricsOverride", { width, height:1000, deviceScaleFactor:1, mobile:width<760 });
    assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"), true, `${width}px design editor fits the viewport`);
    await screenshot(`web-design-workspace-${width}.png`);
  }
  await click("Next challenge");
  await wait("document.querySelector('.design-topbar')?.textContent.includes('Challenge 2 of 15')");
  const secondId = run.order[1], second = getDesignChallenge(secondId, run.variants[secondId]);
  await click("Reveal answer");
  await wait("document.querySelector('.design-score-tag')?.textContent==='Assisted practice' && document.querySelector('.design-solution')");
  assert.equal(await evaluate("document.querySelector('.design-solution code').textContent"), second.solution.html);
  await fillSolution(second); await click("Check my design"); await wait("document.querySelector('.design-feedback h2')?.textContent==='Full match!'");
  await backendWait(design => design.results[secondId]?.assisted);
  assert.equal(states.get(owner.id).state.design.results[secondId].passed, false, "Revealed solutions do not earn independent completion");
  await call("Page.reload"); await saved(); await open(); await click("Continue · 2/15", ".design-level-card.level-1 button");
  await wait("document.querySelector('.design-score-tag')?.textContent==='Assisted practice'");
  assert.equal(await evaluate("document.querySelector('.design-code-area textarea').value"), second.solution.html, "Account draft resumes after reload");
  await click("CSS", ".design-editor-panel [role=tab]");
  await field(".design-code-area textarea", second.solution.css + "\n/* saved edit */");
  await click("All levels", ".design-topbar button");
  await backendWait(design => design.drafts[designDraftKey(secondId, second.variant)]?.code.css.endsWith("/* saved edit */"));
  await click("New run", ".design-level-card.level-1 button");
  await backendWait(design => design.runs[1].id !== run.id);
  const fresh = states.get(owner.id).state.design.runs[1];
  assert.notDeepEqual(fresh.order, run.order); assert.notEqual(fresh.order[0], run.order[0]);
  assert.equal(run.order.every(id => fresh.variants[id] !== run.variants[id] && getDesignChallenge(id, fresh.variants[id]).fingerprint !== getDesignChallenge(id, run.variants[id]).fingerprint), true, "Every task gets a different target version in the new run");
  assert.equal(await evaluate("document.querySelector('.design-code-area textarea').value==='' && document.querySelector('.design-score-tag').textContent==='Up to 100 points'"), true);
  await click("All levels", ".design-topbar button");
  await click("Start level", ".design-level-card.level-3 button");
  await backendWait(design => !!design.runs[3]);
  const interactiveRun = states.get(owner.id).state.design.runs[3];
  const interactive = getDesignChallenge(interactiveRun.order[0], interactiveRun.variants[interactiveRun.order[0]]);
  assert.equal(interactive.checks.some(check => check.type === "behavior"), true);
  await fillSolution(interactive); await click("Check my design");
  await wait("document.querySelector('.design-feedback h2')?.textContent==='Full match!'");
  await backendWait(design => design.results[interactive.id]?.perfect);
  assert.equal(designChallenges.filter(item => item.level === 3).length, 15);
  await screenshot("web-design-interaction.png");
  await evaluate("document.querySelector('.brand').click()"); await signOut();
  await signIn(accounts[0]); await saved(); await open();
  assert.equal(await evaluate("document.querySelector('.design-levels-summary strong').textContent"), "0/60", "Another account cannot inherit design drafts or points");
  await evaluate("document.querySelector('.brand').click()"); await signOut();
}

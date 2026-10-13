import test from "node:test";
import assert from "node:assert/strict";
import { normalizePageLocation, pageLocationUrl, readPageLocation } from "../lib/page-location.mjs";
import { lessons } from "../lib/lessons.mjs";
import { getPracticeEntries } from "../lib/curriculum.mjs";
import { getWebPracticeEntries } from "../lib/web-practice.mjs";

const roundTrip = page => readPageLocation(new URL(pageLocationUrl("https://codeforge.test/", page), "https://codeforge.test").search);

test("refresh destinations preserve language hubs, topics, and tabs across all six languages", () => {
  for (const language of ["javascript", "python", "java", "c", "html", "css"]) {
    assert.deepEqual(roundTrip({ language }), normalizePageLocation({ language }));
    const path = ["html", "css"].includes(language) ? "render" : "methods";
    const entries = lessons[language] || (["html", "css"].includes(language) ? getWebPracticeEntries(language, path) : getPracticeEntries(language, path));
    const page = { language, path, entryId: entries[2].id, mode: lessons[language] ? "test" : "practice" };
    assert.deepEqual(roundTrip(page), normalizePageLocation(page));
    assert.equal(roundTrip(page).entryId, entries[2].id);
    assert.equal(roundTrip(page).mode, page.mode);
  }
});

test("daily steps, the mistake notebook, and Web Design remain reloadable destinations", () => {
  for (const page of [
    { screen: "daily", language: "python", step: 0, mode: "teach" },
    { screen: "daily", language: "css", step: 3, mode: "practice" },
    { screen: "daily", language: "java", step: 5 },
    { screen: "notebook" },
    { screen: "design" },
    { screen: "design", level: 4 },
    { screen: "design", entryId: "l1-table" },
  ]) assert.deepEqual(roundTrip(page), normalizePageLocation(page));
});

test("invalid URL navigation cannot open nonexistent languages, paths, topics, or steps", () => {
  assert.deepEqual(readPageLocation("?language=unknown&path=methods"), normalizePageLocation());
  assert.deepEqual(readPageLocation("?language=__proto__&path=methods"), normalizePageLocation());
  assert.equal(readPageLocation("?language=html&path=methods").path, null);
  assert.equal(readPageLocation("?language=java&path=render").path, null);
  assert.equal(readPageLocation("?language=python&path=methods&topic=unknown&mode=practice").entryId, null);
  assert.equal(readPageLocation("?language=python&path=methods&mode=practice").mode, "learn");
  assert.equal(readPageLocation("?screen=daily&language=c&step=99").step, null);
  assert.equal(readPageLocation("?screen=design&level=99&topic=unknown").level, null);
});

test("navigation clears stale page fields while retaining unrelated query values and fragments", () => {
  const href = "https://codeforge.test/?language=python&path=methods&topic=len&mode=test&source=email#main-content";
  assert.equal(pageLocationUrl(href, {}), "/?source=email#main-content");
  assert.equal(pageLocationUrl(href, { language: "css" }), "/?source=email&language=css#main-content");
  assert.equal(pageLocationUrl(href, { screen: "notebook" }), "/?source=email&screen=notebook#main-content");
});

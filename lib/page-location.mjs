import { languages, practicePaths } from "./practice.mjs";
import { getPracticeEntries } from "./curriculum.mjs";
import { lessons } from "./lessons.mjs";
import { getWebPracticeEntries, webPracticePaths } from "./web-practice.mjs";
import { getDesignChallenge } from "./web-design-challenges.mjs";

const fields = { screen: "screen", language: "language", path: "path", entryId: "topic", mode: "mode", level: "level", step: "step" };
const home = { screen: "browse", language: null, path: null, entryId: null, mode: "learn", level: null, step: null };

export function normalizePageLocation(value = {}) {
  const screen = ["browse", "daily", "notebook", "design"].includes(value.screen) ? value.screen : "browse";
  const page = { ...home, screen };
  if (screen === "notebook") return page;
  if (screen === "design") {
    const challenge = getDesignChallenge(value.entryId);
    page.entryId = challenge?.id || null;
    page.level = challenge?.level || ([1, 2, 3, 4].includes(Number(value.level)) ? Number(value.level) : null);
    page.mode = "practice";
    return page;
  }
  page.language = Object.hasOwn(languages, value.language) ? value.language : null;
  if (!page.language) return { ...home };
  if (screen === "daily") {
    page.step = value.step !== null && value.step !== undefined && value.step !== "" && /^[0-5]$/.test(String(value.step)) ? Number(value.step) : null;
    page.mode = ["teach", "learn", "practice", "test"].includes(value.mode) ? value.mode : "teach";
    return page;
  }
  const paths = ["html", "css"].includes(page.language) ? webPracticePaths(page.language) : practicePaths;
  page.path = paths.some(path => path.id === value.path) ? value.path : null;
  if (!page.path) return page;
  const methods = page.path === "methods" && lessons[page.language];
  const entries = methods || (["html", "css"].includes(page.language) ? getWebPracticeEntries(page.language, page.path) : getPracticeEntries(page.language, page.path));
  page.entryId = entries.some(entry => entry.id === value.entryId) ? value.entryId : null;
  page.mode = (methods ? ["learn", "test"] : ["teach", "learn", "practice"]).includes(value.mode)
    ? value.mode : methods ? "learn" : page.path === "problems" && ["html", "css"].includes(page.language) ? "practice" : "teach";
  return page;
}

export function readPageLocation(search) {
  const params = new URLSearchParams(search);
  return normalizePageLocation(Object.fromEntries(Object.entries(fields).map(([field, key]) => [field, params.get(key)])));
}

export function pageLocationUrl(href, value) {
  const url = new URL(href), page = normalizePageLocation(value);
  for (const key of Object.values(fields)) url.searchParams.delete(key);
  for (const [field, key] of Object.entries(fields)) {
    if (page[field] === null || field === "screen" && page.screen === "browse" || field === "mode" && page.screen !== "daily" && !page.path) continue;
    url.searchParams.set(key, String(page[field]));
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

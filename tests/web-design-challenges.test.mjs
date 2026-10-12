import test from "node:test";
import assert from "node:assert/strict";
import { designLevels, designChallenges, getDesignChallenge } from "../lib/web-design-challenges.mjs";

const staticTypes = new Set(["exists", "text", "attribute", "children", "style"]);

function checkSchema(check, nested = false) {
  assert.ok(check && typeof check === "object");
  assert.ok(staticTypes.has(check.type) || !nested && check.type === "behavior", `Unknown check type: ${check.type}`);
  assert.equal(typeof check.message, "string");
  assert.ok(Number.isFinite(check.weight) && check.weight > 0);
  assert.equal(typeof check.essential, "boolean");
  if (check.type === "behavior") {
    assert.equal(check.reset, true, "Every behavior is checked from a fresh preview.");
    assert.ok(Array.isArray(check.actions) && check.actions.length > 0);
    for (const action of check.actions) {
      assert.ok(["click", "input", "change"].includes(action.type));
      assert.equal(typeof action.selector, "string");
      if (action.type !== "click") assert.equal(typeof action.value, "string");
    }
    for (const expected of Array.isArray(check.expect) ? check.expect : [check.expect]) checkSchema(expected, true);
    return;
  }
  assert.equal(typeof check.selector, "string");
  assert.ok(check.selector.length > 0);
  if (check.type === "text") assert.equal(typeof (check.equals ?? check.includes), "string");
  if (check.type === "exists") assert.ok(Number.isInteger(check.count ?? check.minCount));
  if (check.type === "attribute") assert.equal(typeof check.name, "string");
  if (check.type === "style") {
    assert.equal(typeof check.property, "string");
    assert.ok(check.value !== undefined);
    for (const rule of check.responsive || []) {
      assert.ok(Number.isFinite(rule.maxWidth) || Number.isFinite(rule.minWidth));
      assert.ok(rule.value !== undefined);
    }
  }
}

test("Web Design has four progressive levels and exactly fifteen distinct challenges per level", () => {
  assert.equal(designLevels.length, 4);
  assert.deepEqual(designLevels.map(level => level.level), [1, 2, 3, 4]);
  assert.deepEqual(designLevels.map(level => level.js), [false, false, true, true]);
  assert.equal(designChallenges.length, 60);
  assert.equal(new Set(designChallenges.map(challenge => challenge.id)).size, 60);
  assert.equal(new Set(designChallenges.map(challenge => challenge.title)).size, 60);
  for (const level of designLevels) {
    assert.equal(designChallenges.filter(challenge => challenge.level === level.level).length, 15);
    assert.ok(level.title && level.description && level.id);
  }
});

test("All sixty templates generate complete, genuinely changed reference variants", () => {
  for (const template of designChallenges) {
    const variants = [0, 1, 2].map(variant => getDesignChallenge(template.id, variant));
    assert.equal(new Set(variants.map(challenge => challenge.fingerprint)).size, 3, template.id);
    assert.equal(new Set(variants.map(challenge => challenge.solution.html)).size, 3, `${template.id} needs varied visible content`);
    assert.equal(new Set(variants.map(challenge => challenge.solution.css)).size, 3, `${template.id} needs varied themes`);
    for (const [index, challenge] of variants.entries()) {
      assert.equal(challenge.id, template.id);
      assert.equal(challenge.level, template.level);
      assert.equal(challenge.variant, index);
      assert.ok(challenge.title && challenge.prompt && challenge.description);
      assert.ok(challenge.requirements.length >= 3);
      assert.ok(challenge.requirements.every(requirement => typeof requirement === "string" && requirement.length > 0));
      assert.match(challenge.solution.html, /<main id="challenge">/);
      assert.doesNotMatch(challenge.solution.html, /<script\b/i);
      for (const [language, code] of Object.entries(challenge.solution)) {
        assert.equal(typeof code, "string");
        assert.ok(code.length <= 12000, `${challenge.id} ${language} exceeds the editor limit`);
      }
      assert.equal(Boolean(challenge.solution.js), challenge.level >= 3);
      assert.equal(challenge.checks.some(check => check.type === "behavior"), challenge.level >= 3);
      challenge.checks.forEach(check => checkSchema(check));
      const visualWeight = challenge.checks.filter(check => check.type === "style").reduce((sum, check) => sum + check.weight, 0);
      const allWeight = challenge.checks.reduce((sum, check) => sum + check.weight, 0);
      assert.ok(visualWeight / allWeight > 0.4 && visualWeight / allWeight < 0.45, `${challenge.id}: appearance needs a meaningful share of the score`);
      assert.ok(challenge.requirements.join(" ").includes("Brief #"));
      for (const check of challenge.checks) {
        const selectors = check.type === "behavior" ? [...check.actions.map(action => action.selector), ...(Array.isArray(check.expect) ? check.expect : [check.expect]).map(expected => expected.selector)] : [check.selector];
        for (const selector of selectors) assert.ok(challenge.requirements.join(" ").includes(selector), `${challenge.id} needs to explain ${selector}`);
      }
    }
    assert.deepEqual(getDesignChallenge(template.id, 1), variants[1], "Variants must be deterministic to restore saved work.");
  }
});

test("Reference briefs have enough visible variants to avoid repeating a recent session", () => {
  for (const challenge of designChallenges) {
    const runs = Array.from({ length: 24 }, (_, variant) => getDesignChallenge(challenge.id, variant));
    assert.equal(new Set(runs.map(run => run.fingerprint)).size, 24, challenge.id);
    assert.equal(new Set(runs.map(run => run.solution.html)).size, 24, challenge.id);
  }
});

test("The table brief supplies every heading and cell value without displaying solution source", () => {
  const table = getDesignChallenge("l1-table", 2);
  const requirements = table.requirements.join(" ");
  for (const label of ["Session", "Mentor", "Time", "Availability", "09:00", "11:00", "14:00", "Drop in"]) assert.ok(requirements.includes(label));
  assert.equal(table.checks.filter(check => check.type === "text" && /tbody/.test(check.selector)).length, 12);
  assert.doesNotMatch(requirements, /<table|<thead|<tbody|<style|<script/i);
  assert.equal(table.solution.js, "");
});

test("Challenge lookup handles unknown IDs and normalizes malformed variants", () => {
  assert.equal(getDesignChallenge("not-a-challenge"), undefined);
  assert.deepEqual(getDesignChallenge("l1-table", -3), getDesignChallenge("l1-table", 0));
  assert.deepEqual(getDesignChallenge("l1-table", Infinity), getDesignChallenge("l1-table", 0));
  assert.deepEqual(getDesignChallenge("l1-table", "2.9"), getDesignChallenge("l1-table", 2));
});

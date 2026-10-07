import test from "node:test";
import assert from "node:assert/strict";
import { toggleCodeComments, stripCodeComments } from "../lib/code-comments.mjs";
import { checkGuidedExpression } from "../lib/practice.mjs";

test("line comments preserve indentation, blank lines, and unselected code", () => {
  const value = "before\n  one();\n\n  two();\nafter", start = value.indexOf("  one"), end = value.indexOf("after");
  const added = toggleCodeComments(value, start, end, "javascript");
  assert.equal(added.value, "before\n  // one();\n\n  // two();\nafter");
  assert.equal(toggleCodeComments(added.value, added.selectionStart, added.selectionEnd, "javascript").value, value);
  assert.equal(toggleCodeComments("  x = 1\r\n  y = 2", 0, 8, "python").value, "  # x = 1\r\n  y = 2");
});

test("HTML and CSS comments hide complete selected lines and can be removed", () => {
  for (const [language, value, expected] of [["html", "  <p>Hello</p>", "  <!-- <p>Hello</p> -->"], ["css", "  color: red;", "  /* color: red; */"]]) {
    const added = toggleCodeComments(value, 3, 3, language);
    assert.equal(added.value, expected);
    assert.equal(toggleCodeComments(added.value, added.selectionStart, added.selectionEnd, language).value, value);
  }
  assert.throws(() => toggleCodeComments("p { /* note */ color: red; }", 0, 27, "css"), /embedded comment/);
});

test("commented expressions keep literal punctuation and Python floor division", () => {
  assert.equal(stripCodeComments('"https://example.test/#name" // note'), '"https://example.test/#name" \n');
  assert.equal(stripCodeComments("'a#b' # note\n9 // 2", "python"), "'a#b' \n9 // 2");
  assert.equal(checkGuidedExpression({ answers: ["x + 1"] }, "// My note\nx + 1").correct, true);
  assert.equal(checkGuidedExpression({ answers: ["n // 2"] }, "# Divide\nn // 2", "python").correct, true);
  assert.equal(checkGuidedExpression({ answers: ["x + 1"] }, "// x + 1").correct, false);
});

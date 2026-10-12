import test from "node:test";
import assert from "node:assert/strict";
import { designChallenges, getDesignChallenge } from "../lib/web-design-challenges.mjs";
import { formatDesignCode } from "../lib/web-design-format.mjs";

test("HTML, CSS, and JavaScript answers are expanded into readable lines", () => {
  assert.equal(formatDesignCode("<main><h1>Title</h1><p>Intro</p></main>", "html"), [
    "<main>",
    "  <h1>",
    "    Title",
    "  </h1>",
    "  <p>",
    "    Intro",
    "  </p>",
    "</main>",
  ].join("\n"));
  assert.equal(formatDesignCode("main{color:red;padding:8px}@media(max-width:500px){main{padding:4px}}", "css"), [
    "main {",
    "  color:red;",
    "  padding:8px;",
    "}",
    "@media(max-width:500px) {",
    "  main {",
    "    padding:4px;",
    "  }",
    "}",
  ].join("\n"));
  assert.equal(formatDesignCode("button.addEventListener('click',()=>{count++;update()});", "js"), [
    "button.addEventListener('click',()=> {",
    "  count++;",
    "  update()",
    "});",
  ].join("\n"));
  assert.throws(() => formatDesignCode("source", "python"), TypeError);
});

test("every generated answer language gets a multiline reference view", () => {
  for (const challenge of designChallenges) {
    const solution = getDesignChallenge(challenge.id, 0).solution;
    for (const language of challenge.level >= 3 ? ["html", "css", "js"] : ["html", "css"]) {
      const formatted = formatDesignCode(solution[language], language);
      assert.ok(formatted.includes("\n"), `${challenge.id} ${language} should be multiline`);
      assert.ok(formatted.trim().length > 0, `${challenge.id} ${language} should not be empty`);
    }
  }
});

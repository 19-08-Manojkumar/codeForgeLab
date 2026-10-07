const snippets = {
  html: ["<h1>Hello, browser</h1>", "<main>...</main>", '<img alt="A sunrise">', "<button>Try it</button>", "<section>...</section>", "<label>Name</label>"],
  css: [".card { padding: 24px; }", "display: grid;", "color: coral;", "gap: 16px;", "@media (max-width: 600px)", "border-radius: 12px;"],
  javascript: ["const idea = 'hello';", "input.filter(n => n > 5)", "return result;", "items.map(n => n * 2)", "let progress = 0;", "learn(); practice();"],
  python: ["def learn():", "for item in values:", "return result", "sorted(values)", "print('hello')", "[n * 2 for n in values]"],
  java: ["class Hello { }", "return result;", "List.of(1, 2, 3)", "Arrays.sort(values);", "String idea = \"hello\";", "System.out.println(result);"],
  c: ["#include <stdio.h>", "int main(void)", "return 0;", "for (int i = 0; i < n; i++)", "printf(\"hello\");", "int values[] = {1, 2, 3};"],
};
const symbols = ["{ }", "</>", "[ ]", "=>", "( )", ";", "++", "01", "&&", "*", "return", "fn"];
// Deterministic offsets keep the initial render stable and spread the passes out.
const flights = [
  [-8, 8, 13, -2.5], [21, -16, 17, -9], [-12, 46, 15, -5], [50, -12, 19, -14],
  [-9, 69, 14, -1], [9, 21, 18, -7], [39, -21, 16, -11], [-18, 85, 20, -4],
  [2, 37, 17, -13], [70, -19, 22, -6], [-22, 58, 19, -10], [18, 5, 21, -17],
];
const pathSymbols = { methods: ["f(x)", "return", "[ ]", "=>"], basics: ["if", "for", "=", "{ }"], interviews: ["O(n)", "?", "stack", "{ }"], problems: ["solve()", "++", "[ ]", "✓"] };

export default function CodeAtmosphere({ language, session, path }) {
  const lines = snippets[language] || [snippets.javascript[1], snippets.python[0], snippets.java[2], snippets.c[0], snippets.python[5], snippets.java[3]];
  const glyphs = pathSymbols[path] || symbols;
  return <div className="code-atmosphere" aria-hidden="true" inert>
    <div className="sky-haze haze-one"/><div className="sky-haze haze-two"/>
    <div className="sky-star-field">{Array.from({ length: 24 }, (_, index) => <i key={index} className={`sky-star syntax-${index % 4}`} style={{ left: `${index * 37 % 100}%`, top: `${index * 29 % 100}%`, "--flight-time": `${38 + index % 7 * 5}s`, "--flight-delay": `${-index * 3.7}s`, "--star-size": `${index % 3 === 0 ? 3 : 2}px` }}/>)}</div>
    <div className="meteor-field" key={`${language || "all"}-${session}-${path || "hub"}`}>{flights.map(([left, top, duration, delay], index) => {
      return <span className={`shooting-star syntax-${index % 4}`} key={index} style={{ left: `${left}%`, top: `${top}%`, "--flight-time": `${duration}s`, "--flight-delay": `${delay}s`, "--tail-length": `${90 + index % 4 * 35}px` }}><span className="star-tail"/><span className="star-head"/><code className="ambient-symbol">{glyphs[index % glyphs.length]}</code></span>;
    })}</div>
    <div className="code-snippet-field" key={`code-${session}`}>{lines.map((line, index) => <code className={`ambient-snippet syntax-${index % 4}`} key={index} style={{ top: `${12 + index * 15}%`, "--flight-time": `${32 + index * 4}s`, "--flight-delay": `${-6 - index * 7}s` }}>{line}</code>)}</div>
    <div className="code-reading-wash"/>
  </div>;
}

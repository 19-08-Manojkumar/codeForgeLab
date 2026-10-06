const snippets = {
  javascript: ["const idea = 'hello';", "input.filter(n => n > 5)", "return result;", "items.map(n => n * 2)", "let progress = 0;", "learn(); practice();"],
  python: ["def learn():", "for item in values:", "return result", "sorted(values)", "print('hello')", "[n * 2 for n in values]"],
  java: ["class Hello { }", "return result;", "List.of(1, 2, 3)", "Arrays.sort(values);", "String idea = \"hello\";", "System.out.println(result);"],
  c: ["#include <stdio.h>", "int main(void)", "return 0;", "for (int i = 0; i < n; i++)", "printf(\"hello\");", "int values[] = {1, 2, 3};"],
};
const symbols = ["{ }", "</>", "[ ]", "=>", "( )", ";", "++", "01", "{ }", "[1, 2]", "&&", "*", "( )", "</>"];
const placements = [
  [3, 16, 24, 36, -4, 1], [88, 12, 34, 42, -11, -1], [7, 39, 27, 39, -21, -1], [94, 35, 25, 33, -7, 1],
  [16, 72, 38, 47, -18, 1], [79, 77, 35, 40, -27, -1], [2, 86, 25, 38, -12, 1], [91, 62, 29, 46, -31, -1],
  [43, 88, 42, 43, -5, -1], [28, 64, 23, 45, -26, 1], [69, 21, 24, 41, -19, -1], [58, 79, 35, 39, -9, 1],
  [27, 14, 22, 37, -23, 1], [67, 48, 25, 44, -34, -1],
];

export default function CodeAtmosphere({ language }) {
  const lines = language ? snippets[language] : [snippets.javascript[1], snippets.python[0], snippets.java[2], snippets.c[0], snippets.python[5], snippets.java[3]];
  return <div className="code-atmosphere" aria-hidden="true" inert>
    <div className="code-glow glow-blue"/><div className="code-glow glow-teal"/><div className="code-glow glow-violet"/>
    <div className="code-grid"/>
    <div className="code-orbit orbit-one"/><div className="code-orbit orbit-two"/>
    <div className="code-scan"/>
    <div className="code-symbol-field">{symbols.map((symbol, index) => {
      const [left, top, size, duration, delay, direction] = placements[index];
      return <span className={`ambient-symbol syntax-${index % 4}`} key={index} style={{ left: `${left}%`, top: `${top}%`, "--symbol-size": `${size}px`, "--drift-time": `${duration}s`, "--drift-delay": `${delay}s`, "--drift-x": `${direction * 32}px`, "--drift-y": `${direction * -42}px`, "--drift-turn": `${direction * 8}deg` }}>{symbol}</span>;
    })}</div>
    <div className="code-snippet-field">{lines.map((line, index) => <code className={`ambient-snippet snippet-${index + 1} syntax-${index % 4}`} key={index} style={{ "--drift-time": `${44 + index * 3}s`, "--drift-delay": `${-index * 7}s`, "--drift-x": `${index % 2 ? -28 : 24}px`, "--drift-y": `${index % 2 ? 32 : -30}px`, "--drift-turn": `${index % 2 ? -3 : 3}deg` }}>{line}</code>)}</div>
    <div className="code-reading-wash"/>
  </div>;
}

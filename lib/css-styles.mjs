// A hands-on catalogue of common standard CSS properties. Browser-specific,
// experimental, SVG-only, and paged-media properties are outside this catalogue.
// Each entry supplies the context the property actually needs, not just a box
// with an unrelated declaration. Presets replace only the selected declaration.
const base = `* { box-sizing: border-box; }
body { margin: 0; padding: 24px; font: 16px/1.6 system-ui, sans-serif; color: #26344f; background: #f3f6fb; }
.stage { max-width: 520px; padding: 24px; border: 1px dashed #9baac1; background: white; }
.demo { padding: 16px; color: #244497; background: #dce8ff; border: 2px solid #6080cb; }
.note { margin: 16px 0 0; font-size: 14px; color: #65718b; }
button, input, textarea, select { font: inherit; }
`;
const box = {
  html: `<div class="stage"><div class="demo">Change my style</div><p class="note">The dashed line is the parent. The blue box is .demo.</p></div>`,
  css: `.demo { width: 220px; min-height: 96px; }`
};
const text = {
  html: `<div class="stage"><p class="demo">Learning CSS makes a page your own. Compare the letters, words, and lines as you choose a new value.</p></div>`,
  css: `.demo { margin: 0; font-size: 22px; }`
};
const spacing = {
  html: `<div class="stage"><div class="demo">The blue background shows padding inside the border.</div><div class="neighbor">Next box</div><div class="following">Watch the space beside and below the blue box.</div></div>`,
  css: `.stage { display: flex; flex-wrap: wrap; align-items: flex-start; background: repeating-linear-gradient(45deg, #fff, #fff 9px, #eef2f8 9px, #eef2f8 10px); }
.demo { flex: 0 0 auto; width: 60%; max-width: 230px; margin: 0; padding: 8px; }
.neighbor { flex: 0 0 72px; padding: 8px; background: #e6f6e9; border: 1px solid #82b993; }
.following { flex-basis: 100%; padding: 8px; background: #fff0d7; border: 1px solid #c59139; }`
};
const flex = {
  html: `<div class="stage"><div class="demo"><div class="item">One</div><div class="item selected">Two</div><div class="item">Three</div><div class="item">Four</div></div></div>`,
  css: `.demo { display: flex; min-height: 180px; gap: 10px; padding: 14px; }
.item { padding: 12px; background: white; border: 1px solid #6080cb; min-width: 64px; }
.selected { background: #ffe2a8; border-color: #c59139; }`
};
const grid = {
  html: `<div class="stage"><div class="demo"><div class="item selected">One</div><div class="item">Two</div><div class="item">Three</div><div class="item">Four</div><div class="item">Five</div><div class="item">Six</div></div></div>`,
  css: `.demo { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 70px); gap: 10px; min-height: 210px; }
.item { padding: 8px; border: 1px solid #6080cb; background: white; }
.selected { background: #ffe2a8; border-color: #c59139; }`
};
const position = {
  html: `<div class="stage"><div class="demo">Move this box</div><div class="neighbor">This box stays in normal flow.</div></div>`,
  css: `.stage { position: relative; height: 280px; }
.demo { position: absolute; width: 150px; height: 90px; top: 24px; left: 24px; }
.neighbor { margin-top: 160px; padding: 8px; background: #e6f6e9; }`
};
const imageUrl = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="#bce4fa"/><circle cx="255" cy="38" r="23" fill="#ffb943"/><path d="M0 180L100 45L215 180Z" fill="#608db1"/><path d="M100 180L230 80L320 180Z" fill="#355c82"/><text x="16" y="30" fill="#244497" font-size="18">CSS landscape</text></svg>`)}`;
const image = {
  html: `<div class="stage"><img class="demo" src="${imageUrl}" alt="Two blue mountains and a golden sun"><p class="note">The image is naturally 320 by 180 pixels, inside a square frame.</p></div>`,
  css: `.demo { display: block; width: 230px; height: 230px; padding: 0; object-fit: cover; }`
};
const background = {
  html: `<div class="stage"><div class="demo">A background behind the content</div></div>`,
  css: `.demo { width: 260px; height: 210px; padding: 24px; border: 12px dashed #6080cb;
  background-color: #eaf1ff; background-image: radial-gradient(circle, #f1ab41 0 10px, transparent 11px);
  background-size: 44px 44px; background-repeat: no-repeat; }`
};
const table = {
  html: `<div class="stage"><table class="demo"><caption>Weekly practice</caption><thead><tr><th>Topic</th><th>Minutes</th></tr></thead><tbody><tr><td>HTML headings</td><td>20</td></tr><tr><td></td><td>30</td></tr></tbody></table></div>`,
  css: `.demo { width: 100%; border-collapse: separate; border-spacing: 8px; background: white; }
th, td { border: 2px solid #6080cb; padding: 12px; background: #dce8ff; }
caption { padding: 12px; font-weight: 600; }`
};
const list = {
  html: `<div class="stage"><ul class="demo"><li>Choose an HTML tag</li><li>Edit a CSS property and watch the rendered page change</li><li>Try another value</li></ul></div>`,
  css: `.demo { padding: 18px 18px 18px 42px; margin: 0; max-width: 300px; } li { margin-bottom: 12px; }`
};
const column = {
  html: `<div class="stage"><div class="demo"><h2>Learning by doing</h2><p>One small change helps you see what a CSS declaration does. The browser lays this text into columns when enough space is available.</p><p>Try changing the number, width, or separator between the columns. Notice that the content continues from the end of one column to the start of the next.</p><p>Use columns for flowing prose. Use grid when separate cards need rows and columns.</p></div></div>`,
  css: `.demo { column-count: 2; column-gap: 24px; column-rule: 2px solid #6080cb; font-size: 15px; } h2 { margin-top: 0; font-size: 22px; } p { margin-top: 0; }`
};
const overflow = {
  html: `<div class="stage"><div class="demo"><div class="wide">This content is wider than its frame.</div><p>First paragraph inside the short frame.</p><p>Second paragraph inside the short frame.</p><p>Third paragraph. Scroll to reach me.</p><p>Last paragraph inside the frame.</p></div><p class="note">The frame has a fixed width and height. Try scrolling inside it.</p></div>`,
  css: `.stage { padding-bottom: 100px; }
.demo { width: 240px; height: 150px; overflow: auto; }
.wide { width: 360px; background: #ffe2a8; padding: 8px; }`
};
const form = {
  html: `<div class="stage"><label for="sample">Try typing here</label><input class="demo" id="sample" value="Learning CSS"><p class="note">Switch off Inspect elements to interact with the controls.</p></div>`,
  css: `.demo { display: block; width: 100%; margin-top: 12px; }`
};
const motion = {
  html: `<div class="stage"><div class="track"><div class="demo">Moving box</div></div><p class="note">Watch the box move. Motion stops when your device prefers reduced motion.</p></div>`,
  css: `.track { min-height: 160px; border: 1px dashed #9baac1; padding: 14px; }
.demo { width: 110px; animation: travel 2.4s ease-in-out infinite alternate; }
@keyframes travel { from { transform: translateX(0); background: #dce8ff; } to { transform: translateX(130px); background: #ffe2a8; } }
@keyframes turn { from { transform: rotate(0deg); } to { transform: rotate(20deg); } }
@media (prefers-reduced-motion: reduce) { .demo { animation: none !important; } }`
};
const transition = {
  html: `<div class="stage"><button class="demo">Hover or focus me</button><p class="note">Switch off Inspect elements, then hover the button or press Tab to focus it. Compare how the change happens.</p></div>`,
  css: `.demo { cursor: pointer; transition: transform 700ms ease, background-color 700ms ease; }
.demo:hover, .demo:focus-visible { transform: translateX(70px); background-color: #ffe2a8; }
@media (prefers-reduced-motion: reduce) { .demo { transition: none !important; } }`
};
const groupDefinitions = [
  ["colors-backgrounds", "Colors & backgrounds", "Color, transparency, fills, images, and background layers."],
  ["fonts-text", "Fonts & text", "Typefaces, letters, lines, alignment, decoration, and writing direction."],
  ["sizing", "Width & height", "Physical and logical dimensions, constraints, and the box model."],
  ["spacing", "Spacing", "Space inside and outside an element, plus gaps between children."],
  ["borders-outline", "Borders & outlines", "Edges, corner shapes, and outlines around the box."],
  ["layout-position", "Display & positioning", "Normal flow, positioned boxes, floats, and stacking."],
  ["flex", "Flexbox", "Arrange children along an axis and control how they share space."],
  ["grid", "Grid", "Arrange rows and columns, then place and align their items."],
  ["overflow-media", "Overflow, scrolling & images", "Clipping, scroll containers, scroll snapping, and image fitting."],
  ["effects", "Transforms & visual effects", "Move, turn, scale, shade, clip, and blend elements."],
  ["interactions", "Controls & interaction", "Pointers, selection, text cursors, and native controls."],
  ["motion", "Transitions & animation", "Interpolate changes and play named keyframes with reduced motion support."],
  ["lists-tables-columns", "Lists, tables & columns", "Markers, generated content, table layout, and flowing text columns."]
];
const entries = [];
function add(groupId, property, summary, values, context = box, options = {}) {
  const selector = options.selector || ".demo";
  const value = values[0];
  const css = `${base}${context.css || ""}\n${options.css || ""}\n${selector} { ${property}: ${value}; }`;
  entries.push({
    id: property, property, title: property, groupId, summary, selector, value,
    concepts: [summary, options.contextNote || "The highlighted declaration applies to the element selected by the CSS selector. The other rules give this example its context.", "Choose a preset, edit the value, or change the full code. The browser shows valid CSS immediately; an invalid declaration is ignored."],
    html: options.html || context.html, css,
    explain: [
      { token: selector, title: "The selected element", description: options.contextNote || `This selector targets the part of the example that receives ${property}.`, selector },
      { token: `${property}: ${value};`, title: `How ${property} works`, description: summary, selector, property }
    ],
    variants: values.map(preset => ({ label: preset, value: preset })),
    source: property === "--accent" ? "https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties" : `https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/${property}`,
    tryIt: options.tryIt || `Compare ${values.join(", ")}. Then type your own valid value for ${property}.`,
    ...(options.previewNote ? { previewNote: options.previewNote } : {})
  });
}

// Colors and layered backgrounds.
add("colors-backgrounds", "color", "Sets the foreground color of text and any borders or decorations that use currentColor.", ["#244497", "#b43e66", "#177447"], text);
add("colors-backgrounds", "background-color", "Paints a solid color behind the element's content and padding.", ["#dce8ff", "#ffe2a8", "#dbf3e3"]);
add("colors-backgrounds", "background", "A shorthand that sets background color, images, position, size, and repeat together.", ["#dce8ff", "linear-gradient(135deg, #dce8ff, #ffe2a8)", "radial-gradient(circle, #ffe2a8, #dce8ff)"]);
add("colors-backgrounds", "background-image", "Adds an image or gradient layer behind the content, on top of the background color.", ["linear-gradient(135deg, #dce8ff, #ffe2a8)", "radial-gradient(circle, #f1ab41, #dce8ff)", "none"], background, { css: ".demo { background-size: auto; }" });
add("colors-backgrounds", "background-position", "Positions the background image within its positioning area.", ["left top", "center", "right bottom"], background);
add("colors-backgrounds", "background-size", "Controls the dimensions of each background image; cover fills and contain fits the image.", ["44px 44px", "100% 100%", "80px 80px"], background);
add("colors-backgrounds", "background-repeat", "Controls whether a background image tiles across the element.", ["no-repeat", "repeat", "repeat-x"], background);
add("colors-backgrounds", "background-origin", "Chooses the box used as the origin when positioning a background image.", ["padding-box", "border-box", "content-box"], background);
add("colors-backgrounds", "background-clip", "Chooses how far the background paint extends: under the border, padding, or content only.", ["border-box", "padding-box", "content-box"], background, { css: ".demo { background-image: none; background-color: #ffe2a8; }" });
add("colors-backgrounds", "background-attachment", "Determines whether the background scrolls with the page, with the element's content, or stays fixed to the viewport.", ["scroll", "local", "fixed"], overflow, { css: ".demo { background-image: repeating-linear-gradient(0deg, #dce8ff 0 20px, #ffe2a8 20px 40px); }", previewNote: "Scroll inside the frame to compare local with scroll. Fixed is relative to this preview's viewport." });
add("colors-backgrounds", "background-blend-mode", "Blends the background image layers with the element's background color.", ["normal", "multiply", "screen"], background, { css: ".demo { background-color: #9ed9a8; background-image: linear-gradient(45deg, #d47792, #ffe2a8); background-size: auto; }" });
add("colors-backgrounds", "opacity", "Changes the transparency of the whole element, including its text and children.", ["1", "0.6", "0.25"], box, { css: ".stage { background: repeating-conic-gradient(#eef2f8 0% 25%, white 0% 50%) 0 / 24px 24px; }" });
add("colors-backgrounds", "color-scheme", "Tells the browser which color schemes native controls can use. This does not automatically recolor your own custom CSS.", ["light", "dark", "light dark"], form, { html: `<div class="stage"><div class="demo"><label for="theme-input">Native browser controls</label><input id="theme-input" value="Learning CSS"><select aria-label="Choose a topic"><option>HTML tags</option><option>CSS properties</option></select></div></div>`, css: ".demo { color: #26344f; background: transparent; border: none; padding: 0; } .demo input, .demo select { display: block; padding: 10px; margin-top: 12px; width: 100%; }", contextNote: "The native controls inherit color-scheme from their parent. light dark follows the user's preferred scheme." });

// Type and text need actual words and, where necessary, constrained lines.
for (const [property, summary, values] of [
  ["font-family", "Chooses the font family; the browser uses the first available family in the list.", ["system-ui, sans-serif", "Georgia, serif", "monospace"]],
  ["font-size", "Sets the text size. rem relates to the root text size; pixels are an absolute CSS length.", ["22px", "34px", "1rem"]],
  ["font-weight", "Sets how heavy the letters are, using the weights available in the chosen font.", ["400", "700", "900"]],
  ["font-style", "Selects upright, italic, or slanted text.", ["normal", "italic", "oblique"]],
  ["font", "Sets font style, weight, size, line height, and family in one shorthand. Size and family are required.", ["22px/1.6 system-ui", "italic 700 26px/1.4 Georgia", "18px/2 monospace"]],
  ["font-variant", "Selects alternate forms such as small capitals when supported by the font.", ["normal", "small-caps", "small-caps lining-nums"]],
  ["font-variant-caps", "Controls capital-letter variants, including small capitals.", ["normal", "small-caps", "all-small-caps"]],
  ["line-height", "Sets the height of each line box. A unitless number multiplies the element's font size.", ["1.6", "1", "2.2"]],
  ["letter-spacing", "Adds or removes spacing between individual letters.", ["normal", "3px", "-1px"]],
  ["word-spacing", "Adds or removes spacing between words without changing the letters.", ["normal", "12px", "-3px"]],
  ["text-align", "Aligns inline content within each line of its block.", ["left", "center", "right", "justify"]],
  ["text-align-last", "Aligns the last line of a paragraph independently from the other lines.", ["auto", "center", "right"]],
  ["text-transform", "Changes how letter case is displayed while leaving the HTML text unchanged.", ["none", "uppercase", "capitalize"]],
  ["text-indent", "Indents the first line of a block of text.", ["0", "32px", "15%"]],
  ["text-shadow", "Paints one or more shadows behind the letters.", ["none", "2px 2px 0 #f1ab41", "0 0 8px #b43e66"]],
  ["text-decoration", "A shorthand for decoration lines, color, style, and thickness.", ["none", "underline #b43e66 3px", "line-through wavy #b43e66 2px"]],
  ["text-decoration-line", "Adds underline, overline, or a line through the text.", ["underline", "overline", "line-through"]],
  ["text-decoration-color", "Sets the color of an existing text decoration without recoloring the text itself.", ["#244497", "#b43e66", "#177447"]],
  ["text-decoration-style", "Sets the shape of an existing decoration line.", ["solid", "dotted", "wavy"]],
  ["text-decoration-thickness", "Sets how thick an existing decoration line is.", ["auto", "3px", "6px"]],
  ["text-underline-offset", "Moves the underline farther from or closer to the text.", ["auto", "6px", "12px"]],
  ["text-decoration-skip-ink", "Controls whether an underline skips the parts of letters that descend below the text baseline.", ["auto", "none", "all"]],
  ["white-space", "Controls how spaces and line breaks are preserved, and whether text wraps.", ["normal", "pre-wrap", "nowrap"]],
  ["text-wrap", "Controls text wrapping, including balancing line lengths where supported.", ["wrap", "balance", "nowrap"]]
]) add("fonts-text", property, summary, values, text, {
  ...(property.startsWith("text-decoration-") || property === "text-underline-offset" ? { css: ".demo { text-decoration: underline; }" } : {}),
  ...(property === "white-space" ? { html: `<div class="stage"><p class="demo">Spaces     between words.\nA new line in the HTML.\nThis longer sentence can wrap inside its box.</p></div>` } : {}),
  ...(property === "text-decoration-skip-ink" ? { html: `<div class="stage"><p class="demo">Typography: jumping gypsy glyphs</p></div>` } : {})
});
add("fonts-text", "font-variant-numeric", "Uses alternate number forms when the font provides them, such as equal-width digits or fractions.", ["normal", "tabular-nums", "diagonal-fractions"], text, { html: `<div class="stage"><p class="demo">1111.00<br>8888.00<br>1/2 &nbsp; 3/4</p></div>`, previewNote: "Number variants depend on the installed font; equal-width digits may already be the default." });
add("fonts-text", "font-kerning", "Controls font-provided adjustments between specific pairs of letters.", ["auto", "normal", "none"], text, { html: `<div class="stage"><p class="demo">AVATAR WA To</p></div>`, css: ".demo { font-family: Georgia, serif; font-size: 44px; }", previewNote: "Kerning differences depend on the font and can be subtle. Compare pairs such as AV and To." });
for (const [property, summary, values] of [
  ["overflow-wrap", "Allows long words to break so they can fit within the available line width.", ["normal", "anywhere", "break-word"]],
  ["word-break", "Controls the rules for breaking text between characters and words.", ["normal", "break-all", "keep-all"]],
  ["hyphens", "Controls hyphenation. Manual uses explicit soft hyphens; automatic hyphenation depends on the language and browser dictionary.", ["none", "manual", "auto"]]
]) add("fonts-text", property, summary, values, text, { html: property === "word-break" ? `<div class="stage"><p class="demo">Englishwordwithoutspaces 日本語の文章で改行を比べます。</p></div>` : `<div class="stage"><p class="demo" lang="en">An extra&shy;ordi&shy;narily longwordwithoutanyspaces lets you compare text breaking.</p></div>`, css: ".demo { width: 220px; }", ...(property === "hyphens" ? { previewNote: "The example includes soft hyphens and lang=en. Automatic dictionaries vary between browsers." } : {}) });
add("fonts-text", "text-overflow", "Shows how clipped inline text is indicated. Ellipsis needs a constrained box with overflow and no wrapping.", ["clip", "ellipsis"], text, { html: `<div class="stage"><p class="demo">This long headline does not fit inside one short line.</p></div>`, css: ".demo { width: 230px; white-space: nowrap; overflow: hidden; }" });
add("fonts-text", "direction", "Sets the base direction of text and the start side used by layout. Use the HTML dir attribute for content direction in real documents.", ["ltr", "rtl"], text, { html: `<div class="stage"><p class="demo">Hello 123 — مرحبا</p></div>`, css: ".demo { text-align: start; }" });
add("fonts-text", "writing-mode", "Chooses horizontal or vertical line layout and the direction in which successive lines flow.", ["horizontal-tb", "vertical-rl", "vertical-lr"], text, { css: ".demo { max-height: 300px; }" });
add("fonts-text", "text-orientation", "Controls the orientation of characters inside vertical text. It has no visible effect in horizontal writing.", ["mixed", "upright", "sideways"], text, { html: `<div class="stage"><p class="demo">Learn CSS 日本語</p></div>`, css: ".demo { writing-mode: vertical-rl; height: 260px; }" });
add("fonts-text", "vertical-align", "Aligns an inline element relative to its line box or aligns table-cell content. It does not vertically center ordinary block elements.", ["baseline", "middle", "super"], text, { html: `<div class="stage"><p>Inline text <span class="demo">a small inline badge</span> and more words.</p></div>`, css: ".demo { display: inline-block; font-size: 12px; padding: 6px; }" });

// Sizing examples have natural space around them so constraints can be seen.
for (const [property, summary, values, extra] of [
  ["width", "Sets the physical width of the element's box.", ["220px", "100%", "50%"], ""],
  ["height", "Sets the physical height of the element's box.", ["96px", "180px", "auto"], ""],
  ["min-width", "Prevents the element from becoming narrower than this minimum, even when width is smaller.", ["100px", "260px", "100%"], ".demo { width: 100px; }"],
  ["max-width", "Limits how wide the element may grow, even when width asks for more space.", ["220px", "100%", "140px"], ".demo { width: 100%; }"],
  ["min-height", "Keeps the box at least this tall; content can make it taller.", ["96px", "180px", "0"], ".demo { height: auto; }"],
  ["max-height", "Limits the height of the box. Overflow determines what happens to content that does not fit.", ["100px", "180px", "none"], ".demo { height: 200px; overflow: auto; }"],
  ["inline-size", "Sets the size along the writing direction: width in horizontal writing and height in vertical writing.", ["220px", "100%", "50%"], ""],
  ["block-size", "Sets the size perpendicular to the writing direction: height in horizontal writing and width in vertical writing.", ["96px", "180px", "auto"], ""],
  ["min-inline-size", "Sets a minimum size along the writing direction.", ["100px", "260px", "100%"], ".demo { width: 100px; }"],
  ["max-inline-size", "Sets a maximum size along the writing direction.", ["220px", "140px", "none"], ".demo { width: 100%; }"],
  ["min-block-size", "Sets a minimum size perpendicular to the writing direction.", ["96px", "180px", "0"], ".demo { height: auto; }"],
  ["max-block-size", "Sets a maximum size perpendicular to the writing direction.", ["100px", "180px", "none"], ".demo { height: 200px; overflow: auto; }"],
  ["aspect-ratio", "Provides a preferred width-to-height ratio. At least one dimension must be automatic for the ratio to size this box.", ["1 / 1", "16 / 9", "4 / 3"], ".demo { width: 230px; height: auto; min-height: 0; }"],
  ["box-sizing", "Chooses whether width and height include the padding and border, or describe only the content.", ["border-box", "content-box"], ".demo { width: 220px; padding: 24px; border-width: 10px; }"]
]) add("sizing", property, summary, values, box, { css: extra });

// Physical sides and their logical writing-mode counterparts.
for (const kind of ["margin", "padding"]) {
  add("spacing", kind, kind === "margin" ? "A shorthand for the space outside the border. One to four values set all sides in clockwise order." : "A shorthand for the space between content and border. One to four values set all sides in clockwise order.", ["8px", "24px", "8px 32px"], spacing);
  for (const side of ["top", "right", "bottom", "left"]) add("spacing", `${kind}-${side}`, `Sets ${kind === "margin" ? "outer" : "inner"} spacing on the physical ${side} side of the box.`, ["8px", "32px", "0"], spacing);
  for (const axis of ["block", "inline"]) {
    add("spacing", `${kind}-${axis}`, `Sets ${kind === "margin" ? "outer" : "inner"} spacing on both ${axis} sides. In horizontal writing these are ${axis === "block" ? "top and bottom" : "left and right"}.`, ["8px", "24px", "8px 32px"], spacing);
    for (const end of ["start", "end"]) add("spacing", `${kind}-${axis}-${end}`, `Sets ${kind === "margin" ? "outer" : "inner"} spacing at the ${end} of the ${axis} direction. The physical side follows the writing mode and direction.`, ["8px", "32px", "0"], spacing);
  }
}
for (const [property, summary, values] of [
  ["gap", "Sets gutters between rows and columns of grid or flex children. It does not add space around the outside of the container.", ["10px", "24px", "8px 32px"]],
  ["row-gap", "Sets spacing between rows of this grid.", ["10px", "32px", "0"]],
  ["column-gap", "Sets spacing between columns of this grid, or between columns of flowing text.", ["10px", "32px", "0"]]
]) add("spacing", property, summary, values, grid);

// Borders need a visible border style for width and color to have an effect.
add("borders-outline", "border", "Sets all four border widths, styles, and colors in one shorthand.", ["2px solid #6080cb", "6px dashed #b43e66", "10px double #177447"]);
for (const [suffix, summary, values] of [
  ["width", "Sets the thickness of the existing border.", ["2px", "8px", "16px"]],
  ["style", "Sets the border's line style. none removes the border and its width.", ["solid", "dashed", "double", "none"]],
  ["color", "Sets the color of the existing border.", ["#6080cb", "#b43e66", "#177447"]]
]) {
  add("borders-outline", `border-${suffix}`, summary, values);
  for (const side of ["top", "right", "bottom", "left"]) add("borders-outline", `border-${side}-${suffix}`, `${summary} Only the physical ${side} edge changes.`, values);
}
for (const side of ["top", "right", "bottom", "left"]) add("borders-outline", `border-${side}`, `Sets the width, style, and color of the physical ${side} border together.`, ["2px solid #6080cb", "8px dashed #b43e66", "12px double #177447"]);
for (const axis of ["block", "inline"]) {
  add("borders-outline", `border-${axis}`, `Sets the border on both ${axis} sides, following the writing direction.`, ["2px solid #6080cb", "8px dashed #b43e66", "12px double #177447"]);
  for (const end of ["start", "end"]) add("borders-outline", `border-${axis}-${end}`, `Sets the border at the ${end} of the ${axis} axis, following the writing mode and text direction.`, ["2px solid #6080cb", "8px dashed #b43e66", "12px double #177447"]);
}
add("borders-outline", "border-radius", "Rounds the border corners. Percentages relate to the box size; a very large value can create a pill.", ["0", "24px", "50%"]);
for (const corner of ["top-left", "top-right", "bottom-left", "bottom-right"]) add("borders-outline", `border-${corner}-radius`, `Rounds only the physical ${corner.replace("-", " ")} corner.`, ["0", "32px", "50%"]);
for (const corner of ["start-start", "start-end", "end-start", "end-end"]) add("borders-outline", `border-${corner}-radius`, `Rounds the logical ${corner} corner. The first word describes the block axis; the second describes the inline axis.`, ["0", "32px", "50%"]);
for (const [property, summary, values] of [
  ["outline", "Paints an outline outside the border without taking up layout space. Keep clear focus outlines on interactive elements.", ["2px solid #b43e66", "6px dashed #177447", "none"]],
  ["outline-width", "Sets the thickness of the outline without changing the size of the box.", ["2px", "6px", "12px"]],
  ["outline-style", "Sets the line pattern of the outline.", ["solid", "dashed", "dotted"]],
  ["outline-color", "Sets the color of the outline independently of the border.", ["#b43e66", "#177447", "#244497"]],
  ["outline-offset", "Creates space between the border and the outline. Negative values move the outline inward.", ["0", "8px", "-6px"]]
]) add("borders-outline", property, summary, values, box, { css: ".demo { outline: 3px solid #b43e66; }" });

// Normal flow, positioning, and stacking.
add("layout-position", "display", "Chooses the layout behavior of the box. none removes it from layout; block and inline handle surrounding content differently.", ["block", "inline", "inline-block", "none"], text, { html: `<div class="stage">Words before <span class="demo">the selected element</span> words after.<p>Another paragraph stays below.</p></div>`, css: ".demo { padding: 8px; font-size: inherit; }" });
add("layout-position", "position", "Chooses how the box participates in normal flow and how inset values position it.", ["static", "relative", "absolute", "fixed"], position, { previewNote: "Relative keeps the box's original place. Absolute uses the positioned parent. Fixed uses the preview viewport." });
for (const property of ["top", "right", "bottom", "left"]) add("layout-position", property, `Offsets a positioned box from the ${property} edge. A static element ignores this property.`, ["24px", "80px", "0"], position, { css: `.demo { top: auto; right: auto; bottom: auto; left: auto; ${property === "top" || property === "bottom" ? "left: 24px;" : "top: 24px;"} }` });
add("layout-position", "inset", "Sets top, right, bottom, and left offsets in one shorthand. Here an auto-sized absolute box stretches between these edges.", ["24px", "48px 24px", "0"], position, { css: ".demo { width: auto; height: auto; }" });
for (const axis of ["block", "inline"]) {
  add("layout-position", `inset-${axis}`, `Sets both positioning offsets along the ${axis} direction. Here the box stretches between these logical edges.`, ["24px", "60px", "0"], position, { css: `.demo { ${axis === "block" ? "height: auto;" : "width: auto;"} }` });
  for (const end of ["start", "end"]) add("layout-position", `inset-${axis}-${end}`, `Positions the box relative to the ${end} edge of the ${axis} direction. The physical edge follows the writing mode and direction.`, ["24px", "80px", "0"], position, { css: `.demo { ${axis === "block" ? "top: auto; bottom: auto;" : "left: auto; right: auto;"} }` });
}
add("layout-position", "z-index", "Sets the stacking order of overlapping positioned boxes within their stacking context. A higher number can paint on top.", ["0", "2", "-1"], position, { html: `<div class="stage"><div class="demo">Selected blue box</div><div class="cover">Gold box at z-index 1</div></div>`, css: ".stage { isolation: isolate; } .cover { position: absolute; top: 70px; left: 80px; z-index: 1; width: 180px; padding: 20px; background: #ffe2a8; border: 2px solid #c59139; }" });
add("layout-position", "visibility", "Hides the element's paint while preserving its place in layout. display:none removes the place as well.", ["visible", "hidden"], spacing);
add("layout-position", "float", "Moves a box to a side so surrounding inline content can flow around it.", ["none", "left", "right"], box, { html: `<div class="stage"><div class="demo">Floating box</div><p>This paragraph is long enough to wrap around the box when it floats. Notice how these words use the remaining line width beside it before continuing below it.</p><p>Floats are useful for text wrapped around an illustration.</p></div>`, css: ".stage { display: flow-root; } .demo { width: 130px; min-height: 100px; margin: 0 12px 8px; }" });
add("layout-position", "clear", "Moves the selected block below preceding floats on the chosen side.", ["none", "left", "both"], box, { html: `<div class="stage"><div class="floater">Left float</div><p class="demo">Change clear to move this paragraph below the float.</p></div>`, css: ".stage { display: flow-root; } .floater { float: left; width: 130px; height: 130px; background: #ffe2a8; padding: 16px; } .demo { width: auto; }" });
add("layout-position", "isolation", "Creates a new stacking context so child blending stays inside this element's group.", ["auto", "isolate"], box, { html: `<div class="stage"><div class="demo"><span class="blender">Blending child</span></div></div>`, css: ".stage { background: #ffe2a8; } .demo { background: transparent; } .blender { display: block; padding: 18px; color: white; background: #6080cb; mix-blend-mode: multiply; }", previewNote: "The child uses multiply. isolate stops it from blending with the gold background outside its parent." });

// Flexbox container properties and selected child properties.
for (const [property, summary, values, extra] of [
  ["flex-direction", "Chooses the main axis and ordering direction for flex items.", ["row", "column", "row-reverse"], ""],
  ["flex-wrap", "Chooses whether flex items stay on one line or wrap into multiple lines.", ["nowrap", "wrap", "wrap-reverse"], ".item { min-width: 110px; }"],
  ["flex-flow", "Sets flex-direction and flex-wrap together.", ["row nowrap", "row wrap", "column wrap"], ".demo { height: 230px; } .item { min-width: 110px; }"],
  ["justify-content", "Distributes leftover space along the flex container's main axis.", ["flex-start", "center", "space-between", "space-evenly"], ".item { min-width: 40px; padding: 8px; }"],
  ["align-items", "Aligns flex items on the cross axis. For a row, this is usually the vertical axis.", ["stretch", "center", "flex-end"], ""],
  ["align-content", "Distributes multiple flex lines along the cross axis. It needs wrapping, multiple lines, and extra cross-axis space.", ["stretch", "center", "space-between"], ".demo { flex-wrap: wrap; height: 300px; } .item { width: 140px; height: 60px; }"],
  ["align-self", "Overrides align-items for one selected flex child.", ["auto", "center", "flex-end"], ""]
]) add("flex", property, summary, values, flex, { css: extra, ...(property === "align-self" ? { selector: ".selected", contextNote: "Only the gold child is selected. The parent remains a flex container." } : {}) });
for (const [property, summary, values, extra] of [
  ["flex", "Sets a flex child's grow factor, shrink factor, and initial basis together.", ["0 1 auto", "1 1 0", "2 0 140px"], ".item { flex: 1 1 0; min-width: 0; }"],
  ["flex-grow", "Sets how much of the remaining main-axis space this child receives relative to other growing children.", ["0", "1", "3"], ".item { flex: 1 1 0; min-width: 0; }"],
  ["flex-shrink", "Sets the child's shrink factor when all the items' bases cannot fit. The amount also depends on each base size.", ["1", "0", "3"], ".item { flex: 0 1 140px; min-width: 0; padding: 8px; }"],
  ["flex-basis", "Sets the initial main-axis size of a flex child before free space is distributed.", ["auto", "140px", "40%"], ".item { flex-grow: 0; min-width: 0; }"],
  ["order", "Changes the visual order of a flex or grid item. It does not change reading order or keyboard focus order.", ["0", "-1", "2"], ""]
]) add("flex", property, summary, values, flex, { selector: ".selected", css: extra, contextNote: "The selected declaration applies to the gold child, inside a flex parent." });

// Grid definitions, auto-placement, and explicit item placement.
for (const [property, summary, values, extra] of [
  ["grid-template-columns", "Defines the sizes of explicit grid columns. fr shares available space; repeat reduces duplication.", ["repeat(3, 1fr)", "120px 1fr", "1fr 2fr 1fr"], ""],
  ["grid-template-rows", "Defines the sizes of explicit grid rows.", ["repeat(2, 70px)", "50px 140px", "auto auto"], ""],
  ["grid-auto-rows", "Sizes implicit rows created beyond grid-template-rows.", ["50px", "100px", "minmax(60px, auto)"], ".demo { grid-template-rows: none; }"],
  ["grid-auto-columns", "Sizes implicit columns created outside the explicitly defined grid.", ["70px", "120px", "1fr"], ".demo { grid-template-columns: none; grid-auto-flow: column; grid-template-rows: repeat(2, 70px); overflow: auto; }"],
  ["grid-auto-flow", "Chooses whether auto-placed items fill by rows or columns. dense can fill earlier holes, changing visual order.", ["row", "column", "row dense"], ".selected { grid-column: span 2; }"],
  ["grid-template", "Sets explicit row and column definitions together, optionally including named areas.", ["70px 70px / repeat(3, 1fr)", "100px 60px / 1fr 2fr", "none"], ""],
  ["grid", "A shorthand that defines grid tracks and resets related implicit-grid settings.", ["70px 70px / repeat(3, 1fr)", "auto-flow 90px / repeat(2, 1fr)", "none"], ""],
  ["justify-items", "Aligns each grid item within its cell along the inline axis.", ["stretch", "center", "end"], ""],
  ["place-items", "Sets align-items and justify-items together, aligning grid children within their cells.", ["stretch", "center", "end start"], ""],
  ["place-content", "Aligns the complete collection of grid tracks when it occupies less space than the container.", ["start", "center", "space-between"], ".demo { height: 300px; grid-template-columns: repeat(3, 70px); grid-template-rows: repeat(2, 60px); }"],
  ["justify-self", "Overrides inline-axis alignment for one grid item.", ["stretch", "center", "end"], ""],
  ["place-self", "Sets align-self and justify-self for one grid item.", ["stretch", "center", "end start"], ""]
]) add("grid", property, summary, values, grid, { css: extra, ...(["justify-self", "place-self"].includes(property) ? { selector: ".selected", contextNote: "Only the gold grid child receives this declaration." } : {}) });
add("grid", "grid-template-areas", "Names rectangular regions in the grid. Children with matching grid-area names occupy those regions.", ['"header header" "sidebar main" "footer footer"', '"header header" "main sidebar" "footer footer"', '"header" "sidebar" "main" "footer"'], grid, {
  html: `<div class="stage"><div class="demo"><div class="header item">Header</div><div class="sidebar item">Sidebar</div><div class="main item">Main</div><div class="footer item">Footer</div></div></div>`,
  css: ".demo { grid-template-columns: none; grid-template-rows: none; grid-auto-rows: 65px; } .header { grid-area: header; } .sidebar { grid-area: sidebar; } .main { grid-area: main; } .footer { grid-area: footer; }"
});
for (const [property, summary, values, extra] of [
  ["grid-column", "Sets the start and end grid-column lines for this child. span makes it occupy multiple columns.", ["auto", "1 / 3", "2 / span 2"], ""],
  ["grid-row", "Sets the start and end grid-row lines for this child.", ["auto", "1 / 3", "2 / 3"], ""],
  ["grid-column-start", "Sets the grid line where this child begins along the column axis.", ["auto", "2", "3"], ""],
  ["grid-column-end", "Sets the grid line where this child ends, or how many columns it spans.", ["auto", "span 2", "4"], ".selected { grid-column-start: 1; }"],
  ["grid-row-start", "Sets the grid line where this child begins along the row axis.", ["auto", "2", "3"], ""],
  ["grid-row-end", "Sets the grid line where this child ends, or how many rows it spans.", ["auto", "span 2", "3"], ".selected { grid-row-start: 1; }"],
  ["grid-area", "Sets the item's row start, column start, row end, and column end; it can also refer to a named grid area.", ["auto", "1 / 1 / 3 / 3", "2 / 2 / 3 / 4"], ""]
]) add("grid", property, summary, values, grid, { selector: ".selected", css: extra, contextNote: "The gold child is explicitly placed. The other children use grid auto-placement." });

// Clipping, scrolling, and replaced elements.
for (const [property, summary] of [
  ["overflow", "Chooses whether overflowing content is visible, clipped, or accessible by scrolling on both axes."],
  ["overflow-x", "Controls content that overflows the box horizontally."],
  ["overflow-y", "Controls content that overflows the box vertically."]
]) add("overflow-media", property, summary, ["auto", "hidden", "scroll", "visible"], overflow, { previewNote: "When one axis scrolls, visible on the other axis can compute to auto. The browser applies these axis rules." });
add("overflow-media", "overflow-clip-margin", "Lets clipped paint extend beyond the overflow clip edge by this distance. It applies with overflow:clip.", ["0px", "16px", "32px"], box, { html: `<div class="stage"><div class="demo"><div class="wide">This child extends beyond its clipping box.</div></div></div>`, css: ".demo { width: 220px; height: 100px; overflow: clip; } .wide { width: 310px; height: 100px; background: #ffe2a8; padding: 20px; }" });
add("overflow-media", "object-fit", "Controls how an image's content fits its fixed-size image box. cover can crop; contain shows the whole picture.", ["cover", "contain", "fill", "none"], image);
add("overflow-media", "object-position", "Positions an image's content within its box; this is easiest to see when object-fit crops it.", ["center", "left top", "right bottom"], image);
add("overflow-media", "image-rendering", "Chooses how raster pixels are sampled when an image is enlarged. Pixel art can keep hard edges.", ["auto", "pixelated", "crisp-edges"], image, { html: `<div class="stage"><img class="demo" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQImWP4z8DwH4QZGP4zMDAAACYBA/7p2o3fAAAAAElFTkSuQmCC" alt="A tiny four-pixel image enlarged to show sampling"><p class="note">This tiny bitmap is enlarged so you can compare the edges.</p></div>`, css: ".demo { image-rendering: auto; object-fit: fill; }" });
const scrollDemo = {
  html: `<div class="stage"><p><a href="#destination">Jump to the destination</a></p><div class="demo"><div class="scroller"><section>Start of the scroll frame</section><section>Middle of the scroll frame</section><section id="destination">Destination</section></div></div><p class="note">Switch off Inspect elements, use the link, and scroll inside the frame.</p></div>`,
  css: `.demo { width: 100%; height: 170px; overflow: auto; padding: 0; }
.scroller section { min-height: 140px; padding: 24px; border-bottom: 2px solid #6080cb; } #destination { background: #ffe2a8; }
@media (prefers-reduced-motion: reduce) { .demo { scroll-behavior: auto !important; } }`
};
add("overflow-media", "scroll-behavior", "Controls whether anchor and programmatic scrolling jumps immediately or scrolls smoothly. It does not change direct wheel or touch scrolling.", ["auto", "smooth"], scrollDemo);
add("overflow-media", "scroll-padding", "Adds an inward offset to the scroll container's optimal viewing area, useful when content needs to avoid a sticky header.", ["0", "32px", "60px"], scrollDemo, { css: ".demo { scroll-snap-type: y mandatory; } .scroller section { scroll-snap-align: start; }", previewNote: "Scroll until a section snaps. The offset is measured inside the scroll container; it does not add ordinary layout padding." });
add("overflow-media", "scroll-margin", "Adds an outward offset to the selected element's scroll snap area without changing ordinary layout margins.", ["0", "32px", "60px"], scrollDemo, { selector: "#destination", css: ".demo { scroll-snap-type: y mandatory; } .scroller section { scroll-snap-align: start; }", previewNote: "Use the destination link or scroll to the final section and compare its snap position." });
add("overflow-media", "scroll-snap-type", "Enables snapping along the chosen scroll axis. mandatory snaps at each stop; proximity snaps when close enough.", ["none", "y mandatory", "y proximity"], scrollDemo, { css: ".scroller section { scroll-snap-align: start; }" });
add("overflow-media", "scroll-snap-align", "Chooses which edge or center of each child aligns with the scroll container's snap position.", ["start", "center", "end"], scrollDemo, { selector: ".scroller section", css: ".demo { scroll-snap-type: y mandatory; }" });
add("overflow-media", "scroll-snap-stop", "Chooses whether a fast scroll can pass a snap position or should stop at it.", ["normal", "always"], scrollDemo, { selector: ".scroller section", css: ".demo { scroll-snap-type: y mandatory; } .scroller section { scroll-snap-align: start; }", previewNote: "Try a fast touch, trackpad, or wheel scroll. The difference depends on the input device and browser." });
add("overflow-media", "overscroll-behavior", "Controls scroll chaining and overscroll effects when this frame reaches its scrolling boundary.", ["auto", "contain", "none"], overflow, { previewNote: "Scroll to the frame's boundary. contain stops scroll chaining; browser overscroll effects vary by device." });
add("overflow-media", "scrollbar-gutter", "Reserves room for classic scrollbars to reduce layout shifts. Overlay scrollbars may not occupy a gutter.", ["auto", "stable", "stable both-edges"], overflow, { previewNote: "A visible width change depends on whether your browser uses classic or overlay scrollbars." });
add("overflow-media", "scrollbar-width", "Requests the thickness of the native scrollbar. Keep content usable when choosing a thin or hidden scrollbar.", ["auto", "thin", "none"], overflow);
add("overflow-media", "scrollbar-color", "Sets the scrollbar thumb and track colors where the browser supports custom scrollbar colors.", ["auto", "#244497 #dce8ff", "#b43e66 #ffe2a8"], overflow, { previewNote: "Native scrollbar appearance and support vary by browser and operating system." });

// Visual transforms preserve the element's original layout position.
for (const [property, summary, values, extra] of [
  ["transform", "Applies one or more visual transformations. The element's original position in normal layout is preserved.", ["none", "rotate(15deg)", "translate(30px, 20px) scale(0.8)"], ""],
  ["transform-origin", "Sets the point around which transforms operate. Compare the pivot of the same rotation.", ["center", "left top", "right bottom"], ".demo { transform: rotate(20deg); }"],
  ["translate", "Moves the element visually along the x and y axes as an individual transform.", ["0", "40px 20px", "-20px 30px"], ""],
  ["rotate", "Rotates the element around its transform origin as an individual transform.", ["0deg", "20deg", "-20deg"], ""],
  ["scale", "Scales the element visually as an individual transform. The original layout size remains unchanged.", ["1", "0.75", "1.15 0.8"], ""],
  ["box-shadow", "Paints one or more shadows around the box. inset draws a shadow inside its edges.", ["none", "8px 8px 18px #9baac1", "inset 0 0 18px #6080cb"], ""],
  ["filter", "Applies visual effects to the element and its rendered contents.", ["none", "blur(3px)", "grayscale(1)", "hue-rotate(100deg)"], ""],
  ["clip-path", "Clips the painted element to a shape. The unclipped box still occupies its original layout space.", ["none", "circle(45%)", "polygon(50% 0%, 100% 100%, 0% 100%)"], ""],
  ["mask-image", "Uses an image's alpha channel as a mask. A fading gradient makes parts of the element transparent.", ["none", "linear-gradient(to right, black, transparent)", "radial-gradient(circle, black 35%, transparent 70%)"], ""]
]) add("effects", property, summary, values, property === "filter" || property === "clip-path" || property === "mask-image" ? image : box, { css: extra });
const perspectiveContext = {
  html: `<div class="stage"><div class="demo"><div class="tilted">A rotated 3D child</div></div></div>`,
  css: `.demo { perspective: 450px; height: 230px; background: transparent; }
.tilted { width: 200px; height: 140px; padding: 24px; color: #244497; background: #dce8ff; border: 2px solid #6080cb; transform: rotateY(45deg); }`
};
add("effects", "perspective", "Sets the distance from the viewer to the z=0 plane for transformed children. A shorter distance creates a stronger 3D effect.", ["450px", "180px", "none"], perspectiveContext);
add("effects", "perspective-origin", "Sets the viewer's position for the parent's perspective projection.", ["center", "left top", "right bottom"], perspectiveContext);
add("effects", "backface-visibility", "Chooses whether the back of a 3D-rotated element is visible when it faces the viewer.", ["visible", "hidden"], perspectiveContext, { selector: ".tilted", css: ".tilted { transform: rotateY(160deg); }" });
add("effects", "transform-style", "Chooses whether 3D-transformed children keep their own 3D positions or are flattened into the parent's plane.", ["flat", "preserve-3d"], perspectiveContext, { html: `<div class="stage"><div class="scene"><div class="demo"><div class="front">Front</div><div class="back">Behind</div></div></div></div>`, css: ".scene { perspective: 500px; height: 230px; } .demo { position: relative; width: 210px; height: 150px; transform: rotateY(35deg); background: transparent; } .front, .back { position: absolute; inset: 12px; padding: 12px; background: #dce8ff; border: 2px solid #6080cb; } .front { transform: translateZ(45px); } .back { transform: translateZ(-45px); background: #ffe2a8; }" });
add("effects", "backdrop-filter", "Filters the pixels behind a translucent element rather than filtering the element's own text.", ["none", "blur(6px)", "grayscale(1)"], box, { css: ".stage { background: repeating-linear-gradient(45deg, #6080cb 0 15px, #ffe2a8 15px 30px); } .demo { background: #ffffff88; }" });
add("effects", "mix-blend-mode", "Blends the entire element's paint with the content behind it.", ["normal", "multiply", "screen"], box, { css: ".stage { background: repeating-linear-gradient(45deg, #ffe2a8 0 35px, #9ed9a8 35px 70px); } .demo { background: #bd9de9; }" });

// Interactions require the actual relevant native element.
add("interactions", "cursor", "Sets the mouse pointer shown over the element. It does not add click behavior.", ["auto", "pointer", "crosshair", "grab"], box, { previewNote: "Move your mouse over the blue box to see the cursor." });
add("interactions", "pointer-events", "Controls whether this element can be a pointer target. none can let the pointer reach an element underneath; it does not remove keyboard focus.", ["auto", "none"], box, { html: `<div class="stage"><label class="under"><input type="checkbox"> Check this box through the blue layer</label><div class="demo">Blue layer over the checkbox</div><p class="note">Switch off Inspect elements. With none, click where the checkbox sits below this layer.</p></div>`, css: ".stage { position: relative; min-height: 220px; } .under { display: block; padding: 16px; } .demo { position: absolute; top: 24px; left: 24px; width: 330px; height: 90px; opacity: 0.65; } .note { margin-top: 70px; }" });
add("interactions", "user-select", "Chooses whether users can select text, or select the whole element's text at once.", ["auto", "none", "all"], text, { previewNote: "Switch off Inspect elements, then drag across the words to compare text selection." });
add("interactions", "accent-color", "Tints browser-provided controls such as checkboxes, radio buttons, and range sliders.", ["#244497", "#b43e66", "#177447"], form, { html: `<div class="stage"><div class="demo"><label><input type="checkbox" checked> Checkbox</label><br><label><input type="radio" checked name="style-radio"> Radio button</label><br><label>Range <input type="range" value="65"></label></div><p class="note">Switch off Inspect elements to interact.</p></div>`, selector: ".demo input", css: ".demo input { width: auto; }" });
add("interactions", "appearance", "Controls native widget appearance. Removing it means your CSS must provide a usable visible control.", ["auto", "none"], form, { html: `<div class="stage"><label for="choice">Choose a topic</label><select class="demo" id="choice"><option>HTML tags</option><option>CSS properties</option></select><p class="note">Compare the browser's dropdown arrow and widget decoration.</p></div>` });
add("interactions", "caret-color", "Sets the color of the blinking text insertion cursor in editable content.", ["auto", "#b43e66", "#177447"], form, { previewNote: "Switch off Inspect elements, click the input, and type to see its caret." });
add("interactions", "resize", "Lets users resize an element with a drag handle. Ordinary boxes need non-visible overflow; textareas support resizing naturally.", ["both", "horizontal", "vertical", "none"], form, { html: `<div class="stage"><label for="resizable">Drag my resize handle</label><textarea class="demo" id="resizable">A resizable note</textarea><p class="note">Switch off Inspect elements to drag the bottom-right corner.</p></div>`, css: ".demo { width: 260px; height: 100px; overflow: auto; }" });

// Every animation uses real keyframes and respects reduced motion preferences.
for (const [property, summary, values, extra] of [
  ["transition", "Sets the properties to animate, duration, easing, and delay when a value changes.", ["none", "transform 700ms ease, background-color 700ms ease", "all 1.8s linear"], ""],
  ["transition-property", "Chooses which changed properties are interpolated during a transition.", ["all", "transform", "background-color"], ""],
  ["transition-duration", "Sets how long the transition from the old value to the new value lasts.", ["700ms", "150ms", "2s"], ""],
  ["transition-timing-function", "Controls the pace of a transition over its duration.", ["ease", "linear", "steps(4, end)"], ""],
  ["transition-delay", "Sets how long to wait after a value changes before starting its transition.", ["0s", "700ms", "1.5s"], ""]
]) add("motion", property, summary, values, transition, { css: extra, previewNote: "Turn off Inspect elements, then hover or keyboard-focus the button. The example honors prefers-reduced-motion." });
for (const [property, summary, values, extra] of [
  ["animation", "Sets the animation name, duration, timing, delay, repetitions, direction, fill mode, and play state in one shorthand.", ["travel 2.4s ease-in-out infinite alternate", "turn 2s linear infinite alternate", "none"], ""],
  ["animation-name", "Selects the @keyframes rule to play; none disables the animation.", ["travel", "turn", "none"], ""],
  ["animation-duration", "Sets the time for one complete animation cycle.", ["2.4s", "800ms", "5s"], ""],
  ["animation-timing-function", "Sets the pacing between keyframes.", ["ease-in-out", "linear", "steps(5, end)"], ""],
  ["animation-delay", "Sets when the animation starts. A negative delay starts partway through the cycle.", ["0s", "1.5s", "-1.2s"], ""],
  ["animation-iteration-count", "Sets how many cycles play. infinite repeats until the animation is disabled.", ["infinite", "1", "3"], ""],
  ["animation-direction", "Chooses the order in which keyframes play on each cycle.", ["alternate", "normal", "reverse", "alternate-reverse"], ""],
  ["animation-fill-mode", "Chooses whether keyframe styles apply before the start and after the end of the active animation.", ["none", "forwards", "both"], ".demo { animation: travel 1.8s ease 1s 1 normal; }"],
  ["animation-play-state", "Pauses or resumes the animation at its current position.", ["running", "paused"], ""]
]) add("motion", property, summary, values, motion, { css: extra, previewNote: "A device set to reduced motion stops this example. In that case, read the declaration and keyframes, or change your device preference to experience motion." });

// Markers, native tables, generated content, and multicolumn flow.
for (const [property, summary, values] of [
  ["list-style", "Sets the marker type or image and its position in one shorthand.", ["disc outside", "square inside", "none"]],
  ["list-style-type", "Chooses the list marker shape or numbering system.", ["disc", "square", "decimal", "upper-roman"]],
  ["list-style-position", "Places the marker outside the item's content box or inside it as inline content.", ["outside", "inside"]],
  ["list-style-image", "Uses an image as the list marker, with list-style-type as the fallback.", ["none", "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14'%3E%3Ccircle cx='7' cy='7' r='5' fill='%23b43e66'/%3E%3C/svg%3E\")"]]
]) add("lists-tables-columns", property, summary, values, list);
for (const [property, summary, values, extra] of [
  ["border-collapse", "Chooses whether table-cell borders remain separate or merge into one shared border.", ["separate", "collapse"], ""],
  ["border-spacing", "Sets the gap between separate table-cell borders. It has no effect when border-collapse is collapse.", ["8px", "0", "16px 6px"], ""],
  ["table-layout", "Chooses automatic content-based table column sizing or fixed sizing from the table width and first row.", ["auto", "fixed"], "th:first-child { width: 65%; }"],
  ["caption-side", "Places the table caption above or below the table.", ["top", "bottom"], ""],
  ["empty-cells", "Chooses whether to paint backgrounds and borders on empty cells in separate-border tables.", ["show", "hide"], ""]
]) add("lists-tables-columns", property, summary, values, table, { css: extra, ...(property === "table-layout" ? { html: `<div class="stage"><table class="demo"><caption>Compare column sizing</caption><thead><tr><th>Topic</th><th>Minutes</th></tr></thead><tbody><tr><td>A_very_long_unbreakable_topic_name</td><td>20</td></tr><tr><td>CSS</td><td>30</td></tr></tbody></table></div>`, css: `${extra} td { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }`, previewNote: "Auto sizing considers the long unbroken content. Fixed sizing uses the table width and first row, so the cell's ellipsis can appear." } : {}) });
for (const [property, summary, values, extra] of [
  ["column-count", "Requests this number of columns for flowing text.", ["2", "1", "3"], ""],
  ["column-width", "Sets an ideal width for columns; the browser chooses how many fit in the available space.", ["160px", "240px", "100px"], ".demo { column-count: auto; }"],
  ["columns", "Sets the preferred column width and/or maximum count in one shorthand.", ["2", "150px 3", "auto"], ""],
  ["column-rule", "Draws a separator line between flowing-text columns. It does not take extra layout space.", ["2px solid #6080cb", "5px dotted #b43e66", "none"], ""],
  ["column-rule-width", "Sets the width of the separator between text columns.", ["2px", "6px", "12px"], ""],
  ["column-rule-style", "Sets the line style of the column separator.", ["solid", "dashed", "double"], ""],
  ["column-rule-color", "Sets the color of the column separator.", ["#6080cb", "#b43e66", "#177447"], ""],
  ["column-fill", "Chooses whether to balance content between constrained-height columns or fill one column before the next.", ["balance", "auto"], ".demo { height: 300px; }"],
  ["column-span", "Lets a child span all the columns in its multicolumn parent.", ["none", "all"], ""],
  ["break-inside", "Controls whether a box may split across columns or pages. Here avoid-column tries to keep each paragraph together.", ["auto", "avoid-column", "avoid"], ".demo { height: 310px; column-fill: auto; }"],
  ["break-before", "Controls a fragmentation break before a box. column starts a new column in this example.", ["auto", "column", "avoid-column"], ""],
  ["break-after", "Controls a fragmentation break after a box. column sends following content to a new column.", ["auto", "column", "avoid-column"], ""]
]) add("lists-tables-columns", property, summary, values, column, { css: extra, ...(property === "column-span" ? { selector: ".demo h2" } : property.startsWith("break-") ? { selector: property === "break-inside" ? ".demo p" : ".demo p:first-of-type" } : {}) });
add("lists-tables-columns", "content", "Creates generated content in a pseudo-element. This decorates the element; important information should still live in the HTML.", ['"★ "', '"Note: "', '"→ "', "none"], text, { selector: ".demo::before", css: ".demo::before { color: #b43e66; font-weight: 700; }", contextNote: "The selector targets the ::before pseudo-element of the paragraph. The paragraph's real text remains in the HTML.", previewNote: "The generated prefix belongs to ::before. Inspect the pseudo-element to compare its content value with the paragraph's real text." });
const counters = {
  html: `<div class="stage"><div class="demo"><p>Choose a tag</p><p>Change its content</p><p>Style the result</p></div></div>`,
  css: `.demo { counter-reset: step; } .demo p { counter-increment: step; } .demo p::before { content: counter(step) ". "; color: #b43e66; font-weight: bold; }`
};
add("lists-tables-columns", "counter-reset", "Creates a named counter with a starting value. A generated marker can display its current value.", ["step", "step 10", "step 99"], counters);
add("lists-tables-columns", "counter-increment", "Changes a named counter each time a matching element is encountered.", ["step", "step 2", "step 5"], counters, { selector: ".demo p" });
add("lists-tables-columns", "quotes", "Defines the opening and closing quote marks used by generated open-quote and close-quote content.", ['"“" "”" "‘" "’"', '"«" "»" "‹" "›"', '"[" "]"'], text, { html: `<div class="stage"><p class="demo"><q>Learn by trying <q>one change</q> at a time.</q></p></div>` });

// Custom properties and resets are useful foundations alongside visual styles.
add("colors-backgrounds", "--accent", "Defines a reusable custom property. var(--accent) reads it wherever a normal CSS value is needed.", ["#244497", "#b43e66", "#177447"], box, { css: ".demo { color: white; background: var(--accent); border-color: var(--accent); }", contextNote: "The --accent value is read twice: once for the background and once for the border. Custom property names are chosen by the author." });
add("layout-position", "all", "Resets nearly all CSS properties at once. It excludes custom properties, direction, and unicode-bidi; use this reset carefully.", ["initial", "inherit", "revert"], box, { previewNote: "The blue box styles disappear because all resets its existing declarations. inherit takes the parent's values; revert returns to browser or user styles. The browser reports each resulting property separately; all itself has no computed value." });

export const cssStyles = entries;
export const cssStyleGroups = groupDefinitions.map(([id, title, description]) => ({
  id, title, description, properties: entries.filter(entry => entry.groupId === id).map(entry => entry.id)
}));
export const cssStyleCoverage = "Common standard CSS properties, including physical and logical sides, layout, text, images, controls, and motion. Experimental, vendor-prefixed, SVG-only, and print-only properties are not included. Browser and font support can affect some examples.";

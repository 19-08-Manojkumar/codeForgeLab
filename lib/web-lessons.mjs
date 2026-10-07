// HTML and CSS are rendered by the browser instead of evaluated as method calls.
// Examples are body fragments; the preview supplies the document shell.
// Challenge style values use getComputedStyle() serialization.
const surface = `body {
  margin: 0;
  padding: 24px;
  color: #25324a;
  background: #f3f6fb;
  font-family: system-ui, sans-serif;
  line-height: 1.6;
}
.card {
  max-width: 460px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border: 1px solid #dfe6f1;
  border-radius: 16px;
}
h1 { margin: 0 0 12px; font-size: 28px; line-height: 1.25; }
h2 { margin: 20px 0 8px; font-size: 20px; }
p { margin: 8px 0; }
a { color: #315cbd; }
button, input { font: inherit; }
* { box-sizing: border-box; }`;

const withSurface = css => `${surface}\n${css || ""}`.trim();
const entry = lesson => ({ name: lesson.title, ...lesson });

const htmlLessons = [
  entry({
    id: "elements", title: "Tags, text & nesting", group: "Foundations",
    summary: "Turn plain text into headings and paragraphs, then put meaningful tags inside them.",
    concepts: [
      "An element usually has an opening tag, content, and a closing tag: <p>Hello</p>.",
      "Use h1 for the page's main heading and p for a paragraph; their default browser styles differ.",
      "Close a nested element before closing its parent. strong marks importance; em marks emphasis."
    ],
    html: `<article class="card">
  <h1>My first web page</h1>
  <p>I am learning <strong>HTML</strong>, one tag at a time.</p>
  <p>Small changes can make a <em>big difference</em>.</p>
</article>`,
    css: withSurface("strong { color: #315cbd; }"),
    explain: [
      { token: "<h1>…</h1>", title: "A main heading", description: "The browser creates a heading element. It appears larger here because h1 has heading styles, and it identifies the main topic.", selector: "h1" },
      { token: "<p>…</p>", title: "A paragraph", description: "Each p creates a separate paragraph. Normal browser layout places these blocks below the heading.", selector: "p" },
      { token: "<strong>HTML</strong>", title: "A child inside a paragraph", description: "strong belongs inside the first p. It adds importance to just this text and is bold by default.", selector: "p strong" },
      { token: "<em>…</em>", title: "Emphasized words", description: "em gives stress emphasis to this phrase. Browsers normally show it in italic text.", selector: "em" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax",
    challenge: {
      prompt: "Change the h1 to Hello, browser! and add a third paragraph containing <strong>I built this.</strong>.",
      hint: "Put the new p inside article. Close strong before closing p.",
      solution: {
        html: `<article class="card">
  <h1>Hello, browser!</h1>
  <p>I am learning <strong>HTML</strong>, one tag at a time.</p>
  <p>Small changes can make a <em>big difference</em>.</p>
  <p><strong>I built this.</strong></p>
</article>`,
        css: withSurface("strong { color: #315cbd; }")
      },
      checks: [
        { type: "text", selector: "h1", equals: "Hello, browser!", label: "The main heading says Hello, browser!" },
        { type: "exists", selector: "article > p", minCount: 3, label: "The article has at least three paragraphs" },
        { type: "text", selector: "article > p:last-of-type > strong", equals: "I built this.", label: "The new paragraph contains important text" }
      ]
    }
  }),
  entry({
    id: "attributes", title: "Attributes, classes & IDs", group: "Foundations",
    summary: "Give elements extra information and see how class names connect HTML to CSS.",
    concepts: [
      "Attributes live in the opening tag: class=\"badge\". Quote attribute values.",
      "A class may be shared by many elements. An id should identify one element in the document.",
      "CSS uses .badge to select a class and #profile to select an ID. A class name alone does not add a style."
    ],
    html: `<article class="card" id="profile">
  <h1>Meet Maya</h1>
  <p>Maya is building her first website.</p>
  <span class="badge">HTML learner</span>
  <span class="badge">Creative thinker</span>
</article>`,
    css: withSurface(`.badge {
  display: inline-block;
  padding: 4px 12px;
  margin: 8px 4px 0 0;
  color: #315cbd;
  background: #eaf0ff;
  border-radius: 999px;
}
.featured { color: #805118; background: #fff0d7; }
#profile { border-top: 4px solid #315cbd; }`),
    explain: [
      { token: 'class="card"', title: "A reusable class", description: "The .card rule selects this article and adds its white background and spacing. Other elements could share this class.", selector: ".card" },
      { token: 'id="profile"', title: "A unique identifier", description: "The #profile rule targets this one profile. An ID can also be a destination for an in-page link.", selector: "#profile" },
      { token: 'class="badge"', title: "The same class, twice", description: "Both spans match .badge, so both receive the pill shape. span groups inline content without adding special meaning.", selector: ".badge" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/class",
    challenge: {
      prompt: "Add featured to the first badge's class list and add title=\"Learning every day\" to that same span. Keep its badge class.",
      hint: 'An element can have several classes: class="badge featured". title is a separate attribute.',
      solution: {
        html: `<article class="card" id="profile">
  <h1>Meet Maya</h1>
  <p>Maya is building her first website.</p>
  <span class="badge featured" title="Learning every day">HTML learner</span>
  <span class="badge">Creative thinker</span>
</article>`,
        css: withSurface(`.badge { display: inline-block; padding: 4px 12px; margin: 8px 4px 0 0; color: #315cbd; background: #eaf0ff; border-radius: 999px; }
.featured { color: #805118; background: #fff0d7; }
#profile { border-top: 4px solid #315cbd; }`)
      },
      checks: [
        { type: "exists", selector: "span.badge.featured", minCount: 1, label: "One span has both badge and featured classes" },
        { type: "attribute", selector: "span.badge.featured", name: "title", value: "Learning every day", label: "The featured badge has the requested title" },
        { type: "exists", selector: "#profile", count: 1, label: "The profile ID stays unique" }
      ]
    }
  }),
  entry({
    id: "structure", title: "Give your page meaning", group: "Page structure",
    summary: "Build a small page with header, navigation, main content, an article, and a footer.",
    concepts: [
      "Semantic elements describe what content means. header introduces content; nav contains major navigation links.",
      "main contains the page's primary content. article represents a self-contained piece of content.",
      "Use heading levels to describe hierarchy. CSS controls appearance separately from that meaning."
    ],
    html: `<div class="card">
  <header>
    <p class="eyebrow">FIELD NOTES</p>
    <h1>The weekend journal</h1>
    <nav aria-label="Journal"><a href="#story">Read the story</a></nav>
  </header>
  <main>
    <article id="story">
      <h2>A walk in the park</h2>
      <p>A quiet path, fresh air, and a notebook full of ideas.</p>
    </article>
  </main>
  <footer><p>Written by Maya</p></footer>
</div>`,
    css: withSurface(`.eyebrow { color: #67758d; font-size: 12px; letter-spacing: 2px; }
footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #dfe6f1; color: #67758d; font-size: 14px; }`),
    explain: [
      { token: "<header>", title: "An introduction", description: "This header groups the journal's title and navigation. header does not automatically create a special visual layout.", selector: "header" },
      { token: "<nav>", title: "Navigation", description: "nav identifies a group of navigation links. aria-label gives this navigation a descriptive accessible name.", selector: "nav" },
      { token: "<main>", title: "Primary content", description: "main marks the central content of this page, helping readers and assistive technology find it.", selector: "main" },
      { token: "<article>", title: "A complete story", description: "article groups content that could make sense on its own. Its h2 is below the page's h1 in the heading hierarchy.", selector: "article" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Structuring_documents",
    challenge: {
      prompt: 'Inside main, add a second article with id="next-story", an h2 saying A new adventure, and a paragraph of your own.',
      hint: "Place the second article after the existing one, before </main>. Keep one main element.",
      solution: {
        html: `<div class="card">
  <header>
    <p class="eyebrow">FIELD NOTES</p>
    <h1>The weekend journal</h1>
    <nav aria-label="Journal"><a href="#story">Read the story</a></nav>
  </header>
  <main>
    <article id="story">
      <h2>A walk in the park</h2>
      <p>A quiet path, fresh air, and a notebook full of ideas.</p>
    </article>
    <article id="next-story">
      <h2>A new adventure</h2>
      <p>Tomorrow we will explore a different trail.</p>
    </article>
  </main>
  <footer><p>Written by Maya</p></footer>
</div>`,
        css: withSurface(`.eyebrow { color: #67758d; font-size: 12px; letter-spacing: 2px; }
footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #dfe6f1; color: #67758d; font-size: 14px; }`)
      },
      checks: [
        { type: "exists", selector: "main", count: 1, label: "The page has one main content region" },
        { type: "exists", selector: "main > article", minCount: 2, label: "Two articles belong to main" },
        { type: "text", selector: "#next-story h2", equals: "A new adventure", label: "The new article has the requested heading" },
        { type: "exists", selector: "#next-story p", minCount: 1, label: "The new article includes a paragraph" }
      ]
    }
  }),
  entry({
    id: "lists", title: "Bullets, steps & list items", group: "Content",
    summary: "Compare an unordered list with a numbered list and add items in the right place.",
    concepts: [
      "ul groups items whose order does not matter; ol groups items in a meaningful order.",
      "Each item uses li inside its ul or ol. The browser supplies bullets or numbers.",
      "Nest another list inside a li when an item needs subitems."
    ],
    html: `<article class="card">
  <h1>Make a cup of tea</h1>
  <h2>What you need</h2>
  <ul class="ingredients">
    <li>Water</li>
    <li>Tea leaves</li>
  </ul>
  <h2>The steps</h2>
  <ol class="steps">
    <li>Boil the water.</li>
    <li>Steep the tea.</li>
  </ol>
</article>`,
    css: withSurface(`ul, ol { padding-left: 24px; }
li { margin: 8px 0; }
li::marker { color: #315cbd; font-weight: bold; }`),
    explain: [
      { token: "<ul>", title: "An unordered list", description: "The ingredients appear with bullets because their sequence is not important.", selector: "ul.ingredients" },
      { token: "<ol>", title: "An ordered list", description: "The instructions appear with numbers because the steps should happen in order.", selector: "ol.steps" },
      { token: "<li>", title: "One list item", description: "li creates an item in its parent list. Each item receives its own marker from that list's style.", selector: "li" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ul",
    challenge: {
      prompt: "Add a third ingredient, A cup, and a third step, Pour and enjoy., to their respective lists.",
      hint: "Use a new li before each list's closing tag. Keep ingredients in ul and steps in ol.",
      solution: {
        html: `<article class="card">
  <h1>Make a cup of tea</h1>
  <h2>What you need</h2>
  <ul class="ingredients">
    <li>Water</li>
    <li>Tea leaves</li>
    <li>A cup</li>
  </ul>
  <h2>The steps</h2>
  <ol class="steps">
    <li>Boil the water.</li>
    <li>Steep the tea.</li>
    <li>Pour and enjoy.</li>
  </ol>
</article>`,
        css: withSurface(`ul, ol { padding-left: 24px; }
li { margin: 8px 0; }
li::marker { color: #315cbd; font-weight: bold; }`)
      },
      checks: [
        { type: "exists", selector: ".ingredients > li", minCount: 3, label: "The ingredient list has three items" },
        { type: "text", selector: ".ingredients > li:last-child", equals: "A cup", label: "A cup is an ingredient" },
        { type: "exists", selector: ".steps > li", minCount: 3, label: "The ordered list has three steps" },
        { type: "text", selector: ".steps > li:last-child", equals: "Pour and enjoy.", label: "The final instruction is included" }
      ]
    }
  }),
  entry({
    id: "links", title: "Links & page destinations", group: "Content",
    summary: "Use href to connect visible link text with a destination inside your page.",
    concepts: [
      "a creates a hyperlink when it has an href. The text inside a tells the reader where it leads.",
      "href=\"#about\" points to the element with id=\"about\" in this document.",
      "Full URLs link to other websites; relative URLs link to files in a site. Use meaningful link text."
    ],
    html: `<article class="card">
  <h1>A tiny portfolio</h1>
  <nav aria-label="Portfolio">
    <a href="#about">About me</a>
  </nav>
  <section id="about">
    <h2>About me</h2>
    <p>I turn ideas into small, useful websites.</p>
  </section>
  <section id="projects">
    <h2>My projects</h2>
    <p>A recipe page, a reading list, and a weather card.</p>
  </section>
</article>`,
    css: withSurface(`nav { display: flex; gap: 16px; margin: 16px 0; }
nav a { padding: 6px 10px; background: #eaf0ff; border-radius: 6px; }
section { scroll-margin-top: 12px; }`),
    explain: [
      { token: '<a href="#about">', title: "Link text and destination", description: "About me is the clickable text. href supplies the destination; it is not displayed as the link's label.", selector: 'a[href="#about"]' },
      { token: 'id="about"', title: "The matching destination", description: "The #about fragment matches this section's ID. Clicking the link moves to this section in the preview.", selector: "#about" },
      { token: "<nav>", title: "Related navigation links", description: "nav gives these links a navigation role. New links can be placed beside the existing one.", selector: "nav" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a",
    challenge: {
      prompt: 'Add a link inside nav with the text My projects and href="#projects". Keep the About me link.',
      hint: "The fragment after # must exactly match the destination's ID.",
      solution: {
        html: `<article class="card">
  <h1>A tiny portfolio</h1>
  <nav aria-label="Portfolio">
    <a href="#about">About me</a>
    <a href="#projects">My projects</a>
  </nav>
  <section id="about">
    <h2>About me</h2>
    <p>I turn ideas into small, useful websites.</p>
  </section>
  <section id="projects">
    <h2>My projects</h2>
    <p>A recipe page, a reading list, and a weather card.</p>
  </section>
</article>`,
        css: withSurface(`nav { display: flex; gap: 16px; margin: 16px 0; }
nav a { padding: 6px 10px; background: #eaf0ff; border-radius: 6px; }
section { scroll-margin-top: 12px; }`)
      },
      checks: [
        { type: "exists", selector: 'nav a[href="#about"]', minCount: 1, label: "The About me link is retained" },
        { type: "text", selector: 'nav a[href="#projects"]', equals: "My projects", label: "The new link has its label and destination" },
        { type: "exists", selector: "#projects", count: 1, label: "The project destination exists" }
      ]
    }
  }),
  entry({
    id: "images", title: "Images, alt text & captions", group: "Content",
    summary: "Render a self-contained image and describe it with alt text and a visible caption.",
    concepts: [
      "img uses src to locate an image. It is a void element, so it has no closing tag.",
      "alt describes meaningful image content for people who cannot see it. Decorative images use alt=\"\".",
      "figure groups an image with an optional figcaption. Width and height attributes help reserve space."
    ],
    html: `<article class="card">
  <h1>A postcard from the hills</h1>
  <figure>
    <img
      src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='240' viewBox='0 0 480 240'%3E%3Crect width='480' height='240' fill='%23e0f2fe'/%3E%3Ccircle cx='366' cy='58' r='26' fill='%23f6bc55'/%3E%3Cpath d='M0 240L165 65L310 240Z' fill='%237b9aa8'/%3E%3Cpath d='M150 240L338 100L480 240Z' fill='%234b7186'/%3E%3C/svg%3E"
      alt="Two blue mountains beneath a golden sun"
      width="480"
      height="240">
    <figcaption>A peaceful mountain morning.</figcaption>
  </figure>
</article>`,
    css: withSurface(`figure { margin: 20px 0 0; }
img { display: block; width: 100%; height: auto; border-radius: 10px; }
figcaption { margin-top: 10px; color: #67758d; font-size: 14px; }`),
    explain: [
      { token: "<img src=\"…\">", title: "An embedded image", description: "src here contains a small SVG image as a data URL, so the picture loads without requesting an external file.", selector: "img" },
      { token: 'alt="Two blue mountains…"', title: "An equivalent text description", description: "alt communicates the image's content to assistive technology and when the picture cannot load; it is not a visible caption.", selector: "img" },
      { token: "<figcaption>", title: "A visible caption", description: "figcaption is displayed beneath the image here and belongs to its figure. It provides context that every reader can see.", selector: "figcaption" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img",
    challenge: {
      prompt: 'Set the image alt to Blue mountains and a golden sun and change the figcaption text to My mountain postcard. Keep the image source.',
      hint: "Edit alt in the img opening tag and the visible text between figcaption tags.",
      solution: {
        html: `<article class="card">
  <h1>A postcard from the hills</h1>
  <figure>
    <img
      src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='240' viewBox='0 0 480 240'%3E%3Crect width='480' height='240' fill='%23e0f2fe'/%3E%3Ccircle cx='366' cy='58' r='26' fill='%23f6bc55'/%3E%3Cpath d='M0 240L165 65L310 240Z' fill='%237b9aa8'/%3E%3Cpath d='M150 240L338 100L480 240Z' fill='%234b7186'/%3E%3C/svg%3E"
      alt="Blue mountains and a golden sun"
      width="480"
      height="240">
    <figcaption>My mountain postcard.</figcaption>
  </figure>
</article>`,
        css: withSurface(`figure { margin: 20px 0 0; }
img { display: block; width: 100%; height: auto; border-radius: 10px; }
figcaption { margin-top: 10px; color: #67758d; font-size: 14px; }`)
      },
      checks: [
        { type: "attribute", selector: "figure img", name: "alt", value: "Blue mountains and a golden sun", label: "The image has its new alt description" },
        { type: "text", selector: "figure figcaption", equals: "My mountain postcard.", label: "The visible caption is updated" },
        { type: "exists", selector: 'figure img[src^="data:image/svg+xml,"]', minCount: 1, label: "The embedded image is retained" }
      ]
    }
  }),
  entry({
    id: "forms", title: "Labels & form controls", group: "Interaction",
    summary: "Build an email field with an accessible label and browser validation.",
    concepts: [
      "form groups controls for collecting information. A real submission also needs an action or JavaScript handler.",
      "A label's for value must match the input's id; clicking the label then focuses that input.",
      "type=\"email\" checks email format when filled. required prevents an empty value. A placeholder does not replace a label."
    ],
    html: `<article class="card">
  <h1>Join the reading club</h1>
  <p>A new recommendation every Friday.</p>
  <form action="#" method="get">
    <label for="email">Email address</label>
    <input id="email" name="email" type="text" placeholder="you@example.com">
    <button type="button">Join the club</button>
  </form>
</article>`,
    css: withSurface(`form { margin-top: 20px; }
label { display: block; margin-bottom: 6px; font-weight: 600; }
input { display: block; width: 100%; padding: 10px 12px; border: 1px solid #b9c5da; border-radius: 8px; }
button { margin-top: 14px; padding: 10px 16px; border: 0; border-radius: 8px; background: #315cbd; color: white; cursor: pointer; }`),
    explain: [
      { token: '<label for="email">', title: "A label connected to its input", description: "for matches the input's ID. Try clicking Email address in the preview: the browser moves focus into the field.", selector: "label" },
      { token: '<input type="text">', title: "A text field", description: "input is a void element. id links it to its label, name identifies submitted data, and type selects the control's behavior.", selector: "input" },
      { token: '<button type="button">', title: "A practice button", description: "type=button does not submit this practice form. No data is sent. A submit button would ask the browser to validate and submit a form.", selector: "button" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label",
    challenge: {
      prompt: 'Make the email input type="email" and required. Keep its id, name, and the connected label.',
      hint: 'Use <input … type="email" required>. required is a Boolean attribute: its presence turns the requirement on.',
      solution: {
        html: `<article class="card">
  <h1>Join the reading club</h1>
  <p>A new recommendation every Friday.</p>
  <form action="#" method="get">
    <label for="email">Email address</label>
    <input id="email" name="email" type="email" placeholder="you@example.com" required>
    <button type="button">Join the club</button>
  </form>
</article>`,
        css: withSurface(`form { margin-top: 20px; }
label { display: block; margin-bottom: 6px; font-weight: 600; }
input { display: block; width: 100%; padding: 10px 12px; border: 1px solid #b9c5da; border-radius: 8px; }
button { margin-top: 14px; padding: 10px 16px; border: 0; border-radius: 8px; background: #315cbd; color: white; cursor: pointer; }`)
      },
      checks: [
        { type: "attribute", selector: "#email", name: "type", value: "email", label: "The field accepts an email address" },
        { type: "exists", selector: "input#email[required]", minCount: 1, label: "The email field is required" },
        { type: "exists", selector: 'label[for="email"]', minCount: 1, label: "The visible label is still connected" },
        { type: "attribute", selector: "#email", name: "name", value: "email", label: "The field keeps its data name" }
      ]
    }
  }),
  entry({
    id: "tables", title: "Rows, cells & table headings", group: "Content",
    summary: "Use a table for related data, with a caption, column headings, and rows.",
    concepts: [
      "Tables describe data relationships. Use CSS flex or grid for general page layout.",
      "tr creates a row; th identifies a header cell; td contains ordinary data.",
      "caption names the table. scope=\"col\" says a heading labels its column."
    ],
    html: `<article class="card">
  <h1>A week of learning</h1>
  <table>
    <caption>Learning schedule</caption>
    <thead>
      <tr><th scope="col">Day</th><th scope="col">Topic</th></tr>
    </thead>
    <tbody>
      <tr><td>Monday</td><td>HTML tags</td></tr>
      <tr><td>Tuesday</td><td>CSS colors</td></tr>
    </tbody>
  </table>
</article>`,
    css: withSurface(`table { width: 100%; border-collapse: collapse; margin-top: 20px; }
caption { text-align: left; color: #67758d; margin-bottom: 10px; }
th, td { text-align: left; padding: 12px; border-bottom: 1px solid #dfe6f1; }
th { background: #eaf0ff; color: #315cbd; }`),
    explain: [
      { token: "<caption>", title: "A title for the table", description: "caption describes what these rows represent. Its placement inside table connects it to the data.", selector: "caption" },
      { token: '<th scope="col">', title: "A column heading", description: "These th cells label Day and Topic. scope helps assistive technology associate a heading with the cells in its column.", selector: "th" },
      { token: "<tbody><tr><td>", title: "Rows of data", description: "tbody groups the data rows. Each tr contains two td cells, keeping days and topics aligned.", selector: "tbody tr" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/table",
    challenge: {
      prompt: "Add a third row inside tbody: Wednesday in the first cell and Browser preview in the second.",
      hint: "A row is <tr><td>…</td><td>…</td></tr>. Place it after Tuesday's row.",
      solution: {
        html: `<article class="card">
  <h1>A week of learning</h1>
  <table>
    <caption>Learning schedule</caption>
    <thead>
      <tr><th scope="col">Day</th><th scope="col">Topic</th></tr>
    </thead>
    <tbody>
      <tr><td>Monday</td><td>HTML tags</td></tr>
      <tr><td>Tuesday</td><td>CSS colors</td></tr>
      <tr><td>Wednesday</td><td>Browser preview</td></tr>
    </tbody>
  </table>
</article>`,
        css: withSurface(`table { width: 100%; border-collapse: collapse; margin-top: 20px; }
caption { text-align: left; color: #67758d; margin-bottom: 10px; }
th, td { text-align: left; padding: 12px; border-bottom: 1px solid #dfe6f1; }
th { background: #eaf0ff; color: #315cbd; }`)
      },
      checks: [
        { type: "exists", selector: "tbody > tr", minCount: 3, label: "The table has three data rows" },
        { type: "text", selector: "tbody tr:nth-child(3) td:first-child", equals: "Wednesday", label: "The third row starts with Wednesday" },
        { type: "text", selector: "tbody tr:nth-child(3) td:nth-child(2)", equals: "Browser preview", label: "The new row includes its topic" },
        { type: "exists", selector: 'thead th[scope="col"]', minCount: 2, label: "The column headings are retained" }
      ]
    }
  }),
  entry({
    id: "details", title: "Interaction with HTML alone", group: "Interaction",
    summary: "Make a disclosure that opens and closes with the browser's built-in behavior.",
    concepts: [
      "details creates an expandable disclosure. summary provides its visible, interactive label.",
      "The browser handles mouse and keyboard interaction without any JavaScript.",
      "open is a Boolean attribute: if present, the details content starts expanded. open=\"false\" still counts as present."
    ],
    html: `<article class="card">
  <h1>A little curiosity</h1>
  <p>Click the question to reveal the answer.</p>
  <details>
    <summary>Can HTML be interactive?</summary>
    <p>Yes! The browser opens and closes this answer for you.</p>
  </details>
</article>`,
    css: withSurface(`details { margin-top: 20px; padding: 16px; background: #eaf0ff; border-radius: 10px; }
summary { cursor: pointer; color: #315cbd; font-weight: 600; }
details p { margin-top: 12px; }`),
    explain: [
      { token: "<details>", title: "A disclosure control", description: "details keeps its extra content collapsed until opened. The browser supplies the toggle behavior.", selector: "details" },
      { token: "<summary>", title: "The clickable question", description: "summary is the first child of details and remains visible when collapsed. Focus it and press Enter or Space to toggle it.", selector: "summary" },
      { token: "<p> inside details", title: "The revealed content", description: "This paragraph stays in the document but is only rendered when its details element is open.", selector: "details p" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details",
    challenge: {
      prompt: "Make the disclosure start open and change its summary to What did I learn?.",
      hint: "Add open to the details opening tag, then edit the text inside summary.",
      solution: {
        html: `<article class="card">
  <h1>A little curiosity</h1>
  <p>Click the question to reveal the answer.</p>
  <details open>
    <summary>What did I learn?</summary>
    <p>Yes! The browser opens and closes this answer for you.</p>
  </details>
</article>`,
        css: withSurface(`details { margin-top: 20px; padding: 16px; background: #eaf0ff; border-radius: 10px; }
summary { cursor: pointer; color: #315cbd; font-weight: 600; }
details p { margin-top: 12px; }`)
      },
      checks: [
        { type: "exists", selector: "details[open]", minCount: 1, label: "The disclosure starts expanded" },
        { type: "text", selector: "details > summary", equals: "What did I learn?", label: "The summary has its new question" },
        { type: "exists", selector: "details > p", minCount: 1, label: "The answer remains inside the disclosure" }
      ]
    }
  })
];

const cssLessons = [
  entry({
    id: "selectors", title: "Choose what to style", group: "Foundations",
    summary: "Connect a CSS selector to the exact HTML elements it changes.",
    concepts: [
      "A rule has a selector and declarations: .note { color: blue; }. Each declaration ends with a semicolon.",
      "p selects every paragraph; .note selects elements with class=\"note\"; #welcome selects one ID.",
      "A descendant selector such as .card p matches paragraphs anywhere inside .card."
    ],
    html: `<article class="card">
  <h1 id="welcome">Hello, selectors</h1>
  <p class="note">This paragraph has the note class.</p>
  <p>This paragraph does not.</p>
</article>`,
    css: withSurface(`p { color: #67758d; }
.note { color: #315cbd; background: #eaf0ff; padding: 12px; border-radius: 8px; }
#welcome { letter-spacing: -1px; }`),
    explain: [
      { token: "p { … }", title: "A type selector", description: "Both paragraphs match p. This rule sets a shared text color before the class rule gives the note its more specific color.", selector: "p", property: "color" },
      { token: ".note { … }", title: "A class selector", description: "Only the paragraph with class=note matches this selector. Its background and padding make the match visible.", selector: ".note", property: "background-color" },
      { token: "#welcome { … }", title: "An ID selector", description: "This rule targets the heading with id=welcome and changes the spacing between its letters.", selector: "#welcome", property: "letter-spacing" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Basic_selectors",
    challenge: {
      prompt: "Change only the .note paragraph's text color to #166534 and its background to #dcfce7. Keep the other paragraph gray.",
      hint: "Edit the declarations inside .note. A rule on p would change both paragraphs.",
      solution: {
        html: `<article class="card">
  <h1 id="welcome">Hello, selectors</h1>
  <p class="note">This paragraph has the note class.</p>
  <p>This paragraph does not.</p>
</article>`,
        css: withSurface(`p { color: #67758d; }
.note { color: #166534; background: #dcfce7; padding: 12px; border-radius: 8px; }
#welcome { letter-spacing: -1px; }`)
      },
      checks: [
        { type: "style", selector: ".note", property: "color", value: "rgb(22, 101, 52)", label: "The note text is green" },
        { type: "style", selector: ".note", property: "background-color", value: "rgb(220, 252, 231)", label: "The note background is light green" },
        { type: "style", selector: "p:not(.note)", property: "color", value: "rgb(103, 117, 141)", label: "The other paragraph keeps its gray text" }
      ]
    }
  }),
  entry({
    id: "colors", title: "Text, backgrounds & borders", group: "Appearance",
    summary: "Paint different parts of an element and see which CSS property controls each part.",
    concepts: [
      "color sets the foreground text color; background-color fills an element's background.",
      "Colors can use names, hex values such as #315cbd, or functions such as rgb(49, 92, 189).",
      "border combines width, style, and color. Use enough contrast to keep text easy to read."
    ],
    html: `<article class="card">
  <h1>Your next adventure</h1>
  <p>A fresh start is one small step away.</p>
  <button class="action" type="button">Let's begin</button>
</article>`,
    css: withSurface(`.action {
  margin-top: 16px;
  padding: 12px 20px;
  color: white;
  background-color: #315cbd;
  border: 2px solid #244894;
  border-radius: 10px;
}`),
    explain: [
      { token: "color: white", title: "The text color", description: "color paints the button's letters. It does not fill the button's surface.", selector: ".action", property: "color" },
      { token: "background-color: #315cbd", title: "The background", description: "background-color fills the area behind the text and padding.", selector: ".action", property: "background-color" },
      { token: "border: 2px solid #244894", title: "An outline around the box", description: "The border is 2 pixels thick with a solid line and its own color, independent of the text and background.", selector: ".action", property: "border-top-color" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color",
    challenge: {
      prompt: "Give .action a #7c3aed background, white text, and a 2px solid #5b21b6 border.",
      hint: "Set background-color, color, and border inside the same .action rule.",
      solution: {
        html: `<article class="card">
  <h1>Your next adventure</h1>
  <p>A fresh start is one small step away.</p>
  <button class="action" type="button">Let's begin</button>
</article>`,
        css: withSurface(`.action { margin-top: 16px; padding: 12px 20px; color: white; background-color: #7c3aed; border: 2px solid #5b21b6; border-radius: 10px; }`)
      },
      checks: [
        { type: "style", selector: ".action", property: "background-color", value: "rgb(124, 58, 237)", label: "The button background is purple" },
        { type: "style", selector: ".action", property: "color", value: "rgb(255, 255, 255)", label: "The text stays white" },
        { type: "style", selector: ".action", property: "border-top-color", value: "rgb(91, 33, 182)", label: "The border uses the darker purple" },
        { type: "style", selector: ".action", property: "border-top-width", value: "2px", label: "The border is 2 pixels wide" },
        { type: "style", selector: ".action", property: "border-top-style", value: "solid", label: "The border is solid" }
      ]
    }
  }),
  entry({
    id: "typography", title: "Make your words readable", group: "Appearance",
    summary: "Change font size, weight, and line spacing without changing the HTML's meaning.",
    concepts: [
      "font-family chooses a typeface. List fallbacks in case the first font is unavailable.",
      "font-size controls text size; font-weight controls its thickness.",
      "A unitless line-height is a multiplier of each element's font size, making line spacing scale with the text."
    ],
    html: `<article class="card reading">
  <p class="category">THE DAILY NOTE</p>
  <h1>Make room for a good idea.</h1>
  <p class="description">A few quiet minutes can give your thoughts the space they need. Read, notice, and write something small.</p>
</article>`,
    css: withSurface(`.reading { font-family: Georgia, serif; }
.category { font-family: system-ui, sans-serif; font-size: 12px; letter-spacing: 2px; color: #67758d; }
.reading h1 { font-size: 28px; font-weight: 400; }
.description { font-size: 16px; line-height: 1.5; }`),
    explain: [
      { token: "font-family: Georgia, serif", title: "A font and its fallback", description: "The article uses Georgia where available, otherwise a generic serif font. Descendants inherit the family unless they override it.", selector: ".reading", property: "font-family" },
      { token: "font-size: 28px", title: "The heading size", description: "This changes the heading's rendered letters while h1 keeps its meaning as the main heading.", selector: ".reading h1", property: "font-size" },
      { token: "line-height: 1.5", title: "Room between lines", description: "At a font size of 16px, a multiplier of 1.5 produces a 24px line height. Watch the paragraph grow as you increase it.", selector: ".description", property: "line-height" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font",
    challenge: {
      prompt: "Set .reading h1 to 32px and weight 700. Set .description to 18px with line-height: 1.6.",
      hint: "Use font-size and font-weight for the heading; the paragraph's 18px × 1.6 becomes a 28.8px line height.",
      solution: {
        html: `<article class="card reading">
  <p class="category">THE DAILY NOTE</p>
  <h1>Make room for a good idea.</h1>
  <p class="description">A few quiet minutes can give your thoughts the space they need. Read, notice, and write something small.</p>
</article>`,
        css: withSurface(`.reading { font-family: Georgia, serif; }
.category { font-family: system-ui, sans-serif; font-size: 12px; letter-spacing: 2px; color: #67758d; }
.reading h1 { font-size: 32px; font-weight: 700; }
.description { font-size: 18px; line-height: 1.6; }`)
      },
      checks: [
        { type: "style", selector: ".reading h1", property: "font-size", value: "32px", label: "The heading is 32 pixels" },
        { type: "style", selector: ".reading h1", property: "font-weight", value: "700", label: "The heading is bold" },
        { type: "style", selector: ".description", property: "font-size", value: "18px", label: "The paragraph is 18 pixels" },
        { type: "style", selector: ".description", property: "line-height", value: "28.8px", label: "The paragraph uses the 1.6 line-height multiplier" }
      ]
    }
  }),
  entry({
    id: "box-model", title: "Inside and outside the box", group: "Layout",
    summary: "See the difference between content, padding, border, and margin.",
    concepts: [
      "Padding creates space inside the border, between the content and the edge.",
      "Margin creates space outside the border. Background color does not paint the margin.",
      "With box-sizing: border-box, a declared width includes the content, padding, and border."
    ],
    html: `<main class="box-stage">
  <h1>Every element has a box</h1>
  <div class="sample-box">
    <strong>The content</strong>
    <p>Padding gives these words room to breathe.</p>
  </div>
  <p class="neighbor">I am the next element.</p>
</main>`,
    css: withSurface(`.box-stage { max-width: 480px; margin: auto; }
.sample-box {
  width: 260px;
  box-sizing: border-box;
  padding: 16px;
  border: 4px solid #315cbd;
  margin: 20px 0;
  background: #eaf0ff;
}
.neighbor { background: white; padding: 8px; }`),
    explain: [
      { token: "padding: 16px", title: "Space within the border", description: "The blue surface includes the 16px padding around the text. Increasing padding pushes the text inward.", selector: ".sample-box", property: "padding-top" },
      { token: "border: 4px solid …", title: "The visible boundary", description: "The dark blue border sits between padding and margin and contributes to this box's width.", selector: ".sample-box", property: "border-top-width" },
      { token: "margin: 20px 0", title: "Space outside the border", description: "There is 20px of vertical margin above and below the sample, separating it from neighboring content.", selector: ".sample-box", property: "margin-bottom" },
      { token: "box-sizing: border-box", title: "A width that includes the edges", description: "The total bordered box stays 260px wide. Its padding and border are taken out of the space available for its content.", selector: ".sample-box", property: "box-sizing" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model",
    challenge: {
      prompt: "Give .sample-box 24px of padding, 32px of bottom margin, and a 6px border. Keep its width at 260px and border-box sizing.",
      hint: "Edit padding and border, then add margin-bottom: 32px after the margin shorthand.",
      solution: {
        html: `<main class="box-stage">
  <h1>Every element has a box</h1>
  <div class="sample-box">
    <strong>The content</strong>
    <p>Padding gives these words room to breathe.</p>
  </div>
  <p class="neighbor">I am the next element.</p>
</main>`,
        css: withSurface(`.box-stage { max-width: 480px; margin: auto; }
.sample-box { width: 260px; box-sizing: border-box; padding: 24px; border: 6px solid #315cbd; margin: 20px 0; margin-bottom: 32px; background: #eaf0ff; }
.neighbor { background: white; padding: 8px; }`)
      },
      checks: [
        { type: "style", selector: ".sample-box", property: "padding-top", value: "24px", label: "The box has 24 pixels of inner space" },
        { type: "style", selector: ".sample-box", property: "margin-bottom", value: "32px", label: "The box has 32 pixels of space below it" },
        { type: "style", selector: ".sample-box", property: "border-top-width", value: "6px", label: "The border is 6 pixels wide" },
        { type: "style", selector: ".sample-box", property: "width", value: "260px", label: "The bordered box keeps its 260-pixel width" },
        { type: "style", selector: ".sample-box", property: "box-sizing", value: "border-box", label: "Padding and border are included in the width" }
      ]
    }
  }),
  entry({
    id: "display", title: "Blocks, inline boxes & hidden content", group: "Layout",
    summary: "Change how elements take up space in the page's normal flow.",
    concepts: [
      "In normal flow, a block box starts on a new line; an inline box flows alongside text.",
      "inline-block flows inline while allowing a box width and height.",
      "display: none removes the element's box and its descendants from layout and the accessibility tree."
    ],
    html: `<article class="card">
  <h1>One word, a different layout</h1>
  <p>These <span class="highlight">small details</span> change how a sentence flows.</p>
  <span class="chip">HTML</span>
  <span class="chip">CSS</span>
  <p class="secret">You found the hidden note.</p>
</article>`,
    css: withSurface(`.highlight { display: inline; background: #fff0d7; color: #805118; }
.chip { display: inline-block; padding: 6px 12px; margin-top: 12px; background: #eaf0ff; border-radius: 8px; }
.secret { display: none; }`),
    explain: [
      { token: "display: inline", title: "Flowing inside a sentence", description: "The highlight stays on the surrounding paragraph's line when space allows. Change it to block to make it occupy its own line.", selector: ".highlight", property: "display" },
      { token: "display: inline-block", title: "An inline box", description: "These chips can sit next to each other and keep their padding and rectangular box shapes.", selector: ".chip", property: "display" },
      { token: "display: none", title: "No rendered box", description: "The secret paragraph remains in the HTML but contributes no box to the preview. Change this property to reveal it.", selector: ".secret", property: "display" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/display",
    challenge: {
      prompt: "Set .highlight to display: block and reveal .secret with display: block. Keep the chips inline-block.",
      hint: "Edit the display declaration in each of those two rules, then watch the paragraph's line breaks change.",
      solution: {
        html: `<article class="card">
  <h1>One word, a different layout</h1>
  <p>These <span class="highlight">small details</span> change how a sentence flows.</p>
  <span class="chip">HTML</span>
  <span class="chip">CSS</span>
  <p class="secret">You found the hidden note.</p>
</article>`,
        css: withSurface(`.highlight { display: block; background: #fff0d7; color: #805118; }
.chip { display: inline-block; padding: 6px 12px; margin-top: 12px; background: #eaf0ff; border-radius: 8px; }
.secret { display: block; }`)
      },
      checks: [
        { type: "style", selector: ".highlight", property: "display", value: "block", label: "The highlight occupies a block" },
        { type: "style", selector: ".secret", property: "display", value: "block", label: "The secret paragraph is rendered" },
        { type: "style", selector: ".chip", property: "display", value: "inline-block", label: "The chips stay inline-block" }
      ]
    }
  }),
  entry({
    id: "flexbox", title: "Arrange a row with Flexbox", group: "Layout",
    summary: "Use a flex container to align its direct children and control the space between them.",
    concepts: [
      "display: flex makes the container's direct children flex items.",
      "For the default row direction, justify-content distributes items horizontally and align-items aligns them vertically.",
      "gap adds space between items. flex-wrap: wrap lets items move to another line when needed."
    ],
    html: `<article class="card">
  <h1>A small tool shelf</h1>
  <div class="tool-row">
    <div class="tool">HTML</div>
    <div class="tool tall">CSS</div>
    <div class="tool">JS</div>
  </div>
</article>`,
    css: withSurface(`.tool-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin-top: 20px;
  background: #edf1f8;
  border-radius: 12px;
}
.tool { padding: 12px 16px; color: #315cbd; background: white; border-radius: 8px; font-weight: 600; }
.tall { padding-top: 28px; padding-bottom: 28px; }`),
    explain: [
      { token: "display: flex", title: "A container for flex items", description: "The three direct .tool children become flex items. The flex declarations belong on their .tool-row parent.", selector: ".tool-row", property: "display" },
      { token: "justify-content: flex-start", title: "Placement along the row", description: "The items begin at the start of the main axis. Try center to put the group in the horizontal center.", selector: ".tool-row", property: "justify-content" },
      { token: "align-items: flex-start", title: "Alignment across the row", description: "The shorter items align with the top of the tall CSS item. center would line up their vertical centers.", selector: ".tool-row", property: "align-items" },
      { token: "gap: 12px", title: "Space between neighbors", description: "gap creates consistent separation between flex items without adding space at the container's edges.", selector: ".tool-row", property: "gap" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox",
    challenge: {
      prompt: "Center the tool group along the row, center the items vertically, and set their gap to 16px.",
      hint: "Use justify-content: center, align-items: center, and gap: 16px on .tool-row.",
      solution: {
        html: `<article class="card">
  <h1>A small tool shelf</h1>
  <div class="tool-row">
    <div class="tool">HTML</div>
    <div class="tool tall">CSS</div>
    <div class="tool">JS</div>
  </div>
</article>`,
        css: withSurface(`.tool-row { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 16px; padding: 16px; margin-top: 20px; background: #edf1f8; border-radius: 12px; }
.tool { padding: 12px 16px; color: #315cbd; background: white; border-radius: 8px; font-weight: 600; }
.tall { padding-top: 28px; padding-bottom: 28px; }`)
      },
      checks: [
        { type: "style", selector: ".tool-row", property: "display", value: "flex", label: "The tools use a flex container" },
        { type: "style", selector: ".tool-row", property: "justify-content", value: "center", label: "The tool group is centered along the row" },
        { type: "style", selector: ".tool-row", property: "align-items", value: "center", label: "The items are centered vertically" },
        { type: "style", selector: ".tool-row", property: "column-gap", value: "16px", label: "Neighboring items have a 16-pixel gap" }
      ]
    }
  }),
  entry({
    id: "grid", title: "Build rows and columns", group: "Layout",
    summary: "Place a set of cards in a two-dimensional grid with repeating columns.",
    concepts: [
      "display: grid makes a container's direct children grid items.",
      "grid-template-columns defines the columns. repeat(2, 100px) means two columns of 100 pixels each.",
      "Items fill cells in source order by default. gap separates rows and columns. fr units can divide available space."
    ],
    html: `<article class="card">
  <h1>A colorful collection</h1>
  <div class="tile-grid">
    <div class="tile">01 · Plan</div>
    <div class="tile">02 · Build</div>
    <div class="tile">03 · Test</div>
    <div class="tile">04 · Share</div>
  </div>
</article>`,
    css: withSurface(`.tile-grid {
  display: grid;
  grid-template-columns: repeat(2, 100px);
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}
.tile { padding: 20px 10px; background: #eaf0ff; color: #315cbd; border-radius: 10px; text-align: center; font-size: 14px; }
.tile:nth-child(2n) { color: #805118; background: #fff0d7; }`),
    explain: [
      { token: "display: grid", title: "The grid container", description: "The four tiles become grid items. Unlike a simple row, this layout organizes items across columns and rows.", selector: ".tile-grid", property: "display" },
      { token: "repeat(2, 100px)", title: "Two column tracks", description: "This is a short way to write 100px 100px. The first two items fill row one, then the next two fill row two.", selector: ".tile-grid", property: "grid-template-columns" },
      { token: "gap: 10px", title: "Gutters in both directions", description: "This single value sets both the horizontal gap between columns and the vertical gap between rows.", selector: ".tile-grid", property: "gap" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids",
    challenge: {
      prompt: "Keep two columns, make each one 120px wide, and set both the row and column gaps to 16px.",
      hint: "Use grid-template-columns: repeat(2, 120px) and gap: 16px on .tile-grid.",
      solution: {
        html: `<article class="card">
  <h1>A colorful collection</h1>
  <div class="tile-grid">
    <div class="tile">01 · Plan</div>
    <div class="tile">02 · Build</div>
    <div class="tile">03 · Test</div>
    <div class="tile">04 · Share</div>
  </div>
</article>`,
        css: withSurface(`.tile-grid { display: grid; grid-template-columns: repeat(2, 120px); gap: 16px; justify-content: center; margin-top: 20px; }
.tile { padding: 20px 10px; background: #eaf0ff; color: #315cbd; border-radius: 10px; text-align: center; font-size: 14px; }
.tile:nth-child(2n) { color: #805118; background: #fff0d7; }`)
      },
      checks: [
        { type: "style", selector: ".tile-grid", property: "display", value: "grid", label: "The tiles use grid layout" },
        { type: "style", selector: ".tile-grid", property: "grid-template-columns", value: "120px 120px", label: "There are two 120-pixel columns" },
        { type: "style", selector: ".tile-grid", property: "column-gap", value: "16px", label: "The columns have a 16-pixel gap" },
        { type: "style", selector: ".tile-grid", property: "row-gap", value: "16px", label: "The rows have a 16-pixel gap" }
      ]
    }
  }),
  entry({
    id: "responsive", title: "Adapt to the browser width", group: "Layout",
    summary: "Use flexible sizing and a media query to make a card work on narrow and wide screens.",
    concepts: [
      "width: 100% uses the parent's available width; max-width stops the card from becoming too wide.",
      "A media query applies its rules only when its condition matches the preview's viewport.",
      "@media (max-width: 480px) targets viewports up to 480 CSS pixels. Resize the preview to observe its changes."
    ],
    html: `<article class="responsive-card">
  <p class="category">A CARD FOR EVERY SCREEN</p>
  <h1>Good design makes room.</h1>
  <p>This card grows with the available space, then stops at a comfortable width.</p>
  <div class="screen-note">Try the narrow and wide browser previews.</div>
</article>`,
    css: withSurface(`.responsive-card {
  width: 100%;
  max-width: 520px;
  margin: auto;
  padding: 28px;
  background: white;
  border: 1px solid #dfe6f1;
  border-radius: 16px;
}
.responsive-card h1 { font-size: 32px; line-height: 1.3; }
.category { color: #315cbd; font-size: 11px; letter-spacing: 1px; }
.screen-note { margin-top: 20px; padding: 12px; background: #eaf0ff; border-radius: 8px; font-size: 14px; }
@media (max-width: 480px) {
  .responsive-card { padding: 16px; }
  .responsive-card h1 { font-size: 24px; }
}`),
    explain: [
      { token: "width: 100%", title: "A flexible width", description: "The card uses the available width instead of forcing a fixed width that could overflow a narrow screen.", selector: ".responsive-card", property: "width" },
      { token: "max-width: 520px", title: "A comfortable upper limit", description: "The card stops growing at 520px. Centered automatic margins share any leftover horizontal space.", selector: ".responsive-card", property: "max-width" },
      { token: "@media (max-width: 480px)", title: "Styles for a narrow viewport", description: "At widths of 480px or less, the card's padding becomes 16px and its heading becomes 24px. The wider preview uses the earlier values.", selector: ".responsive-card h1", property: "font-size" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design",
    challenge: {
      prompt: "Limit .responsive-card to 420px and set its h1 line-height to 1.2. Keep the narrow-screen media query, then compare preview sizes.",
      hint: "Change max-width in the main card rule and line-height in the main heading rule. A unitless 1.2 scales with both heading sizes.",
      solution: {
        html: `<article class="responsive-card">
  <p class="category">A CARD FOR EVERY SCREEN</p>
  <h1>Good design makes room.</h1>
  <p>This card grows with the available space, then stops at a comfortable width.</p>
  <div class="screen-note">Try the narrow and wide browser previews.</div>
</article>`,
        css: withSurface(`.responsive-card { width: 100%; max-width: 420px; margin: auto; padding: 28px; background: white; border: 1px solid #dfe6f1; border-radius: 16px; }
.responsive-card h1 { font-size: 32px; line-height: 1.2; }
.category { color: #315cbd; font-size: 11px; letter-spacing: 1px; }
.screen-note { margin-top: 20px; padding: 12px; background: #eaf0ff; border-radius: 8px; font-size: 14px; }
@media (max-width: 480px) {
  .responsive-card { padding: 16px; }
  .responsive-card h1 { font-size: 24px; }
}`)
      },
      checks: [
        { type: "style", selector: ".responsive-card", property: "max-width", value: "420px", label: "The card's maximum width is 420 pixels" },
        // Ratio compares computed line-height with computed font-size at any viewport.
        { type: "style", selector: ".responsive-card h1", property: "line-height", ratioTo: "font-size", value: 1.2, label: "The heading line height scales to 1.2 times its font size" }
      ]
    }
  }),
  entry({
    id: "cascade", title: "Which style wins?", group: "Foundations",
    summary: "Observe inheritance, selector specificity, and rule order when styles overlap.",
    concepts: [
      "Inherited properties such as color pass from a parent to a child that has no competing value of its own.",
      "For these normal rules in the same origin and layer, a class selector is more specific than a type selector.",
      "When such rules have equal specificity, the declaration written later wins. The full cascade also considers origin, importance, and layers."
    ],
    html: `<article class="card cascade-card">
  <h1>The browser decides</h1>
  <p class="message">I match both p and .message.</p>
  <p class="plain">I follow the paragraph rule.</p>
  <span>I inherit the article's color.</span>
</article>`,
    css: withSurface(`.cascade-card { color: #805118; }
p { color: #67758d; }
.message { color: #315cbd; }
.message { color: #7c3aed; }`),
    explain: [
      { token: ".cascade-card { color: … }", title: "A value children may inherit", description: "The span has no color declaration of its own, so it inherits the article's brown color. Paragraphs have their own matching rules.", selector: ".cascade-card > span", property: "color" },
      { token: "p versus .message", title: "Class specificity", description: "The message matches both rules. Under the conditions in this example, .message's class specificity beats p's type specificity.", selector: ".message", property: "color" },
      { token: "The second .message rule", title: "A later rule breaks the tie", description: "The two .message selectors have equal specificity. The later purple declaration wins over the earlier blue one.", selector: ".message", property: "color" }
    ],
    source: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Handling_conflicts",
    challenge: {
      prompt: "Add a final .message rule with color: #166534. Make the article's inherited color #315cbd while keeping the plain paragraph gray.",
      hint: "Edit .cascade-card and append .message { color: #166534; } after the existing message rules.",
      solution: {
        html: `<article class="card cascade-card">
  <h1>The browser decides</h1>
  <p class="message">I match both p and .message.</p>
  <p class="plain">I follow the paragraph rule.</p>
  <span>I inherit the article's color.</span>
</article>`,
        css: withSurface(`.cascade-card { color: #315cbd; }
p { color: #67758d; }
.message { color: #315cbd; }
.message { color: #7c3aed; }
.message { color: #166534; }`)
      },
      checks: [
        { type: "style", selector: ".message", property: "color", value: "rgb(22, 101, 52)", label: "The final message rule makes the message green" },
        { type: "style", selector: ".plain", property: "color", value: "rgb(103, 117, 141)", label: "The plain paragraph keeps its own gray color" },
        { type: "style", selector: ".cascade-card > span", property: "color", value: "rgb(49, 92, 189)", label: "The span inherits the article's blue color" }
      ]
    }
  })
];

export const webLessons = { html: htmlLessons, css: cssLessons };

export const webSessions = {
  html: {
    name: "HTML", mark: "<>", extension: "html",
    description: "Learn tags, attributes, and page structure by editing HTML and watching the browser render it."
  },
  css: {
    name: "CSS", mark: "#", extension: "css",
    description: "Learn selectors, styles, and layouts by changing CSS and seeing the browser update."
  }
};

export function getWebLesson(language, id) {
  if (!Object.hasOwn(webLessons, language)) return null;
  return webLessons[language].find(lesson => lesson.id === id) || null;
}

export function filterWebLessons(entries, query = "", group = "All") {
  const term = String(query).trim().toLowerCase();
  return entries.filter(lesson => {
    const matchesGroup = !group || String(group).toLowerCase() === "all" || lesson.group === group;
    const searchable = [lesson.title, lesson.group, lesson.summary, ...lesson.concepts, ...lesson.explain.map(item => [item.token, item.title, item.description, item.selector, item.property].filter(Boolean).join(" "))].join(" ").toLowerCase();
    return matchesGroup && (!term || searchable.includes(term));
  });
}

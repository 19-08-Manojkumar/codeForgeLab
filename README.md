# CodeForge Lab

A Next.js App Router practice website with Supabase authentication and account-owned learning progress for JavaScript, Python, Java, C, HTML, and CSS. The browser calls Next.js API routes; PostgreSQL saves learning state with Row Level Security and atomic, idempotent updates. Guests can learn and save progress on their device. Each programming language opens a four-path hub: Methods & functions, Programming basics, Interview preparation, and Coding problems. HTML and CSS have matching four-path hubs for the explorer, basics, interview preparation, and browser coding challenges. Their explorer retains ten lessons: a new first explorer followed by the original nine visual lessons.

The planned public domain is `https://codeforge-lab.vercel.app`. Shared branding covers the header, footer, welcome dialog, page title, and social metadata. After the six home course cards, Explore other areas links to [DataForge DB](https://dataforge-db.vercel.app/) for SQL/NoSQL and [Data Science Forge](https://data-science-forge.vercel.app/) for data science and analytics. These external learning cards open in a new tab. Domain provisioning and a Vercel deployment are separate from the branding update. Legacy browser-storage keys are retained so existing profiles and quiz history continue to load.

## GitHub repository

Use the `codeforgelab` folder as the repository root. It is a standalone project: all application code, curriculum, quizzes, assets, tests, and database migrations are inside this folder. Curriculum JSON drafts, quiz proposals, and validation output in the parent workspace are not required to build or run the app. The maintained learning content is in `lib/`.

Create your GitHub repository, open a terminal inside `codeforgelab`, and push from there. Keep the existing Git history. Git automatically excludes `node_modules/`, build output, local test artifacts, and `.env.local`; include `.env.example` as the configuration template.

When importing this repository into Vercel, choose Next.js and leave Root Directory as `./`, with `package.json` at the repository root. Use `npm run build` and leave Output Directory at its framework default. If you instead upload a parent repository containing a `codeforgelab` subfolder, set Root Directory to `codeforgelab`. Follow [Supabase setup](docs/supabase-setup.md) for environment variables, database tables, and authentication URLs.

## Run locally

```sh
npm install
npm run dev
```

For a production build:

```sh
npm run build
npm start
```

Open http://localhost:3000. Follow [Supabase setup](docs/supabase-setup.md) to create tables, set public environment variables, configure authentication, deploy on Vercel, and migrate existing records. Until configured, lessons use device-local guest storage. `npm run build` produces normal Next.js output with `/api/learning`, `/api/auth/session`, and confirmation/recovery routes. The existing private Sites deployment and D1 data remain separately available; its Worker/schema files are retained for migration and reference.

## Learning flow

On the first learning visit, an optional welcome form asks for a name, optional age, study or work background, domain, and learning goal. A saved profile personalizes the welcome, correct-answer feedback, retry encouragement, and quiz results. The profile and welcome dismissal are saved to the Supabase account or on this device for guests. Existing session profiles are migrated on first load. Skip for now dismisses the welcome without clearing an existing account profile. Use the profile icon or Edit details to update or clear the profile without resetting the active quiz. Age does not change the questions or difficulty.

Choose a language, then a practice path. Methods & functions has 25 animated, editable entries per language. Java/C animations appear in the Learn step alongside the original worked example and output predictions. Programming basics contains eight topic lessons per language. Interview preparation contains 16 questions per language, model answers, a self-review checklist, follow-up questions, and links back to the related lesson. Coding problems contains six exercises each for JavaScript/Python and eight each for Java/C, totaling 28 guided problems.

Each new topic uses Teach, Learn, and Practice steps. Read the concept, trace a worked example, then predict output, explain an interview answer, or complete a missing code expression. Search and topic filters work within every path. Completed practice, bookmarks, recent quiz scores, edited method configurations, and coding drafts are saved automatically across reloads and visits. Continue learning opens the latest topic and learning step. The save status reports loading, saving, success, or an unavailable service with a retry action; pending account changes are queued on this device for retry across reloads when browser storage is available. Revealing a solution does not mark a problem solved. Guided expression checks preserve spaces within string literals and accept documented equivalent expressions. They do not compile or execute arbitrary programs; Java and C examples are curated references rather than installed compilers. Interview answers are self-reviewed, not automatically graded.

All 100 method animations separate reading the current value, evaluating an operation, committing the change, and returning the result. Filter shows the actual condition, kept and skipped indices, and the growing result. Accumulators expose before/after totals, searches stop at decisive values, strings show character transformations and matching pieces, and mutators keep return values separate from changed input. C memory examples expose destination bytes, overlap-safe moves, capacity and null terminators. Backward steps, a keyboard-accessible timeline, playback speed, pause, reset, and step history use deterministic snapshots. Editing values updates the code and resets playback; invalid values stop playback and show a specific explanation. Native models use bounded inputs: Java strings use UTF-16 indexing; C text uses printable ASCII and the C locale. They do not compile arbitrary Java/C programs. Pointer and reference results are labelled rather than presented as string values. Sorting and binary-search steps explain one valid strategy rather than promising the library's internal sequence.

The JavaScript/Python method path preserves five-question tests from different scenarios with shuffled choices. Python has eight built-ins, seven list methods, six string methods, and four dictionary methods. Each language's mixed method quiz generates 25 fresh questions. Java/C references include their language-specific syntax, return values, input behavior, official documentation, and printed output.

After a wrong answer, try once more or reveal the explanation. A second wrong attempt reveals the solution. Correct method quiz answers, output predictions, and guided coding answers trigger a dismissible code-themed popup: “Well done, Manoj!” uses the saved learner name, and “Well done!” praises anonymous learners. Quiz messages explain first tries, second tries, streaks, and perfect results. Popups close after five seconds, with Escape, or with the dismiss button. Editing a practice answer or leaving the exercise clears its popup; revealing an explanation or solution does not trigger one. Explanations remain after the popup closes. Motion effects respect reduced-motion preferences.

The home and language dashboards offer a daily session with one concept, three distinct curriculum output predictions, and one guided coding expression. Plans are deterministic by local calendar date and language, and five completion markers resume after reloads. Reveals do not complete practice. Daily correct predictions and coding expressions also update topic progress.

HTML and CSS daily sessions use a concept, three rendering exercises, and a final coding challenge. Each exercise grades the actual DOM and computed styles using the browser lesson's requirements. All six languages appear in the home daily selector. Web daily code uses dated drafts separate from ordinary topic edits, resumes the first unfinished step, and saves five completion markers without changing programming answer statistics. The browser basics and challenge paths reuse the original nine lessons; interview preparation provides nine questions per session with a model answer, checklist, follow-up, saved written explanation, and editable native example. Progress and bookmarks remain independent across paths.

Editable HTML/CSS files and guided programming expressions support Ctrl+/ (Cmd+/ on macOS) and a Comment / uncomment button. Selected lines use HTML comments, CSS block comments, Python # comments, or // comments for JavaScript/Java/C. Toggling preserves unselected code, indentation, and blank lines. Code comments in guided expressions are ignored during checking, while punctuation inside strings and Python floor division are preserved. Data-only experiment fields continue to accept their documented JSON or scalar values.

The mistake notebook captures first incorrect quiz attempts, output predictions, and coding expressions with explanations. Correct due reviews return after 1, 3, and 7 days; four successful due reviews mark a question reviewed. Extra same-day or early practice does not advance the schedule. The notebook keeps up to 100 recent questions, subject to a bounded Unicode-aware storage budget; cumulative answer statistics remain intact.

## Content and implementation

HTML and CSS use editable `index.html` and `styles.css` files alongside an automatically updating browser preview. Each lesson has Teach, Learn, and Practice steps, explanations of tags or CSS properties, an element inspector, a page structure list, and a challenge checked against the rendered DOM and computed styles. The preview width supports mobile, tablet, desktop, and fitting its panel; changing width updates responsive styles and inspection values. Both sessions save their drafts, progress, bookmarks, and resume step independently. Revealing a solution does not complete a lesson or overwrite a learner's saved draft. Daily programming predictions and the mistake notebook remain for JavaScript, Python, Java, and C.

The first HTML lesson lists 116 tags and embedded elements across 17 families. Headings opens individual h1–h6 examples with native browser defaults, and text, lists, forms, tables, media, and other families show each tag in its required context. The first CSS lesson groups 256 common standard properties into 13 topics, with 767 presets and a validated custom-value field. The inspector includes the selected property and can inspect generated content on pseudo-elements. Examples explain browser support and preview restrictions where relevant. Search matches tags, properties, and family names. The most recently selected example and its edits resume after reload; edits to other examples remain available while switching within the open explorer. HTML examples include 23 checked challenges; other explorer practice is a clearly labelled self-review. Completing either records the first lesson rather than adding hundreds of lessons to the session.

The live preview runs in an opaque-origin iframe with `sandbox="allow-scripts"`. Learner code is embedded as escaped data, parsed and sanitized before insertion, and rendered by the browser. A nonce-protected teaching script handles inspection and challenge checks. Learner scripts, event handlers, external resources, form submission, and link navigation are disabled; self-contained data images work. CSS remains native, including selectors, inheritance, media queries, Flexbox, and Grid. The editor limits each file to 12,000 characters. Browser defaults and HTML error recovery apply, so challenges check the actual resulting elements and styles rather than raw source strings.

- `app/web-workspace.jsx` and `app/web.css`: separate HTML/CSS learning sessions, responsive editors, live preview, tag/rule explanations, and inspection.
- `app/web-explorer.jsx`: searchable tag/property families, individual selection, and saved-example restoration.
- `lib/web-lessons.mjs`: the first explorer and original nine checked lessons for each session, with MDN sources.
- `lib/html-tags.mjs` and `lib/css-styles.mjs`: contextual tag and property examples, explanations, presets, and documentation references.
- `lib/web-practice.mjs` and `app/web-daily-practice.jsx`: four browser paths, interview content, and five-step rendering practice.
- `app/code-textarea.jsx` and `lib/code-comments.mjs`: shared keyboard/touch commenting and comment-aware guided expression checks.
- `lib/web-preview.mjs`: isolated browser rendering, DOM inspection, matched CSS rules, computed styles, and challenge checks.
- `tests/web-preview.test.mjs` and `tests/web-learning.test.mjs`: actual browser semantics, every lesson starter and solution, malicious markup isolation, responsive inspection, and durable web drafts.

Home, practice hubs, and learning pages use colorful shooting stars and code that travels across the viewport. Every language has its own palette. Home has diagonal meteor passes, hubs have wider fans, Teach has rising code, Learn has horizontal streams, Test reverses the direction, and Practice uses rising emerald accents. Switching topics resets the scene to Teach; background pause persists across navigation. The footer credits Manoj Kumar and links to his portfolio. The header's Pause motion control freezes the background independently of lesson playback. Decorative elements ignore pointer input and assistive technology. Reduced-motion preferences keep a static background and disable entrance effects. Mobile screens use fewer moving elements.

- `app/page.jsx` and `app/practice-app.jsx`: shared profile, six-language selection, four-path hubs, and visit progress.
- `app/method-workspace.jsx`: JavaScript/Python editable examples and quizzes.
- `app/trace-player.jsx`, `app/native-playground.jsx`, and `app/animation.css`: shared responsive animation player and editable Java/C examples.
- `lib/animation.mjs` and `lib/native-animation.mjs`: detailed read/evaluate/commit/return snapshots and 50 bounded Java/C models.
- `app/practice-workspace.jsx`: grouped topic navigation, Teach/Learn/Practice tabs, example walkthroughs, interview self review, predictions, and guided coding exercises.
- `app/practice.css`: responsive practice hub and learning flow styling.
- `app/learning-dashboard.jsx`, `app/daily-practice.jsx`, `app/mistake-notebook.jsx`, and `app/learning.css`: saved-learning dashboard, daily flow, bookmark controls, and review notebook.
- `app/use-learning-store.jsx` and `lib/learning-store.mjs`: guest persistence, account import, optimistic updates, durable account outboxes, explicit failure status, and retry.
- `app/use-account.jsx`, `app/account-dialog.jsx`, and `lib/supabase/`: verified sessions, email sign-up/sign-in, recovery, and sign-out.
- `app/api/`, `server/learning-api.mjs`, `proxy.js`, and `supabase/migrations/`: Next.js API routes, session refresh, account-owned PostgreSQL state, and atomic idempotent writes.
- `lib/learning-state.mjs` and `lib/daily-plan.mjs`: bounded learning events, spaced review dates, and daily plans.
- `server/worker.mjs`, `db/schema.ts`, and `drizzle/`: retained legacy D1 implementation for migration/reference.
- `app/code-atmosphere.jsx` and `app/atmosphere.css`: shared decorative coding backgrounds, language colors, card entrances, and pause/reduced-motion support.
- `lib/curriculum/`: 32 topic lessons, 64 interview cards, 28 guided problems, and 50 Java/C references sourced from official language documentation.
- `lib/curriculum.mjs` and `lib/practice.mjs`: curriculum navigation, language/path metadata, search, and guided expression validation.
- `app/learner-dialog.jsx`: accessible welcome form, editable learner profile, and personal welcome.
- `app/globals.css`: responsive layout, animation, and reduced-motion support.
- `lib/lessons.mjs` and `lib/python-lessons.mjs`: 50 lessons, detailed explanations, default inputs, and official documentation links.
- `lib/catalog.mjs`: case-insensitive search and group filtering for either language.
- `lib/engine.mjs`: validated examples and deterministic step traces, without eval or arbitrary code execution.
- `lib/quiz.mjs`: seeded question generation, five-question attempts, shuffled answers, and recent-question tracking.
- `lib/learner.mjs`: profile validation, session storage, and personalized encouragement.
- `lib/quiz-javascript.mjs`, `lib/quiz-python.mjs`, and `lib/quiz-python-expanded.mjs`: eight generated question scenarios per method, 400 scenarios in total. Answers are computed from the known operations without evaluating code strings. Quiz code excludes worked-example answer comments.
- `lib/python-engine.mjs`: additional Python traces, list mutations and indexed errors, Python whitespace and scalar equality, ordered dictionary snapshots, and tuple formatting.
- `tests/engine.test.mjs`: method semantics, short-circuit behavior, mutation, Python simulations, and invalid inputs.
- `tests/quiz.test.mjs`: generated-answer accuracy, unique choices, repeat avoidance, shuffled answers, and local history behavior.
- `tests/learner.test.mjs`: profile validation, session lifecycle, blocked storage, and motivational copy.

The Python lessons simulate the supported operations in JavaScript. They do not run a Python interpreter or arbitrary Python programs. Inputs are deliberately limited to keep the visual explanation readable. Array and object editors accept JSON; string editors accept plain text. `null` displays as Python `None`. Mutating methods show both the returned value and the resulting array. The forEach playground records callback effects separately from its undefined return value. Sorting animations illustrate ordering, rather than claiming to reproduce an engine's internal sort algorithm. Lesson progress is saved across visits. Recent quiz questions are stored locally on the device (up to 50 per method), so reopening the page avoids recent examples. If local storage is unavailable, recent-question tracking still works for the current browser session. Older examples can rotate back in after small edge-case scenario pools are exhausted; the previous five-question set remains excluded.

Optional WebMCP support exposes the same validated example configuration when the browser supports `document.modelContext`; unsupported browsers use the normal interface.

## Validation

Run `npm test` for learning content, browser rendering semantics, profiles, guided exercises, and the backend tests. `tests/supabase.test.mjs` applies the actual SQL migration to embedded PostgreSQL and checks ownership, grants, stale revisions, permanent duplicate delivery, guest transfer, retry, account switching, redirect validation, and legacy migration.

Run `npm run test:browser` on Windows with Microsoft Edge installed to exercise the real Next.js routes and Supabase SDK/session cookies against a local simulated Supabase HTTP service. It checks sign-up, invalid credentials, recovery, guest draft import, reload, a lost save response, account isolation, sign-out, expired links, password reset, and mobile/desktop layouts. It uses an isolated development build and hidden browser, contacts no live project or email account, and saves screenshots under ignored `.sites-runtime/`.

Run `npm run build` for the production Next.js build. Follow [Supabase setup](docs/supabase-setup.md) for live project/email verification and Vercel deployment.

The older Worker/SQLite browser smoke scripts are retained as legacy references and require the matching legacy exported UI and Worker artifact. They are not the validation path for the new Supabase application.

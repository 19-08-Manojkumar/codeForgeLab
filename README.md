# MethodLab

A Next.js App Router practice website with a Sites Worker and D1-backed learning progress for JavaScript, Python, Java, C, HTML, and CSS. Each programming language opens a four-path hub: Methods & functions, Programming basics, Interview preparation, and Coding problems. HTML and CSS open separate browser sessions with nine visual lessons each.

## Run locally

```sh
npm install
npm run build
npm start
```

Open http://localhost:3000. The Next.js UI exports to `out/`; `scripts/build-worker.mjs` packages it with the learning API into `dist/server/index.js`. Production saves structured learning state in Sites D1. The local preview uses SQLite in ignored `.sites-runtime/` and a local preview identity. `npm run dev` is available for UI work, with saved-learning features requiring the built local preview. Generate schema changes with `npm run db:generate`; committed Drizzle migrations are applied by Sites before publishing.

## Learning flow

On the first learning visit, an optional welcome form asks for a name, optional age, study or work background, domain, and learning goal. A saved profile personalizes the welcome, correct-answer feedback, retry encouragement, and quiz results. The profile and welcome dismissal are saved with learning progress in D1 under the authenticated Sites learner identity. Existing session profiles are migrated on the first successful load. Skip for now dismisses the welcome without clearing an existing account profile. Use the profile icon or Edit details to update or clear the profile without resetting the active quiz. Age does not change the questions or difficulty.

Choose a language, then a practice path. Methods & functions has 25 animated, editable entries per language. Java/C animations appear in the Learn step alongside the original worked example and output predictions. Programming basics contains eight topic lessons per language. Interview preparation contains 16 questions per language, model answers, a self-review checklist, follow-up questions, and links back to the related lesson. Coding problems contains six exercises each for JavaScript/Python and eight each for Java/C, totaling 28 guided problems.

Each new topic uses Teach, Learn, and Practice steps. Read the concept, trace a worked example, then predict output, explain an interview answer, or complete a missing code expression. Search and topic filters work within every path. Completed practice, bookmarks, recent quiz scores, edited method configurations, and coding drafts are saved automatically across reloads and visits. Continue learning opens the latest topic and learning step. The save status reports loading, saving, success, or an unavailable service with a retry action; pending changes stay in memory while the page remains open. Revealing a solution does not mark a problem solved. Guided expression checks preserve spaces within string literals and accept documented equivalent expressions. They do not compile or execute arbitrary programs; Java and C examples are curated references rather than installed compilers. Interview answers are self-reviewed, not automatically graded.

All 100 method animations separate reading the current value, evaluating an operation, committing the change, and returning the result. Filter shows the actual condition, kept and skipped indices, and the growing result. Accumulators expose before/after totals, searches stop at decisive values, strings show character transformations and matching pieces, and mutators keep return values separate from changed input. C memory examples expose destination bytes, overlap-safe moves, capacity and null terminators. Backward steps, a keyboard-accessible timeline, playback speed, pause, reset, and step history use deterministic snapshots. Editing values updates the code and resets playback; invalid values stop playback and show a specific explanation. Native models use bounded inputs: Java strings use UTF-16 indexing; C text uses printable ASCII and the C locale. They do not compile arbitrary Java/C programs. Pointer and reference results are labelled rather than presented as string values. Sorting and binary-search steps explain one valid strategy rather than promising the library's internal sequence.

The JavaScript/Python method path preserves five-question tests from different scenarios with shuffled choices. Python has eight built-ins, seven list methods, six string methods, and four dictionary methods. Each language's mixed method quiz generates 25 fresh questions. Java/C references include their language-specific syntax, return values, input behavior, official documentation, and printed output.

After a wrong answer, try once more or reveal the explanation. A second wrong attempt reveals the solution. Correct method quiz answers, output predictions, and guided coding answers trigger a dismissible code-themed popup: “Well done, Manoj!” uses the saved learner name, and “Well done!” praises anonymous learners. Quiz messages explain first tries, second tries, streaks, and perfect results. Popups close after five seconds, with Escape, or with the dismiss button. Editing a practice answer or leaving the exercise clears its popup; revealing an explanation or solution does not trigger one. Explanations remain after the popup closes. Motion effects respect reduced-motion preferences.

The home and language dashboards offer a daily session with one concept, three distinct curriculum output predictions, and one guided coding expression. Plans are deterministic by local calendar date and language, and five completion markers resume after reloads. Reveals do not complete practice. Daily correct predictions and coding expressions also update topic progress.

The mistake notebook captures first incorrect quiz attempts, output predictions, and coding expressions with explanations. Correct due reviews return after 1, 3, and 7 days; four successful due reviews mark a question reviewed. Extra same-day or early practice does not advance the schedule. The notebook keeps up to 100 recent questions, subject to a bounded Unicode-aware storage budget; cumulative answer statistics remain intact.

## Content and implementation

HTML and CSS use editable `index.html` and `styles.css` files alongside an automatically updating browser preview. Each lesson has Teach, Learn, and Practice steps, explanations of tags or CSS properties, an element inspector, a page structure list, and a challenge checked against the rendered DOM and computed styles. The preview width supports mobile, tablet, desktop, and fitting its panel; changing width updates responsive styles and inspection values. Both sessions save their drafts, progress, bookmarks, and resume step independently. Revealing a solution does not complete a lesson or overwrite a learner's saved draft. Daily programming predictions and the mistake notebook remain for JavaScript, Python, Java, and C.

The live preview runs in an opaque-origin iframe with `sandbox="allow-scripts"`. Learner code is embedded as escaped data, parsed and sanitized before insertion, and rendered by the browser. A nonce-protected teaching script handles inspection and challenge checks. Learner scripts, event handlers, external resources, form submission, and link navigation are disabled; self-contained data images work. CSS remains native, including selectors, inheritance, media queries, Flexbox, and Grid. The editor limits each file to 12,000 characters. Browser defaults and HTML error recovery apply, so challenges check the actual resulting elements and styles rather than raw source strings.

- `app/web-workspace.jsx` and `app/web.css`: separate HTML/CSS learning sessions, responsive editors, live preview, tag/rule explanations, and inspection.
- `lib/web-lessons.mjs`: nine HTML and nine CSS lessons with checked solutions and MDN sources.
- `lib/web-preview.mjs`: isolated browser rendering, DOM inspection, matched CSS rules, computed styles, and challenge checks.
- `tests/web-preview.test.mjs` and `tests/web-learning.test.mjs`: actual browser semantics, every lesson starter and solution, malicious markup isolation, responsive inspection, and durable web drafts.

Home, practice hubs, and learning pages use colorful shooting stars and code that travels across the viewport. Every language has its own palette. Home has diagonal meteor passes, hubs have wider fans, Teach has rising code, Learn has horizontal streams, Test reverses the direction, and Practice uses rising emerald accents. Switching topics resets the scene to Teach; background pause persists across navigation. The footer credits Manoj Kumar and links to his portfolio. The header's Pause motion control freezes the background independently of lesson playback. Decorative elements ignore pointer input and assistive technology. Reduced-motion preferences keep a static background and disable entrance effects. Mobile screens use fewer moving elements.

- `app/page.jsx` and `app/practice-app.jsx`: shared profile, four-language selection, four-path hub, and visit progress.
- `app/method-workspace.jsx`: JavaScript/Python editable examples and quizzes.
- `app/trace-player.jsx`, `app/native-playground.jsx`, and `app/animation.css`: shared responsive animation player and editable Java/C examples.
- `lib/animation.mjs` and `lib/native-animation.mjs`: detailed read/evaluate/commit/return snapshots and 50 bounded Java/C models.
- `app/practice-workspace.jsx`: grouped topic navigation, Teach/Learn/Practice tabs, example walkthroughs, interview self review, predictions, and guided coding exercises.
- `app/practice.css`: responsive practice hub and learning flow styling.
- `app/learning-dashboard.jsx`, `app/daily-practice.jsx`, `app/mistake-notebook.jsx`, and `app/learning.css`: saved-learning dashboard, daily flow, bookmark controls, and review notebook.
- `app/use-learning-store.jsx`: serialized loading/saving, optimistic updates, explicit failure status, and retry.
- `lib/learning-state.mjs` and `lib/daily-plan.mjs`: bounded learning events, spaced review dates, and daily plans.
- `server/worker.mjs`, `db/schema.ts`, and `drizzle/`: account-owned D1 state, permanent event deduplication, atomic revision updates, and generated schema migrations.
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

Run `npm test` for curriculum completeness, JavaScript example and exercise accuracy, guided expression handling, catalog, methods, quizzes, and learner profiles. On Windows with Microsoft Edge installed, build first and run `node scripts/ui-smoke.mjs` for the existing method/profile regression checks, then `node scripts/practice-smoke.mjs` for all four languages and paths, all 32 topic predictions, 64 interview cards, 28 guided exercises, 50 Java/C references, search, filters, keyboard tabs, progress, model answers, solutions, and all 16 language/path mobile layouts. Both use temporary local servers and hidden headless browsers and save screenshots in ignored `.sites-runtime/`.

Run `node scripts/web-smoke.mjs` after building to verify the separate HTML/CSS flows, live edits and inspection, rendered-page challenges, saved drafts and resume, bookmarks, solution reveal behavior, and desktop/mobile layouts. The preview unit tests use a locally installed Edge, Chrome, or Chromium browser when available; set `METHODLAB_TEST_BROWSER` to another browser executable if needed. Browser tests skip when no compatible executable is installed.

Run `node scripts/worker-smoke.mjs` after building to verify the packaged production Worker serves its embedded assets and persists HTML, CSS, and programming events through SQLite with account isolation. This checks the built artifact, including its curriculum dependencies.

Run `node scripts/animation-smoke.mjs` after building to check all 100 animations, every Java/C method with edited values, filter phases, return/changed-state separation, playback controls, invalid input, mobile layouts, keyboard scrubbing, and reduced motion. `tests/animation.test.mjs` independently checks changed-value results, overlapping memory, truncation, early search stops, parsing, return types, and snapshots. Local Java/C compilers are not installed; their generated examples are reviewed and their teaching models tested, without claiming compiler execution.

Run `node scripts/learning-smoke.mjs` after building to verify real SQLite-backed saves through the learner API, reloads, profiles, resume behavior, bookmarks, first wrong quiz attempts, scores, coding drafts, all four daily flows, and desktop/mobile notebook layouts. `tests/learning.test.mjs` checks review spacing, Unicode storage bounds, identity isolation, concurrent saves, permanent idempotency, and Worker asset handling.

WebMCP registration could not be validated in a browser with native `document.modelContext` support in the current environment.

Run `node scripts/atmosphere-smoke.mjs` after building to check viewport-scale meteor movement, six session themes, language palettes, theme resets, the creator link, pause/resume across navigation, reduced motion, lesson interaction, and all 16 language/path layouts at 390px and 360px widths.

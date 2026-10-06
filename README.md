# MethodLab

A frontend-only Next.js App Router practice website for JavaScript, Python, Java, and C. Each language opens a four-path hub: Methods & functions, Programming basics, Interview preparation, and Coding problems.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Build with `npm run build`, then preview the production export with `npm start`. The static website is exported to `out/` and can be served by a static host. There are no API routes, server actions, database, credentials, or runtime backend requirements.

## Learning flow

On the first visit in a browser tab, an optional welcome form asks for a name, optional age, study or work background, domain, and learning goal. A saved profile personalizes the welcome, correct-answer feedback, retry encouragement, and quiz results. The profile uses `sessionStorage`: it survives reloads in that tab for the browser session and is not sent to a server. Skip for now keeps the welcome closed for that session. Use the profile icon or Edit details to update or clear the profile without resetting the active quiz. Age does not change the questions or difficulty.

Choose a language, then a practice path. Methods & functions has 25 animated, editable entries per language. Java/C animations appear in the Learn step alongside the original worked example and output predictions. Programming basics contains eight topic lessons per language. Interview preparation contains 16 questions per language, model answers, a self-review checklist, follow-up questions, and links back to the related lesson. Coding problems contains six exercises each for JavaScript/Python and eight each for Java/C, totaling 28 guided problems.

Each new topic uses Teach, Learn, and Practice steps. Read the concept, trace a worked example, then predict output, explain an interview answer, or complete a missing code expression. Search and topic filters work within every path. Completed practice stays in memory during the current visit, including when changing paths or languages; it resets on reload. Revealing a solution does not mark a problem solved. Guided expression checks preserve spaces within string literals and accept documented equivalent expressions. They do not compile or execute arbitrary programs; Java and C examples are curated references rather than installed compilers. Interview answers are self-reviewed, not automatically graded.

All 100 method animations separate reading the current value, evaluating an operation, committing the change, and returning the result. Filter shows the actual condition, kept and skipped indices, and the growing result. Accumulators expose before/after totals, searches stop at decisive values, strings show character transformations and matching pieces, and mutators keep return values separate from changed input. C memory examples expose destination bytes, overlap-safe moves, capacity and null terminators. Backward steps, a keyboard-accessible timeline, playback speed, pause, reset, and step history use deterministic snapshots. Editing values updates the code and resets playback; invalid values stop playback and show a specific explanation. Native models use bounded inputs: Java strings use UTF-16 indexing; C text uses printable ASCII and the C locale. They do not compile arbitrary Java/C programs. Pointer and reference results are labelled rather than presented as string values. Sorting and binary-search steps explain one valid strategy rather than promising the library's internal sequence.

The JavaScript/Python method path preserves five-question tests from different scenarios with shuffled choices. Python has eight built-ins, seven list methods, six string methods, and four dictionary methods. Each language's mixed method quiz generates 25 fresh questions. Java/C references include their language-specific syntax, return values, input behavior, official documentation, and printed output.

After a wrong answer, try once more or reveal the explanation. A second wrong attempt reveals the solution. Correct answers trigger a dismissible code-themed popup, with different feedback for a first try, a second try, a streak, or a perfect first-try quiz. Explanations remain on the page after the popup closes. Revealed answers do not earn a point or trigger a celebration. Motion effects respect reduced-motion preferences.

## Content and implementation

- `app/page.jsx` and `app/practice-app.jsx`: shared profile, four-language selection, four-path hub, and visit progress.
- `app/method-workspace.jsx`: JavaScript/Python editable examples and quizzes.
- `app/trace-player.jsx`, `app/native-playground.jsx`, and `app/animation.css`: shared responsive animation player and editable Java/C examples.
- `lib/animation.mjs` and `lib/native-animation.mjs`: detailed read/evaluate/commit/return snapshots and 50 bounded Java/C models.
- `app/practice-workspace.jsx`: grouped topic navigation, Teach/Learn/Practice tabs, example walkthroughs, interview self review, predictions, and guided coding exercises.
- `app/practice.css`: responsive practice hub and learning flow styling.
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

The Python lessons simulate the supported operations in JavaScript. They do not run a Python interpreter or arbitrary Python programs. Inputs are deliberately limited to keep the visual explanation readable. Array and object editors accept JSON; string editors accept plain text. `null` displays as Python `None`. Mutating methods show both the returned value and the resulting array. The forEach playground records callback effects separately from its undefined return value. Sorting animations illustrate ordering, rather than claiming to reproduce an engine's internal sort algorithm. Lesson progress resets on reload. Recent quiz questions are stored locally on the device (up to 50 per method), so reopening the page avoids recent examples. If local storage is unavailable, recent-question tracking still works for the current browser session. Older examples can rotate back in after small edge-case scenario pools are exhausted; the previous five-question set remains excluded.

Optional WebMCP support exposes the same validated example configuration when the browser supports `document.modelContext`; unsupported browsers use the normal interface.

## Validation

Run `npm test` for curriculum completeness, JavaScript example and exercise accuracy, guided expression handling, catalog, methods, quizzes, and learner profiles. On Windows with Microsoft Edge installed, build first and run `node scripts/ui-smoke.mjs` for the existing method/profile regression checks, then `node scripts/practice-smoke.mjs` for all four languages and paths, all 32 topic predictions, 64 interview cards, 28 guided exercises, 50 Java/C references, search, filters, keyboard tabs, progress, model answers, solutions, and all 16 language/path mobile layouts. Both use temporary local servers and hidden headless browsers and save screenshots in ignored `.sites-runtime/`.

Run `node scripts/animation-smoke.mjs` after building to check all 100 animations, every Java/C method with edited values, filter phases, return/changed-state separation, playback controls, invalid input, mobile layouts, keyboard scrubbing, and reduced motion. `tests/animation.test.mjs` independently checks changed-value results, overlapping memory, truncation, early search stops, parsing, return types, and snapshots. Local Java/C compilers are not installed; their generated examples are reviewed and their teaching models tested, without claiming compiler execution.

WebMCP registration could not be validated in a browser with native `document.modelContext` support in the current environment.

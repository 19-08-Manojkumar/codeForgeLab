# MethodLab

A frontend-only Next.js App Router website for learning 25 JavaScript methods and 25 Python built-ins and methods through interactive examples, step-by-step visualizations, and quizzes.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Build with `npm run build`, then preview the production export with `npm start`. The static website is exported to `out/` and can be served by a static host. There are no API routes, server actions, database, credentials, or runtime backend requirements.

## Learning flow

On the first visit in a browser tab, an optional welcome form asks for a name, optional age, study or work background, domain, and learning goal. A saved profile personalizes the welcome, correct-answer feedback, retry encouragement, and quiz results. The profile uses `sessionStorage`: it survives reloads in that tab for the browser session and is not sent to a server. Skip for now keeps the welcome closed for that session. Use the profile icon or Edit details to update or clear the profile without resetting the active quiz. Age does not change the questions or difficulty.

Choose JavaScript or Python, search by method name or purpose, and optionally filter by group. Python has eight built-ins, seven list methods, six string methods, and four dictionary methods. Group headings and result counts remain visible on mobile. Select a topic, read the concept, edit the input and operation, then Play or step through the visual explanation. Every lesson includes syntax, parameters, return values, mutation behavior, a worked example, common mistakes, and official documentation. Each method test asks five questions from different scenarios, with newly generated inputs and shuffled answer choices. Try again, switch methods, or reopen the test for a fresh set. Language quizzes generate 25 fresh questions for either language.

After a wrong answer, try once more or reveal the explanation. A second wrong attempt reveals the solution. Correct answers trigger a dismissible code-themed popup, with different feedback for a first try, a second try, a streak, or a perfect first-try quiz. Explanations remain on the page after the popup closes. Revealed answers do not earn a point or trigger a celebration. Motion effects respect reduced-motion preferences.

## Content and implementation

- `app/page.jsx`: React interface, animation controls, editable examples, quizzes.
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

Run `npm test` for the catalog, method, quiz, and learner-profile checks. On Windows with Microsoft Edge installed, build first and run `node scripts/ui-smoke.mjs` for a local browser check of search, group filters, empty results, language switching, all 50 lessons and animation results, welcome validation, session persistence, personalized encouragement, profile editing during a quiz, edited inputs, quiz attempts and rewards, keyboard focus, Python mutation, mobile overflow, reduced motion, and runtime exceptions. This check starts a temporary local static server and a hidden headless browser, and saves screenshots in ignored `.sites-runtime/`.

WebMCP registration could not be validated in a browser with native `document.modelContext` support in the current environment.

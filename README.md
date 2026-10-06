# MethodLab

A frontend-only Next.js App Router website for learning 25 JavaScript array, object, and string methods and eight Python built-ins and methods through interactive examples, step-by-step visualizations, and quizzes.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Build with `npm run build`, then preview the production export with `npm start`. The static website is exported to `out/` and can be served by a static host. There are no API routes, server actions, database, credentials, or runtime backend requirements.

## Learning flow

Choose JavaScript or Python, choose a topic, read the concept, edit the input and operation, then Play or step through the visual explanation. Every JavaScript lesson includes syntax, parameters, return values, mutation behavior, a worked example, common mistakes, and official documentation. Test yourself on that topic or take a language quiz (25 questions for JavaScript, eight for Python).

After a wrong answer, try once more or reveal the explanation. A second wrong attempt reveals the solution. Correct answers trigger a dismissible code-themed popup, with different feedback for a first try, a second try, a streak, or a perfect first-try quiz. Explanations remain on the page after the popup closes. Revealed answers do not earn a point or trigger a celebration. Motion effects respect reduced-motion preferences.

## Content and implementation

- `app/page.jsx`: React interface, animation controls, editable examples, quizzes.
- `app/globals.css`: responsive layout, animation, and reduced-motion support.
- `lib/lessons.mjs`: 33 lessons, detailed JavaScript explanations, default inputs, official documentation links, and 66 quiz questions.
- `lib/engine.mjs`: validated examples and deterministic step traces, without eval or arbitrary code execution.
- `tests/engine.test.mjs`: method semantics, short-circuit behavior, mutation, Python simulations, and invalid inputs.

The Python lessons simulate the supported operations in JavaScript. They do not run a Python interpreter or arbitrary Python programs. Inputs are deliberately limited to keep the visual explanation readable. Array and object editors accept JSON; string editors accept plain text. `null` displays as Python `None`. Mutating methods show both the returned value and the resulting array. The forEach playground records callback effects separately from its undefined return value. Sorting animations illustrate ordering, rather than claiming to reproduce an engine's internal sort algorithm. Session progress stays in React state and resets on reload.

Optional WebMCP support exposes the same validated example configuration when the browser supports `document.modelContext`; unsupported browsers use the normal interface.

## Validation

Run `npm test` for the method checks. On Windows with Microsoft Edge installed, build first and run `node scripts/ui-smoke.mjs` for a local browser check of all 25 JavaScript lessons, edited inputs, animations, quiz attempts and rewards, keyboard focus, Python mutation, mobile overflow, reduced motion, and runtime exceptions. This check starts a temporary local static server and a hidden headless browser, and saves screenshots in ignored `.sites-runtime/`.

WebMCP registration could not be validated in a browser with native `document.modelContext` support in the current environment.

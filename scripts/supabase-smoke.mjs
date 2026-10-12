// Real Next.js routes, Supabase SDK/cookies, and browser UI against a local,
// simulated Supabase HTTP service. No real account or email is contacted.
import { createServer } from "node:http";
import { createHmac, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn, fork } from "node:child_process";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";
import { emptyLearningState, localDay, applyLearningEvent } from "../lib/learning-state.mjs";
import { shiftActivityDay, codingSummary } from "../lib/coding-activity.mjs";

const accounts = [
  { id: "11111111-1111-4111-8111-111111111111", email: "first@example.test" },
  { id: "22222222-2222-4222-8222-222222222222", email: "second@example.test" },
];
const tokens = new Map(), refreshTokens = new Map(), states = new Map();
let failNextWrite = false, confirmations = 0, recoveries = 0, createdAccount;
let learningAvailable = true;
const backendCalls=[];
function user(account) { return { ...account, aud: "authenticated", role: "authenticated", app_metadata: { provider: "email", providers: ["email"] }, user_metadata: account.user_metadata || {}, identities: [], created_at: "2026-10-08T00:00:00Z" }; }
function session(account) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const payload = encode({ sub: account.id, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000), jti: randomUUID() });
  const content = `${encode({ alg: "HS256", typ: "JWT" })}.${payload}`;
  const access = `${content}.${createHmac("sha256", "local-smoke-test-only").update(content).digest("base64url")}`, refresh = randomUUID();
  tokens.set(access, account); refreshTokens.set(refresh, account);
  return { access_token: access, token_type: "bearer", expires_in: 3600, refresh_token: refresh, user: user(account) };
}
const backend = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost"), account = tokens.get(req.headers.authorization?.replace(/^Bearer /, ""));
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  const send = (data, status = 200) => { backendCalls.push({path:url.pathname,status,owner:account?.id,eventId:body?.p_event_id}); res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };
  let body = {}; try { const chunks = []; for await (const chunk of req) chunks.push(chunk); const raw = Buffer.concat(chunks).toString(); if (raw) body = JSON.parse(raw); } catch { send({}, 400); return; }
  if (url.pathname === "/auth/v1/signup") { confirmations++; createdAccount = { id: randomUUID(), email: body.email, user_metadata: body.data }; accounts.push(createdAccount); send({ user: user(createdAccount) }); return; }
  if (url.pathname === "/auth/v1/recover") { recoveries++; send({}); return; }
  if (url.pathname === "/auth/v1/verify") { if (body.token_hash === "valid-local-recovery") send(session(accounts[0])); else send({ code: "otp_expired", msg: "Expired test token" }, 403); return; }
  if (url.pathname === "/auth/v1/token") {
    const found = url.searchParams.get("grant_type") === "refresh_token" ? refreshTokens.get(body.refresh_token) : accounts.find(item => item.email === body.email && body.password === "test-password-123");
    if (found) send(session(found)); else send({ code: "invalid_credentials", error_code: "invalid_credentials", msg: "Invalid test credentials" }, 400);
    return;
  }
  if (url.pathname === "/auth/v1/user") {
    if (!account) send({ code: "bad_jwt", msg: "Unknown test session" }, 401);
    else if (req.method === "PUT") send(user(account)); else send(user(account));
    return;
  }
  if (url.pathname === "/auth/v1/logout") { tokens.delete(req.headers.authorization?.replace(/^Bearer /, "")); res.writeHead(204); res.end(); return; }
  if (url.pathname.startsWith("/rest/v1/rpc/")) {
    if (!account) { send({ message: "No test session" }, 401); return; }
    if (!learningAvailable) { send({ code: "PGRST202", message: "Learning storage has not been set up" }, 404); return; }
    let record = states.get(account.id);
    if (!record) { record = { state: emptyLearningState(), revision: 0, events: new Set() }; states.set(account.id, record); }
    if (url.pathname.endsWith("/get_learning_state")) { send({ state: record.state, revision: record.revision }); return; }
    if (url.pathname.endsWith("/apply_learning_update")) {
      if (record.events.has(body.p_event_id)) { send({ status: "duplicate", state: record.state }); return; }
      if (record.revision !== body.p_expected_revision) { send({ status: "conflict" }); return; }
      record.state = body.p_state; record.revision++; record.events.add(body.p_event_id);
      if (failNextWrite) { failNextWrite = false; send({ message: "Simulated lost response" }, 503); return; }
      send({ status: "saved", state: record.state }); return;
    }
  }
  send({ message: "Not found" }, 404);
});
const listen = server => new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const stopProcess = async child => {
  if (!child || child.exitCode !== null) return;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Test process did not stop")), 5000);
    child.once("exit", () => { clearTimeout(timeout); resolve(); });
    child.kill("SIGKILL");
  });
  child.stdout?.destroy(); child.stderr?.destroy();
};
await listen(backend);
const reserve = createServer(); await listen(reserve); const port = reserve.address().port; await new Promise(resolve => reserve.close(resolve));
const base = `http://127.0.0.1:${port}`, runtime = resolve(".sites-runtime");
await mkdir(runtime, { recursive: true });
// Own the same server worker used by `next dev` for reliable local cleanup.
const next = fork(resolve("node_modules/next/dist/server/lib/start-server.js"), [], {
  env: { ...process.env, NODE_ENV: "development", __NEXT_DEV_SERVER: "1", NEXT_PRIVATE_WORKER: "1", TURBOPACK: "", CODEFORGE_BUILD_DIR: ".sites-runtime/supabase-next", NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${backend.address().port}`, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_smoke_test", NEXT_TELEMETRY_DISABLED: "1" },
  windowsHide: true, stdio: ["ignore", "pipe", "pipe", "ipc"], execArgv: [],
});
next.on("message", message => { if (message.nextWorkerReady) next.send({ nextWorkerOptions: { dir: resolve("."), isDev: true, hostname: "127.0.0.1", port, allowRetry: false } }); });
let nextOutput = ""; const output = data => { nextOutput = (nextOutput + data).slice(-5000); };
next.stdout.on("data", output); next.stderr.on("data", output);
let browser, socket, screenshot, call;
const errors = [], browserLogs = [];
try {
  let started = false;
  for (let i = 0; i < 120; i++) {
    try { const response = await fetch(base); await response.arrayBuffer(); if (response.ok) { started = true; break; } } catch {}
    if (next.exitCode !== null) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(started, "Next.js startup failed: " + nextOutput);
  const profile = join(runtime, `supabase-browser-${process.pid}`);
  browser = spawn("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", ["--headless=new", "--no-sandbox", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", "--disable-background-networking", "--disable-component-update", "--disable-sync", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
  let endpoint;
  for (let i = 0; i < 150; i++) {
    try { const [debugPort] = (await readFile(join(profile, "DevToolsActivePort"), "utf8")).trim().split(/\r?\n/); const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json(); endpoint = pages.find(item => item.type === "page")?.webSocketDebuggerUrl; if (endpoint) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(endpoint, "Edge startup failed"); socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let serial = 0; const pending = new Map();
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data), item = pending.get(message.id);
    if (item) { pending.delete(message.id); clearTimeout(item.timeout); message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result); }
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === "Log.entryAdded") browserLogs.push(message.params.entry.text);
  });
  call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++serial, timeout = setTimeout(() => { pending.delete(id); reject(new Error("Browser command timed out: " + method)); }, 20000); pending.set(id, { resolve, reject, timeout }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => { const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
  const wait = async expression => { for (let i = 0; i < 200; i++) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise(resolve => setTimeout(resolve, 100)); } throw new Error("Expected browser state: " + expression); };
  const click = async (text, scope = "button") => assert.equal(await evaluate(`(()=>{const button=[...document.querySelectorAll(${JSON.stringify(scope)})].find(item=>item.textContent.trim()===${JSON.stringify(text)}||item.getAttribute('aria-label')===${JSON.stringify(text)});if(!button)return false;button.focus();button.click();return true;})()`), true, "Button: " + text);
  const field = async (selector, value) => { await evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});const prototype=element.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:element.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,${JSON.stringify(value)});element.dispatchEvent(new Event('input',{bubbles:true}));if(element.tagName==='SELECT')element.dispatchEvent(new Event('change',{bubbles:true}));})()`); await wait(`document.querySelector(${JSON.stringify(selector)})?.value===${JSON.stringify(value)}`); };
  screenshot = async name => { const shot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); await writeFile(join(runtime, name), Buffer.from(shot.data, "base64")); };
  const pressKey = async (key, code, keyCode, modifiers = 0) => { await call("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: keyCode, modifiers }); await call("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: keyCode, modifiers }); };
  const saved = () => wait("document.querySelector('.learning-save-status')?.classList.contains('saved')");
  const draftSaved = async (owner, text) => { for (let i = 0; i < 200; i++) { if (Object.values(states.get(owner)?.state.drafts || {}).some(item => item.value.includes(text))) return; await new Promise(resolve => setTimeout(resolve, 50)); } throw new Error("Account draft did not finish saving"); };
  const guestReady = async () => {
    await wait("document.querySelector('.account-trigger')?.textContent==='Login' && !document.querySelector('.account-trigger')?.disabled && document.querySelector('.learning-save-status')?.classList.contains('guest')");
    assert.equal(await evaluate("document.querySelectorAll('.account-trigger').length===1 && !document.querySelector('.profile-trigger') && !document.querySelector('.learner-banner') && !document.querySelector('dialog[open]')"), true, "Guests see one Login control without a profile or automatic dialog");
  };
  const signIn = async account => { await click("Login", ".account-trigger"); await wait("document.querySelector('.account-dialog')?.open && document.querySelector('#account-email')"); await field("#account-email", account.email); await field("#account-password", "test-password-123"); await click("Sign in", ".account-dialog button"); await wait("!document.querySelector('.account-dialog')?.open && document.querySelector('.account-trigger')?.textContent==='Profile'"); };
  const signOut = async () => { await click("Profile", ".account-trigger"); await click("Logout", ".account-dialog button"); await guestReady(); assert.equal(await evaluate("document.body.style.overflow!== 'hidden' && document.activeElement===document.querySelector('.account-trigger')"), true, "Logout restores the guest page and focus"); };
  await call("Runtime.enable"); await call("Page.enable"); await call("Page.bringToFront"); await call("Log.enable"); await call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await call("Page.navigate", { url: base }); await guestReady();
  await wait("document.querySelector('.journey-streak-number strong')?.textContent==='0'");
  assert.equal(await evaluate("document.querySelectorAll('.journey-trophy.earned').length"), 0, "Opening the home page must not earn a coding day or trophy");
  for (const width of [1440, 390, 360]) {
    await call("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 760 });
    assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"), true, `${width}px coding journey layout`);
    assert.equal(await evaluate("[...document.querySelectorAll('.home-sessions .language-card')].every(card=>card.getBoundingClientRect().bottom<=innerHeight)"), true, `${width}px: all six sessions are accessible without scrolling`);
    assert.equal(await evaluate("document.querySelectorAll('.home-journey-details .journey-trophy').length===25 && !document.querySelector('.journey-trophy-disclosure').open && !document.querySelector('.journey-calendar-disclosure').open"), true, "All 25 trophies are available without pushing sessions down the page");
    assert.equal(await evaluate("(()=>{const calendar=document.querySelector('.journey-calendar-disclosure'),trophies=document.querySelector('.journey-trophy-disclosure');calendar.open=true;const calendarHeight=calendar.getBoundingClientRect().height;calendar.open=false;trophies.open=true;const trophyHeight=trophies.getBoundingClientRect().height;trophies.open=false;return Math.abs(calendarHeight-trophyHeight)<=1})()"), true, `${width}px trophy panel matches the activity calendar height`);
    await screenshot(width===1440?"coding-home-new-desktop.png":`coding-home-new-${width}.png`);
  }
  assert.equal(await evaluate("document.querySelector('#home-related-title')?.textContent==='Other areas to learn' && [...document.querySelectorAll('.home-related-link')].length===2 && [...document.querySelectorAll('.home-related-link')].every(link=>link.target==='_blank' && new URL(link.href).origin!==location.origin)"), true, "SQL and data science lead to separate external learning projects");
  await call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  assert.equal(await evaluate("document.querySelectorAll('.language-card').length"), 6);
  await click("Login", ".account-trigger"); await wait("document.querySelector('.account-dialog')?.open && document.querySelector('#account-email')");
  assert.equal(await evaluate("document.querySelector('#signup-name')===null && document.activeElement.id==='account-email'"), true, "Login opens sign-in first");
  await evaluate("document.querySelector('.account-close').focus()"); await pressKey("Tab", "Tab", 9, 8);
  assert.equal(await evaluate("document.activeElement.classList.contains('account-guest')"), true, "Shift+Tab stays in the dialog");
  await pressKey("Tab", "Tab", 9);
  assert.equal(await evaluate("document.activeElement.classList.contains('account-close')"), true, "Tab wraps to the first dialog control");
  await pressKey("Escape", "Escape", 27); await wait("!document.querySelector('.account-dialog').open && document.activeElement===document.querySelector('.account-trigger')");
  await click("Login", ".account-trigger"); await wait("document.querySelector('.account-dialog')?.open && document.activeElement.id==='account-email'");
  await click("Show", ".account-dialog .auth-password-toggle");
  assert.equal(await evaluate("document.querySelector('#account-password').type==='text' && document.querySelector('.auth-password-toggle').getAttribute('aria-pressed')==='true'"), true);
  await click("Hide", ".account-dialog .auth-password-toggle");
  assert.equal(await evaluate("document.querySelector('#account-password').type==='password'"), true);
  await screenshot("auth-signin-desktop.png");
  await click("Create an account", ".account-dialog button"); await wait("document.querySelector('#signup-name') && document.activeElement.id==='signup-name'");
  await field("#signup-name", "   "); await field("#signup-role", "student"); await field("#signup-domain", "Computer science"); await field("#signup-goal", "projects");
  await field("#account-email", "new@example.test"); await field("#account-password", "test-password-123"); await field("#account-confirm-password", "different-password"); await click("Create account", ".account-dialog button");
  await wait("document.querySelector('#signup-name-error')"); assert.equal(confirmations, 0);
  await field("#signup-name", "Mira"); await click("Create account", ".account-dialog button"); await wait("document.querySelector('#account-confirm-password-error')"); assert.equal(confirmations, 0);
  await field("#account-confirm-password", "test-password-123"); await field("#signup-age", "24");
  assert.equal(await evaluate("document.querySelector('#account-password').type==='password' && getComputedStyle(document.querySelector('.account-signup-layout')).gridTemplateColumns.split(' ').length===2"), true, "Desktop signup separates profile and credentials");
  await evaluate("document.querySelector('.account-dialog').scrollTop=0"); await screenshot("auth-signup-desktop.png");
  for (const width of [1440, 1100, 390, 360]) {
    await call("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 760 });
    assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth && document.querySelector('.account-dialog').scrollWidth<=document.querySelector('.account-dialog').clientWidth"), true, `${width}px signup form`);
  }
  await evaluate("document.querySelector('.account-dialog').scrollTop=0"); await screenshot("supabase-signup-mobile.png");
  await click("Create account", ".account-dialog button");
  await wait("document.querySelector('.account-message')?.textContent.includes('Check your email')"); assert.equal(confirmations, 1);
  await screenshot("auth-confirm-email-mobile.png");
  assert.deepEqual(createdAccount.user_metadata, { full_name: "Mira", learning_profile: { name: "Mira", age: 24, role: "student", domain: "Computer science", goal: "projects" } });
  await click("Back to sign in", ".account-dialog button"); await click("Forgot password?", ".account-dialog button"); await click("Send reset link", ".account-dialog button");
  await wait("document.querySelector('.account-message')?.textContent.includes('reset link')"); assert.equal(recoveries, 1);
  await screenshot("auth-forgot-password-mobile.png");
  await click("Back to sign in", ".account-dialog button"); await field("#account-email", accounts[0].email); await field("#account-password", "wrong-password"); await click("Sign in", ".account-dialog button");
  await wait("document.querySelector('.account-dialog [role=alert]')?.textContent.includes('incorrect')");
  for (const width of [1440, 1100, 390, 360]) {
    await call("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 760 });
    assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"), true, `${width}px account layout`);
    assert.equal(await evaluate("document.querySelector('.account-dialog').getBoundingClientRect().width<=innerWidth-16"), true);
  }
  await screenshot("supabase-account-mobile.png"); await click("Continue as a guest", ".account-dialog button");
  await evaluate("document.querySelector('.language-card[data-language=html]').click()"); await wait("document.querySelectorAll('.practice-path-card').length===4");
  await evaluate("document.querySelector('.practice-path-card[data-path=render]').click()");
  await evaluate("document.querySelector('.web-preview-panel iframe')?.scrollIntoView({block:'center'})");
  try { await wait("document.querySelector('.web-browser-toolbar [role=status]')?.textContent==='Preview up to date'"); }
  catch(error) { await writeFile(join(runtime,"supabase-preview-debug.html"), await evaluate("document.querySelector('.web-preview-panel iframe')?.srcdoc || ''")); console.error(JSON.stringify({errors,browserLogs})); throw error; }
  const selector = await evaluate("[...document.querySelectorAll('textarea')].find(item=>item.value.includes('<'))?.id || ''");
  const sourceSelector = selector ? `#${selector}` : "textarea";
  const original = await evaluate(`document.querySelector(${JSON.stringify(sourceSelector)}).value`);
  await field(sourceSelector, original + "\n<p>Account sync browser check</p>");
  await wait("document.querySelector('.journey-celebration strong')?.textContent==='First spark'");
  await screenshot("coding-first-trophy-mobile.png");
  await evaluate("document.querySelector('[aria-label=\"Dismiss trophy celebration\"]').click()");
  await evaluate(`document.querySelector(${JSON.stringify(sourceSelector)}).focus()`);
  await call("Input.insertText", { text: "\n<!-- Active practice check -->" });
  await new Promise(resolve=>setTimeout(resolve,2300));
  await wait("document.querySelector('.learning-save-status')?.classList.contains('guest')");
  await evaluate("document.querySelector('.brand').click()"); await signIn(accounts[0]); await saved();
  assert.equal(codingSummary(states.get(accounts[0].id).state, localDay()).currentStreak, 1);
  assert.ok(codingSummary(states.get(accounts[0].id).state, localDay()).seconds>=1, "Actual editor input records focused practice time before leaving the workspace");
  assert.ok(Object.values(states.get(accounts[0].id).state.drafts).some(item => item.value.includes("Account sync browser check")));
  await call("Page.reload"); await saved(); assert.equal(await evaluate("document.querySelector('.account-trigger').textContent"), "Profile");
  assert.equal(await evaluate("document.querySelector('.learning-save-status.saved').hidden && document.querySelector('.learning-save-status.saved').getClientRects().length===0 && !document.querySelector('.home-overview .learner-banner')"), true, "Successful saves and profile details do not take up home-page space");
  assert.equal(await evaluate("document.querySelector('.journey-streak-number strong').textContent"), "1", "Streak survives a reload and account import");
  const denied = await evaluate(`fetch('/api/learning',{headers:{'X-Learner-Account':${JSON.stringify(accounts[1].id)}}}).then(response=>response.status)`); assert.equal(denied, 409);
  await click("Profile", ".account-trigger"); await click("Complete profile", ".account-dialog button");
  await wait("document.querySelector('#profile-name') && document.activeElement.id==='profile-name'");
  await field("#profile-name", "Alex"); await field("#profile-role", "independent"); await field("#profile-domain", "Web development");
  failNextWrite = true; await click("Save changes", ".account-dialog button");
  await wait("document.querySelector('.learning-save-status')?.classList.contains('unavailable')");
  await call("Page.reload"); await saved(); assert.equal(await evaluate("Boolean(document.querySelector('dialog[open]'))"), false);
  assert.equal(states.get(accounts[0].id).state.profile.name, "Alex");
  await signOut(); await signIn(accounts[1]); await saved();
  assert.equal(await evaluate("document.querySelector('.journey-streak-number strong').textContent"), "0", "Other accounts cannot inherit a coding streak");
  assert.deepEqual(states.get(accounts[1].id).state.drafts, {});
  assert.equal(await evaluate("document.querySelector('.learner-banner')===null"), true, "A different account does not inherit the previous profile");
  await signOut();
  learningAvailable = false;
  await signIn(createdAccount);
  await wait("document.querySelector('.learning-save-status')?.classList.contains('unavailable')");
  assert.equal(states.has(createdAccount.id), false, "Missing tables must not pretend that learning data was saved");
  await click("Profile", ".account-trigger"); await click("Edit profile", ".account-dialog button");
  await wait("document.querySelector('#profile-name')?.value==='Mira'");
  assert.deepEqual(await evaluate("Object.fromEntries(['name','age','role','domain','goal'].map(field=>[field,document.querySelector('#profile-'+field).value]))"), { name: "Mira", age: "24", role: "student", domain: "Computer science", goal: "projects" }, "All signup fields are recovered through the verified account API");
  assert.equal(await evaluate("document.querySelector('.account-dialog button[type=submit]').disabled && Boolean(document.querySelector('.account-profile-unavailable'))"), true, "Unavailable storage blocks false save success and offers a retry");
  await field("#profile-name", "Unsaved draft");
  learningAvailable = true;
  await click("Retry connection", ".account-dialog button"); await saved();
  assert.equal(await evaluate("document.querySelector('#profile-name').value"), "Unsaved draft", "Recovery does not overwrite edits in progress");
  await click("Cancel", ".account-dialog button");
  await evaluate("document.querySelector('[aria-label=\"Close profile\"]').click()");
  assert.equal(states.get(createdAccount.id).state.profile.name, "Mira");
  assert.equal(await evaluate("document.querySelector('.home-overview .learner-banner')===null"), true);
  await click("Profile", ".account-trigger"); await click("Edit profile", ".account-dialog button"); await wait("document.querySelector('#profile-name')?.value==='Mira'");
  await field("#profile-name", "Unsaved name"); await click("Cancel", ".account-dialog button"); assert.equal(states.get(createdAccount.id).state.profile.name, "Mira");
  await click("Edit profile", ".account-dialog button"); await wait("document.querySelector('#profile-name')?.value==='Mira'");
  await field("#profile-name", "   "); await click("Save changes", ".account-dialog button"); await wait("document.querySelector('#profile-name-error')");
  await field("#profile-name", "Mira Updated"); await click("Save changes", ".account-dialog button"); await saved();
  await wait("document.querySelector('.account-dialog .account-name')?.textContent==='Mira Updated'");
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.account-profile-summary dt')].map(item=>item.textContent)"), ["Background", "Area of study", "Learning goal", "Age"]);
  for (const width of [1440, 1100, 390, 360]) {
    await call("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 760 });
    assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth && document.querySelector('.account-dialog').scrollWidth<=document.querySelector('.account-dialog').clientWidth"), true, `${width}px signed-in profile`);
    if (width===1440) await screenshot("auth-profile-desktop.png");
  }
  await screenshot("supabase-profile-mobile.png");
  await evaluate("document.querySelector('[aria-label=\"Close profile\"]').click()");
  await wait("!document.querySelector('.account-dialog').open && document.activeElement===document.querySelector('.account-trigger')");
  await click("Profile", ".account-trigger"); await click("Edit profile", ".account-dialog button"); await wait("document.querySelector('.account-dialog').open && document.querySelector('#profile-name')?.value==='Mira Updated'");
  await screenshot("auth-edit-profile-mobile.png");
  assert.equal(await evaluate("document.querySelectorAll('dialog[open]').length===1 && !document.querySelector('.learner-dialog')"), true, "Profile editing uses the same account dialog");
  await evaluate("document.querySelector('[aria-label=\"Close profile\"]').click()");
  await evaluate("document.querySelector('.language-card[data-language=html]').click()"); await wait("document.querySelectorAll('.practice-path-card').length===4"); await evaluate("document.querySelector('.practice-path-card[data-path=render]').click()");
  await wait("document.querySelector('.web-editors textarea') || document.querySelector('textarea')");
  const accountSource = await evaluate("[...document.querySelectorAll('textarea')].find(item=>item.value.includes('<')).id");
  await field(`#${accountSource}`, original + "\n<p>Continue on another device</p>"); await click("Bookmark topic"); await draftSaved(createdAccount.id, "Continue on another device"); await saved();
  await call("Network.clearBrowserCookies"); await call("Storage.clearDataForOrigin", { origin: base, storageTypes: "all" }); await call("Page.reload"); await guestReady();
  await signIn(createdAccount); await saved();
  await click("Profile", ".account-trigger"); await wait("document.querySelector('.account-name')?.textContent==='Mira Updated'");
  await evaluate("document.querySelector('[aria-label=\"Close profile\"]').click()");
  assert.equal(states.get(createdAccount.id).state.bookmarks.length, 1);
  const homeHeight=await evaluate("document.querySelector('.home-overview').scrollHeight");
  await evaluate("document.querySelector('.home-bookmarks > summary').click()");
  assert.equal(await evaluate(`document.querySelector('.home-overview').scrollHeight===${homeHeight}`), true, "Opening bookmarked topics does not change the home layout height");
  assert.equal(await evaluate("document.querySelectorAll('.home-bookmark-list > button').length===1 && document.querySelector('.home-bookmark-popover').getBoundingClientRect().right<=innerWidth"), true, "Bookmarks open in a contained popover with selectable saved topics");
  await evaluate("document.querySelector('.home-bookmarks').open=false");
  assert.equal(await evaluate("document.querySelector('.home-quick-actions .home-shortcut-button:nth-of-type(2)')?.textContent.includes('Mistake notebook') && document.querySelector('.home-related').textContent.includes('Other areas to learn')"), true, "Notebook and external learning projects have clear, labeled home cards");
  await click("Continue learning"); await wait("[...document.querySelectorAll('textarea')].some(item=>item.value.includes('Continue on another device'))");
  assert.ok(await evaluate("[...document.querySelectorAll('.topic-bookmark')].some(item=>item.textContent.includes('Bookmarked'))"));
  await screenshot("supabase-restored-learning-mobile.png");
  await evaluate("document.querySelector('.brand').click()");
  await click("Profile", ".account-trigger"); await click("Edit profile", ".account-dialog button"); await click("Clear learning profile", ".account-dialog button");
  assert.equal(states.get(createdAccount.id).state.profile.name, "Mira Updated", "Opening clear confirmation must not remove a profile");
  await click("Keep profile", ".account-dialog button");
  await wait("document.activeElement.classList.contains('profile-clear')");
  assert.equal(states.get(createdAccount.id).state.profile.name, "Mira Updated");
  await click("Clear learning profile", ".account-dialog button"); await click("Clear profile", ".account-dialog button"); await saved();
  assert.equal(states.get(createdAccount.id).state.profile, null); assert.equal(states.get(createdAccount.id).state.bookmarks.length, 1);
  await call("Page.reload"); await saved(); assert.equal(states.get(createdAccount.id).state.profile, null);
  assert.equal(await evaluate("document.querySelector('.account-trigger').textContent==='Profile' && document.querySelector('.learner-banner')===null"), true, "Clearing the learning profile keeps the signed-in account without restoring signup metadata");
  await signOut();
  // Seed only the simulated service to inspect retained milestones and missed days.
  const today = localDay();
  let journeyState = states.get(createdAccount.id).state;
  for(let offset=-32;offset<=-3;offset++) journeyState=applyLearningEvent(journeyState,{id:randomUUID(),type:"complete",language:"javascript",path:"problems",entryId:"double",day:shiftActivityDay(today,offset)});
  for(let i=0;i<60;i++) journeyState=applyLearningEvent(journeyState,{id:randomUUID(),type:"practice-time",seconds:60,day:shiftActivityDay(today,-3)});
  states.get(createdAccount.id).state=journeyState;
  await signIn(createdAccount); await saved();
  await wait("document.querySelector('.journey-streak-number strong')?.textContent==='1'");
  assert.equal(await evaluate("Boolean(document.querySelector('.journey-celebration'))"), false, "Loading historical trophies must not trigger a new celebration");
  const missedDay=shiftActivityDay(today,-1);
  await screenshot("compact-home-earned-mobile.png");
  await evaluate("document.querySelector('.journey-calendar-disclosure > summary').click()");
  if(!await evaluate(`Boolean(document.querySelector('[data-day="${missedDay}"]'))`)) await click("", ".journey-month-nav button[aria-label='Previous month']");
  await evaluate(`document.querySelector('[data-day="${missedDay}"]').click()`);
  await wait("document.querySelector('.journey-day-detail').textContent.includes('No practice recorded')");
  await screenshot("coding-home-earned-mobile.png");
  await call("Emulation.setDeviceMetricsOverride", { width:1440,height:1000,deviceScaleFactor:1,mobile:false });
  await screenshot("coding-home-earned-desktop.png");
  await evaluate("document.querySelector('.journey-calendar-disclosure').open=false");
  await screenshot("compact-home-earned-desktop.png");
  await evaluate("document.querySelector('.journey-trophy-disclosure > summary').click();document.querySelector('.journey-trophy-disclosure').scrollIntoView({block:'start'})");
  assert.equal(await evaluate("document.querySelectorAll('.home-journey-details .journey-trophy').length"), 25);
  assert.equal(await evaluate("(()=>{const grid=document.querySelector('.journey-trophy-disclosure .journey-trophy-grid');return grid.clientHeight<grid.scrollHeight && getComputedStyle(grid).overflowY==='auto'})()"), true, "The full trophy collection remains scrollable inside its calendar-sized panel");
  await screenshot("trophy-collection-25.png");
  await click("Profile", ".account-trigger");
  assert.equal(await evaluate("document.querySelector('.account-avatar').classList.contains('reward-gold') && document.querySelectorAll('.journey-trophies.compact .earned').length>=5"), true);
  assert.equal(await evaluate("document.querySelectorAll('.journey-trophies.compact .journey-trophy').length"), 25);
  await call("Emulation.setEmulatedMedia", { features:[{name:"prefers-reduced-motion",value:"reduce"}] });
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.account-avatar')).animationName"), "none", "Earned avatar effects respect reduced motion");
  await call("Emulation.setEmulatedMedia", { features:[{name:"prefers-reduced-motion",value:"no-preference"}] });
  await evaluate("document.querySelector('[aria-label=\"Close profile\"]').click()");
  await click("Pause motion", ".ambient-toggle"); await click("Profile", ".account-trigger");
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.account-avatar')).animationPlayState"), "paused", "The existing pause-motion control pauses profile effects");
  await screenshot("coding-profile-earned-desktop.png");
  await signOut();
  // Only the simulated service is changed to verify a longer, brighter live flame.
  for(let offset=-29;offset<=0;offset++) states.get(createdAccount.id).state=applyLearningEvent(states.get(createdAccount.id).state,{id:randomUUID(),type:"complete",language:"javascript",path:"problems",entryId:"double",day:shiftActivityDay(today,offset)});
  await signIn(createdAccount); await saved();
  await wait("document.querySelector('.journey-streak-number strong')?.textContent==='33'");
  assert.equal(await evaluate("document.querySelector('.live-streak-flame').dataset.flameLevel"), "5");
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.live-flame-outer')).animationPlayState"), "paused");
  await click("Resume motion", ".ambient-toggle");
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.live-flame-outer')).animationName"), "streak-flame-live");
  await call("Emulation.setEmulatedMedia", { features:[{name:"prefers-reduced-motion",value:"reduce"}] });
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.live-flame-outer')).animationName"), "none");
  await call("Emulation.setEmulatedMedia", { features:[{name:"prefers-reduced-motion",value:"no-preference"}] });
  await screenshot("compact-home-live-flame.png");
  await signOut();
  await call("Emulation.setDeviceMetricsOverride", { width:360,height:900,deviceScaleFactor:1,mobile:true });
  await call("Page.navigate", { url: base + "/auth/confirm?token_hash=expired&type=recovery" }); await wait("location.pathname.includes('/auth/error')");
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth && Boolean(document.querySelector('.auth-card h1'))"), true); await screenshot("auth-expired-link-mobile.png");
  await call("Page.navigate", { url: base + "/auth/confirm?token_hash=valid-local-recovery&type=recovery" }); await wait("document.querySelector('#new-password')");
  await click("Show", ".auth-card .auth-password-toggle"); assert.equal(await evaluate("document.querySelector('#new-password').type==='text'"), true); await click("Hide", ".auth-card .auth-password-toggle");
  await screenshot("auth-reset-password-mobile.png");
  await field("#new-password", "changed-password-123"); await field("#confirm-password", "different-password"); await click("Update password"); await wait("document.querySelector('[role=alert]')?.textContent.includes(\"don't match\")");
  await field("#confirm-password", "changed-password-123"); await click("Update password"); await wait("document.querySelector('[role=status]')?.textContent.includes('updated')");
  await screenshot("supabase-password-reset-mobile.png");
  assert.deepEqual(errors, []);
} catch (error) { try { await screenshot?.("supabase-browser-failure.png"); } catch {} console.error(JSON.stringify({backendCalls:backendCalls.slice(-12),errors,browserLogs,stateOwners:[...states].map(([owner,value])=>({owner,revision:value.revision,eventCount:value.events.size}))})); throw error; }
finally {
  socket?.close(); backend.closeAllConnections(); backend.close();
  await stopProcess(browser); await stopProcess(next);
}
console.log(JSON.stringify({ passed: true, checks: ["real Next.js API routes and Supabase session cookies", "single Login/Profile control with no automatic guest dialog", "signup from Login, profile validation and matching passwords", "sign-up confirmation, invalid sign-in, password recovery forms", "profile completion, edit cancellation, validation, saving and clearing in one dialog", "device draft import and reload", "lost response retry", "account isolation, logout and restored focus", "signup profile, updated name, draft and bookmark restored with fresh browser storage", "expired links and token-hash password reset", "360/390/1100/1440px signup, sign-in and profile layouts", "no browser exceptions"], backend: "local simulated Supabase service; no live credentials or emails used" }));

// Real Next.js routes, Supabase SDK/cookies, and browser UI against a local,
// simulated Supabase HTTP service. No real account or email is contacted.
import { createServer } from "node:http";
import { createHmac, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn, execFile } from "node:child_process";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";
import { emptyLearningState } from "../lib/learning-state.mjs";

const accounts = [
  { id: "11111111-1111-4111-8111-111111111111", email: "first@example.test" },
  { id: "22222222-2222-4222-8222-222222222222", email: "second@example.test" },
];
const tokens = new Map(), refreshTokens = new Map(), states = new Map();
let failNextWrite = false, confirmations = 0, recoveries = 0;
const backendCalls=[];
function user(account) { return { ...account, aud: "authenticated", role: "authenticated", app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, identities: [], created_at: "2026-10-08T00:00:00Z" }; }
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
  if (url.pathname === "/auth/v1/signup") { confirmations++; send({ user: user({ id: randomUUID(), email: body.email }) }); return; }
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
await listen(backend);
const reserve = createServer(); await listen(reserve); const port = reserve.address().port; await new Promise(resolve => reserve.close(resolve));
const base = `http://127.0.0.1:${port}`, runtime = resolve(".sites-runtime");
await mkdir(runtime, { recursive: true });
const next = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "dev", "--webpack", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: { ...process.env, CODEFORGE_BUILD_DIR: ".sites-runtime/supabase-next", NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${backend.address().port}`, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_smoke_test", NEXT_TELEMETRY_DISABLED: "1" },
  windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
});
let nextOutput = ""; const output = data => { nextOutput = (nextOutput + data).slice(-5000); };
next.stdout.on("data", output); next.stderr.on("data", output);
let browser, socket, screenshot, call;
const errors = [], browserLogs = [];
try {
  let started = false;
  for (let i = 0; i < 120; i++) {
    try { const response = await fetch(base); if (response.ok) { started = true; break; } } catch {}
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
  const click = async (text, scope = "button") => assert.equal(await evaluate(`(()=>{const button=[...document.querySelectorAll(${JSON.stringify(scope)})].find(item=>item.textContent.trim()===${JSON.stringify(text)});if(!button)return false;button.click();return true;})()`), true, "Button: " + text);
  const field = async (selector, value) => { await evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});const prototype=element.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,${JSON.stringify(value)});element.dispatchEvent(new Event('input',{bubbles:true}));})()`); await wait(`document.querySelector(${JSON.stringify(selector)})?.value===${JSON.stringify(value)}`); };
  screenshot = async name => { const shot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); await writeFile(join(runtime, name), Buffer.from(shot.data, "base64")); };
  const saved = () => wait("document.querySelector('.learning-save-status')?.classList.contains('saved')");
  const closeWelcome = async () => { await wait("document.querySelector('.learner-dialog')?.open"); await click("Skip for now", ".learner-dialog button"); await wait("!document.querySelector('.learner-dialog')?.open"); };
  const signIn = async account => { await click("Sign in", ".account-trigger"); await field("#account-email", account.email); await field("#account-password", "test-password-123"); await click("Sign in", ".account-dialog button"); await wait("!document.querySelector('.account-dialog')?.open && document.querySelector('.account-trigger')?.textContent==='Account'"); };
  const signOut = async () => { await click("Account", ".account-trigger"); await click("Sign out", ".account-dialog button"); await wait("document.querySelector('.account-trigger')?.textContent==='Sign in'"); };
  await call("Runtime.enable"); await call("Page.enable"); await call("Page.bringToFront"); await call("Log.enable"); await call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await call("Page.navigate", { url: base }); await closeWelcome();
  await wait("document.querySelector('.learning-save-status')?.classList.contains('guest')");
  assert.equal(await evaluate("document.querySelectorAll('.language-card').length"), 6);
  await click("Sign in", ".account-trigger"); await click("Create an account", ".account-dialog button");
  await field("#account-email", "new@example.test"); await field("#account-password", "test-password-123"); await click("Create account", ".account-dialog button");
  await wait("document.querySelector('.account-message')?.textContent.includes('Check your email')"); assert.equal(confirmations, 1);
  await click("Back to sign in", ".account-dialog button"); await click("Forgot password?", ".account-dialog button"); await click("Send reset link", ".account-dialog button");
  await wait("document.querySelector('.account-message')?.textContent.includes('reset link')"); assert.equal(recoveries, 1);
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
  await wait("document.querySelector('.learning-save-status')?.classList.contains('guest')");
  await evaluate("document.querySelector('.brand').click()"); await signIn(accounts[0]); await saved();
  assert.ok(Object.values(states.get(accounts[0].id).state.drafts).some(item => item.value.includes("Account sync browser check")));
  await call("Page.reload"); await saved(); assert.equal(await evaluate("document.querySelector('.account-trigger').textContent"), "Account");
  const denied = await evaluate(`fetch('/api/learning',{headers:{'X-Learner-Account':${JSON.stringify(accounts[1].id)}}}).then(response=>response.status)`); assert.equal(denied, 409);
  failNextWrite = true;
  await evaluate("document.querySelector('.profile-trigger').click()");
  await wait("document.querySelector('.learner-dialog')?.open"); await click("Skip for now", ".learner-dialog button");
  await wait("document.querySelector('.learning-save-status')?.classList.contains('unavailable')");
  await call("Page.reload"); await saved(); assert.equal(await evaluate("document.querySelector('.learner-dialog').open"), false);
  await signOut(); await closeWelcome(); await signIn(accounts[1]); await saved();
  assert.deepEqual(states.get(accounts[1].id).state.drafts, {});
  await signOut(); await closeWelcome();
  await call("Page.navigate", { url: base + "/auth/confirm?token_hash=expired&type=recovery" }); await wait("location.pathname.includes('/auth/error')");
  await call("Page.navigate", { url: base + "/auth/confirm?token_hash=valid-local-recovery&type=recovery" }); await wait("document.querySelector('#new-password')");
  await field("#new-password", "changed-password-123"); await field("#confirm-password", "different-password"); await click("Update password"); await wait("document.querySelector('[role=alert]')?.textContent.includes(\"don't match\")");
  await field("#confirm-password", "changed-password-123"); await click("Update password"); await wait("document.querySelector('[role=status]')?.textContent.includes('updated')");
  await screenshot("supabase-password-reset-mobile.png");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: true, checks: ["real Next.js API routes and Supabase session cookies", "sign-up confirmation, invalid sign-in, password recovery forms", "device draft import and reload", "lost response retry", "account isolation and sign-out", "expired links and token-hash password reset", "360/390/1100/1440px layouts", "no browser exceptions"], backend: "local simulated Supabase service; no live credentials or emails used" }));
  await call("Browser.close").catch(() => {});
} catch (error) { try { await screenshot?.("supabase-browser-failure.png"); } catch {} console.error(JSON.stringify({backendCalls:backendCalls.slice(-12),errors,browserLogs,stateOwners:[...states].map(([owner,value])=>({owner,revision:value.revision,eventCount:value.events.size}))})); throw error; }
finally {
  socket?.close(); browser?.kill(); backend.close();
  if (process.platform === "win32") await new Promise(resolve => execFile("taskkill", ["/PID", String(next.pid), "/T", "/F"], { windowsHide: true }, () => resolve()));
  else next.kill();
}

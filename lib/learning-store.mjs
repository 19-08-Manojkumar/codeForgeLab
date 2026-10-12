import { applyLearningEvent, emptyLearningState, localDay } from "./learning-state.mjs";
import { validateLearningSnapshot } from "./learning-snapshot.mjs";
import { readLearnerSession, PROFILE_KEY, HANDLED_KEY } from "./learner.mjs";

export const GUEST_KEY = "codeforge.guest-learning.v1";
const outboxKey = owner => `codeforge.learning-outbox.v1:${owner}`;
const uuid = () => crypto.randomUUID();

export function readGuestLearning(storage, legacyStorage) {
  try {
    const value = JSON.parse(storage?.getItem(GUEST_KEY) || "null");
    if (value && typeof value.importId === "string" && /^[\w-]{10,80}$/.test(value.importId)) return { importId: value.importId, state: validateLearningSnapshot(value.state) };
  } catch { /* A corrupt device record must not block the lessons. */ }
  const record = { importId: uuid(), state: emptyLearningState() };
  const legacy = readLearnerSession(legacyStorage);
  if (legacy.handled) {
    record.state = applyLearningEvent(record.state, { id: uuid(), type: "profile", profile: legacy.profile });
    try {
      storage?.setItem(GUEST_KEY, JSON.stringify(record));
      if (storage) { legacyStorage?.removeItem(PROFILE_KEY); legacyStorage?.removeItem(HANDLED_KEY); }
    } catch { /* Keep the old profile until the device copy succeeds. */ }
  }
  return record;
}

export class LearningStore {
  constructor({ owner = null, storage = null, legacyStorage = null, transport, changed = () => {} } = {}) {
    this.owner = owner; this.storage = storage; this.transport = transport; this.changed = changed;
    this.abort = new AbortController(); this.busy = false; this.loaded = !owner; this.disposed = false;
    this.guest = readGuestLearning(storage, legacyStorage);
    this.state = owner ? emptyLearningState() : this.guest.state;
    this.status = owner ? "loading" : storage ? "guest" : "guest-unsaved";
    this.pending = [];
    if (owner) {
      try {
        const events = JSON.parse(storage?.getItem(outboxKey(owner)) || "[]");
        if (Array.isArray(events) && events.length <= 1000) {
          for (const event of events) {
            try { applyLearningEvent(emptyLearningState(), event); this.pending.push(event); } catch { /* Ignore a malformed stored event. */ }
          }
        }
      } catch { /* Saving can continue when browser storage is restricted. */ }
    }
  }
  snapshot() { return { state: this.state, status: this.status, identity: this.owner || "guest" }; }
  notify() { if (!this.disposed) this.changed(this.snapshot()); }
  persist() {
    try {
      if (!this.storage) return false;
      if (this.owner) {
        if (this.pending.length) this.storage.setItem(outboxKey(this.owner), JSON.stringify(this.pending));
        else this.storage.removeItem(outboxKey(this.owner));
      } else this.storage.setItem(GUEST_KEY, JSON.stringify({ importId: this.guest.importId, state: this.state }));
      return true;
    } catch { return false; }
  }
  dispatch(data) {
    if (this.disposed) return;
    const event = { ...data, id: uuid(), day: data.day || localDay() };
    try { this.state = applyLearningEvent(this.state, event); } catch { return; }
    if (!this.owner) {
      this.status = this.persist() ? "guest" : "guest-unsaved"; this.notify(); return;
    }
    const index = ["draft", "visit"].includes(event.type) ? this.pending.findIndex((item, i) => i >= (this.busy ? 1 : 0) && item.type === event.type && (event.type === "visit" || `${item.language}:${item.path}:${item.entryId}` === `${event.language}:${event.path}:${event.entryId}`)) : -1;
    if (index >= 0) this.pending[index] = event; else this.pending.push(event);
    this.persist(); this.status = this.loaded ? "saving" : "unavailable"; this.notify(); void this.pump();
  }
  async load() {
    if (this.busy || this.disposed || !this.owner) return;
    this.busy = true; this.loaded = false; this.status = "loading"; this.notify();
    try {
      const saved = await this.transport("GET", null, this.owner, this.abort.signal);
      if (this.disposed) return;
      const base = validateLearningSnapshot(saved.state);
      if (this.guest.state.eventIds.length && !this.pending.some(event => event.id === this.guest.importId)) {
        this.pending.unshift({ id: this.guest.importId, type: "import", state: this.guest.state, day: localDay() });
      }
      this.state = this.pending.reduce((value, event) => applyLearningEvent(value, event), base);
      this.persist(); this.loaded = true; this.status = this.pending.length ? "saving" : "saved"; this.notify();
    } catch { if (!this.disposed) { this.status = "unavailable"; this.notify(); } }
    finally { this.busy = false; if (this.loaded && !this.disposed) void this.pump(); }
  }
  async pump() {
    if (this.busy || !this.loaded || !this.pending.length || this.disposed) return;
    this.busy = true;
    try {
      while (this.pending.length && !this.disposed) {
        const event = this.pending[0], saved = await this.transport("POST", event, this.owner, this.abort.signal);
        if (this.disposed) return;
        const base = validateLearningSnapshot(saved.state);
        this.pending.shift(); this.persist();
        if (event.type === "import") {
          try {
            if (JSON.parse(this.storage?.getItem(GUEST_KEY) || "null")?.importId === event.id) this.storage.removeItem(GUEST_KEY);
          } catch { /* The permanent server event ID protects retries. */ }
          this.guest = { importId: uuid(), state: emptyLearningState() };
        }
        this.state = this.pending.reduce((value, queued) => applyLearningEvent(value, queued), base);
        this.status = this.pending.length ? "saving" : "saved"; this.notify();
      }
    } catch { if (!this.disposed) { this.status = "unavailable"; this.notify(); } }
    finally { this.busy = false; }
  }
  retry() {
    if (!this.owner) { this.status = this.persist() ? "guest" : "guest-unsaved"; this.notify(); }
    else return this.load();
  }
  destroy() { this.disposed = true; this.abort.abort(); }
}

export async function learningTransport(method, event, owner, signal) {
  const body = event ? JSON.stringify(event) : undefined;
  const response = await fetch("/api/learning", {
    method, cache: "no-store", credentials: "same-origin",
    headers: { "X-Learner-Account": owner, ...(body ? { "Content-Type": "application/json" } : {}) },
    body, signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
    ...(body ? { keepalive: new TextEncoder().encode(body).length <= 60000 } : {}),
  });
  if (!response.ok) { const error=new Error("Learning service unavailable"); error.status=response.status; throw error; }
  return response.json();
}

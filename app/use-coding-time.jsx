"use client";

import { useEffect } from "react";
import { localDay } from "../lib/learning-state.mjs";
import { PracticeClock } from "../lib/practice-clock.mjs";

export default function useCodingTime({ enabled, identity, dispatch }) {
  useEffect(() => {
    if (!enabled) return;
    const clock = new PracticeClock(performance.now()), token = crypto.randomUUID(), leaseKey = `codeforge.practice-clock:${identity}`;
    const send = events => events.forEach(event => dispatch(event, identity));
    function leader() {
      try {
        const previous = JSON.parse(localStorage.getItem(leaseKey) || "null"), now = Date.now();
        if (previous && previous.token !== token && now - previous.updatedAt < 5000) return false;
        localStorage.setItem(leaseKey, JSON.stringify({ token, updatedAt: now }));
        return JSON.parse(localStorage.getItem(leaseKey)).token === token;
      } catch { return false; }
    }
    function interact(event) {
      const target = event.target;
      if (!event.isTrusted || !(target instanceof Element) || !target.closest("#main-content") || !target.matches("textarea, input:not([type='search']), select")) return;
      if (event.type === "keydown" && event.key.length !== 1 && !["Enter", "Backspace", "Delete"].includes(event.key)) return;
      if (target.closest(".method-search-field, .method-group-field, .notebook-filters")) return;
      clock.interact(performance.now());
    }
    function tick() { const eligible = document.visibilityState === "visible" && document.hasFocus() && performance.now() < clock.activeUntil; send(clock.tick(performance.now(), localDay(), eligible && leader())); }
    function pause() { clock.activeUntil = 0; tick(); }
    document.addEventListener("input", interact, true);
    document.addEventListener("keydown", interact, true);
    document.addEventListener("visibilitychange", pause);
    window.addEventListener("blur", pause);
    window.addEventListener("pagehide", pause);
    const timer = setInterval(tick, 1000);
    return () => {
      clearInterval(timer); send(clock.flush());
      document.removeEventListener("input", interact, true); document.removeEventListener("keydown", interact, true); document.removeEventListener("visibilitychange", pause);
      window.removeEventListener("blur", pause); window.removeEventListener("pagehide", pause);
      try { if (JSON.parse(localStorage.getItem(leaseKey) || "null")?.token === token) localStorage.removeItem(leaseKey); } catch {}
    };
  }, [enabled, identity, dispatch]);
}

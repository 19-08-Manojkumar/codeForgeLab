"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizePageLocation, pageLocationUrl, readPageLocation } from "../lib/page-location.mjs";

export default function usePageLocation() {
  const current = useRef(null);
  const [snapshot, setSnapshot] = useState(() => ({ page: normalizePageLocation(), ready: false, revision: 0 }));
  useEffect(() => {
    function restore() {
      const page = readPageLocation(window.location.search);
      current.current = page;
      window.history.replaceState(null, "", pageLocationUrl(window.location.href, page));
      setSnapshot(previous => ({ page, ready: true, revision: previous.revision + 1 }));
    }
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  const navigate = useCallback(value => {
    const page = normalizePageLocation(value), url = pageLocationUrl(window.location.href, page);
    current.current = page;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.pushState(null, "", url);
    setSnapshot(previous => ({ page, ready: true, revision: previous.revision + 1 }));
  }, []);
  // Topic and tab updates must not remount the workspace or reset its editors.
  const remember = useCallback(value => {
    if (!current.current) return;
    const page = normalizePageLocation({ ...current.current, ...value }), url = pageLocationUrl(window.location.href, page);
    current.current = page;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.replaceState(null, "", url);
  }, []);
  return { ...snapshot, navigate, remember };
}

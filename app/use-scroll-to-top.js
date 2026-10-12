"use client";

import { useEffect } from "react";

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function useScrollToTop(trigger) {
  useEffect(() => {
    scrollToTop();
  }, [trigger]);
}

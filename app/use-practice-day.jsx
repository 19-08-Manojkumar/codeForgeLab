"use client";
import { useEffect, useState } from "react";
import { localDay } from "../lib/learning-state.mjs";

export default function usePracticeDay() {
  const [day, setDay] = useState(null);
  useEffect(() => {
    const update = () => setDay(localDay());
    update(); const timer = setInterval(update, 30000);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, []);
  return day;
}

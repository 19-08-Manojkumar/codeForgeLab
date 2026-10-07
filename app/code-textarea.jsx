"use client";
import { useRef, useState } from "react";
import { toggleCodeComments } from "../lib/code-comments.mjs";

export default function CodeTextarea({ language, value, onValueChange, onKeyDown, maxLength, ...props }) {
  const field = useRef(null), [message, setMessage] = useState("");
  function toggle() {
    const editor = field.current;
    if (!editor) return;
    try {
      const changed = toggleCodeComments(value, editor.selectionStart, editor.selectionEnd, language);
      if (maxLength && changed.value.length > maxLength) throw new TypeError("Shorten the code before adding a comment; this editor has reached its character limit.");
      setMessage(""); onValueChange(changed.value);
      requestAnimationFrame(() => { editor.focus({ preventScroll: true }); editor.setSelectionRange(changed.selectionStart, changed.selectionEnd); });
    } catch (error) { setMessage(error.message); }
  }
  return <div className="commentable-code"><div className="code-comment-tools"><button type="button" className="text-button" onClick={toggle} aria-label="Comment or uncomment selected code lines">Comment / uncomment</button><span>Ctrl+/ or ⌘/ · selected lines</span></div><textarea {...props} ref={field} value={value} maxLength={maxLength} onChange={event => { setMessage(""); onValueChange(event.target.value); }} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && !event.altKey && (event.key === "/" || event.code === "Slash")) { event.preventDefault(); toggle(); } else onKeyDown?.(event); }}/>{message && <p className="field-hint" role="status">{message}</p>}</div>;
}

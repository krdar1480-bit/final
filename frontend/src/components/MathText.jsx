import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Renders a string that may contain LaTeX math wrapped in $...$ (inline) or $$...$$ (block).
// Plain text (including line breaks via whitespace-pre-line on the parent) is preserved.
export default function MathText({ children, className }) {
  const text = children == null ? "" : String(children);
  if (!text) return null;

  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  const parts = [];
  let last = 0;
  let key = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ type: "text", value: text.slice(last, m.index), key: key++ });
    }
    const isBlock = m[1] !== undefined;
    parts.push({ type: "math", value: isBlock ? m[1] : m[2], block: isBlock, key: key++ });
    last = regex.lastIndex;
  }
  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last), key: key++ });
  }

  return (
    <span className={className}>
      {parts.map((p) => {
        if (p.type === "text") {
          return <React.Fragment key={p.key}>{p.value}</React.Fragment>;
        }
        let html;
        try {
          html = katex.renderToString(p.value, {
            throwOnError: false,
            displayMode: p.block,
            output: "html",
          });
        } catch (e) {
          return <React.Fragment key={p.key}>{p.value}</React.Fragment>;
        }
        return (
          <span
            key={p.key}
            className={p.block ? "my-1 block overflow-x-auto" : "inline-block align-middle"}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
}

"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";

// 预设调色板（十六进制，不含 #）
const PALETTE = [
  "ef4444", "f97316", "eab308", "22c55e", "06b6d4",
  "3b82f6", "a855f7", "ec4899", "9ca3af", "ffffff",
];

// 颜色语法 {{#hex}}文字{{/}} → <span style="color:#hex">文字</span>
// 注意：颜色标记内不支持嵌套 Markdown 格式（编辑器只对纯文本选区包裹）
function rehypeColor() {
  return (tree: any) => walk(tree);

  function walk(node: any) {
    if (!node.children) return;
    const next: any[] = [];
    for (const child of node.children) {
      if (child.type === "text") {
        next.push(...splitText(child.value));
      } else {
        walk(child);
        next.push(child);
      }
    }
    node.children = next;
  }

  function splitText(value: string) {
    const RE = /\{\{#([0-9a-fA-F]{3,8})\}\}([\s\S]*?)\{\{\/\}\}/g;
    const nodes: any[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = RE.exec(value))) {
      if (m.index > last) {
        nodes.push({ type: "text", value: value.slice(last, m.index) });
      }
      nodes.push({
        type: "element",
        tagName: "span",
        properties: { style: `color:#${m[1]}` },
        children: [{ type: "text", value: m[2] }],
      });
      last = m.index + m[0].length;
    }
    if (last < value.length) {
      nodes.push({ type: "text", value: value.slice(last) });
    }
    return nodes;
  }
}

// Markdown 编辑器：左侧源码（带调色板），右侧实时预览
export default function MarkdownEditor({
  initialContent = "",
  onChange,
}: {
  initialContent?: string;
  onChange?: (content: string) => void;
}) {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleChange(value: string) {
    setContent(value);
    onChange?.(value);
  }

  // 给选中文字（或光标处）套上颜色标记
  function applyColor(hex: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    // 去掉选区里已有的颜色标记，避免重复上色嵌套成 {{#a}}{{#b}}…{{/}}{{/}}
    const cleaned = content
      .slice(start, end)
      .replace(/\{\{#[0-9a-fA-F]{3,8}\}\}|\{\{\/\}\}/g, "");
    const wrapped = `{{#${hex}}}${cleaned}{{/}}`;
    const next = content.slice(0, start) + wrapped + content.slice(end);
    handleChange(next);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      if (start === end) {
        const pos = start + `{{#${hex}}}`.length;
        el.setSelectionRange(pos, pos);
      } else {
        el.setSelectionRange(start, start + wrapped.length);
      }
    });
  }

  return (
    <div className="grid h-full grid-cols-1 divide-y divide-[var(--border)] md:grid-cols-2 md:divide-x md:divide-y-0">
      {/* 左侧：调色板 + 源码 */}
      <div className="flex h-full min-h-[50vh] flex-col">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border)] px-2 py-2">
          {PALETTE.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => applyColor(hex)}
              title={`#${hex}`}
              className="h-5 w-5 rounded-full border border-[var(--border)]"
              style={{ backgroundColor: `#${hex}` }}
            />
          ))}
          <label className="ml-1 flex h-5 cursor-pointer items-center gap-1 rounded-full border border-[var(--border)] px-2 text-[10px] text-[var(--text-muted)]">
            自定义
            <input
              type="color"
              className="h-3.5 w-5 cursor-pointer border-0 bg-transparent p-0"
              onChange={(e) => applyColor(e.target.value.slice(1))}
            />
          </label>
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="开始输入 Markdown..."
          className="min-h-0 flex-1 resize-none border-0 bg-transparent p-5 font-mono text-sm leading-relaxed text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
        />
      </div>
      {/* 右侧：预览 */}
      <div className="prose prose-invert h-full max-w-none overflow-y-auto p-5">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeHighlight, rehypeColor]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

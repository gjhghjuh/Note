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

// 预设字号（像素）
const SIZES = ["12", "14", "16", "18", "20", "24", "28", "32"];

// 颜色/字号标记正则：上色或改字号前剥离选区已有标记，避免嵌套成 {{#a}}{{!20}}…{{/}}{{/}}
const STYLE_MARKER_RE = /\{\{#[0-9a-fA-F]{3,8}\}\}|\{\{!\d{1,3}\}\}|\{\{\/\}\}/g;

// 样式语法：{{#hex}}文字{{/}} → 颜色；{{!N}}文字{{/}} → 字号 Npx
// 注意：标记内不支持嵌套 Markdown 格式（编辑器只对纯文本选区包裹）
function rehypeStyle() {
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
    // 颜色 {{#hex}} 或 字号 {{!N}}，统一用 {{/}} 关闭
    const RE = /\{\{(?:#([0-9a-fA-F]{3,8})|!(\d{1,3}))\}\}([\s\S]*?)\{\{\/\}\}/g;
    const nodes: any[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = RE.exec(value))) {
      if (m.index > last) {
        nodes.push({ type: "text", value: value.slice(last, m.index) });
      }
      const style = m[1] ? `color:#${m[1]}` : `font-size:${m[2]}px`;
      nodes.push({
        type: "element",
        tagName: "span",
        properties: { style },
        children: [{ type: "text", value: m[3] }],
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
    // 剥离选区里已有的颜色/字号标记，避免嵌套
    const cleaned = content
      .slice(start, end)
      .replace(STYLE_MARKER_RE, "");
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

  // 给选中文字（或光标处）套上字号标记
  function applySize(px: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    // 剥离选区里已有的颜色/字号标记，避免嵌套
    const cleaned = content
      .slice(start, end)
      .replace(STYLE_MARKER_RE, "");
    const wrapped = `{{!${px}}}${cleaned}{{/}}`;
    const next = content.slice(0, start) + wrapped + content.slice(end);
    handleChange(next);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      if (start === end) {
        const pos = start + `{{!${px}}}`.length;
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
        <div className="space-y-2 border-b border-[var(--border)] px-2 py-2">
          {/* 颜色行 */}
          <div className="flex flex-wrap items-center gap-1.5">
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
          {/* 字号行 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {SIZES.map((px) => (
              <button
                key={px}
                type="button"
                onClick={() => applySize(px)}
                title={`${px}px`}
                className="rounded border border-[var(--border)] px-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                {px}
              </button>
            ))}
            <label className="ml-1 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              自定义
              <input
                type="number"
                min="8"
                max="72"
                placeholder="px"
                className="w-14 rounded border border-[var(--border)] bg-transparent px-1 py-0.5 text-xs text-[var(--text)] outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v) applySize(v);
                  }
                }}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v) applySize(v);
                }}
              />
            </label>
          </div>
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
          rehypePlugins={[rehypeHighlight, rehypeStyle]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

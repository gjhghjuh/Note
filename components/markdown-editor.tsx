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

// 完整样式标记：{{#hex!N}}文字{{/}}，#hex（颜色）与 !N（字号）均可选、顺序固定、至少一个
// 例子：{{#ef4444}}红{{/}}  {{!20}}大{{/}}  {{#ef4444!20}}红且大{{/}}
const MARKER_RE = /\{\{(?:#([0-9a-fA-F]{3,8}))?(?:!(\d{1,3}))?\}\}([\s\S]*?)\{\{\/\}\}/g;

// 剥离选区里的标记片段（开标记 + 闭标记），包裹纯文本前清理
const MARKER_FRAGMENT_RE = /\{\{(?:#[0-9a-fA-F]{3,8})?(?:!\d{1,3})?\}\}|\{\{\/\}\}/g;

// 生成开标记 {{#hex!N}}
function markerHead(prop: { color?: string | null; size?: string | null }) {
  const head = `${prop.color ? `#${prop.color}` : ""}${prop.size ? `!${prop.size}` : ""}`;
  return `{{${head}}}`;
}

// 生成完整标记 {{#hex!N}}文字{{/}}
function buildMarker(prop: { color?: string | null; size?: string | null }, text: string) {
  return `${markerHead(prop)}${text}{{/}}`;
}

// 查找包含 [start, end) 的完整标记，用于「合并进已有标记」
function findEnclosingMarker(text: string, start: number, end: number) {
  MARKER_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MARKER_RE.exec(text))) {
    const mStart = m.index;
    const mEnd = m.index + m[0].length;
    if (mStart <= start && end <= mEnd) {
      return {
        start: mStart,
        end: mEnd,
        color: m[1] ?? null,
        size: m[2] ?? null,
        text: m[3],
      };
    }
  }
  return null;
}

// 样式语法：{{#hex!N}}文字{{/}} → 颜色和/或字号；#hex 与 !N 均可选（至少一个）
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
    const nodes: any[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    MARKER_RE.lastIndex = 0;
    while ((m = MARKER_RE.exec(value))) {
      if (m.index > last) {
        nodes.push({ type: "text", value: value.slice(last, m.index) });
      }
      const style: string[] = [];
      if (m[1]) style.push(`color:#${m[1]}`);
      if (m[2]) style.push(`font-size:${m[2]}px`);
      nodes.push({
        type: "element",
        tagName: "span",
        properties: { style: style.join(";") },
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

  // 给选中文字套上样式；选区落在已有标记内则合并（颜色/字号互不覆盖），否则包裹纯文本
  function applyStyle(prop: { color?: string; size?: string }) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    // 光标无选区：在光标处插入空标记，供后续输入
    if (start === end) {
      const marker = buildMarker(prop, "");
      handleChange(content.slice(0, start) + marker + content.slice(end));
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        const pos = start + markerHead(prop).length;
        el.setSelectionRange(pos, pos);
      });
      return;
    }

    // 有选区：优先合并进已有标记，否则包裹纯文本
    const enclosing = findEnclosingMarker(content, start, end);
    let next: string;
    let selStart: number;
    let selEnd: number;
    if (enclosing) {
      // 合并：保留原文字与未指定属性，更新指定属性
      const color = prop.color ?? enclosing.color;
      const size = prop.size ?? enclosing.size;
      const marker = buildMarker({ color, size }, enclosing.text);
      next = content.slice(0, enclosing.start) + marker + content.slice(enclosing.end);
      selStart = enclosing.start;
      selEnd = enclosing.start + marker.length;
    } else {
      // 纯文本：先剥离选区里残留的标记片段，再包裹
      const cleaned = content.slice(start, end).replace(MARKER_FRAGMENT_RE, "");
      const marker = buildMarker(prop, cleaned);
      next = content.slice(0, start) + marker + content.slice(end);
      selStart = start;
      selEnd = start + marker.length;
    }
    handleChange(next);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    });
  }

  function applyColor(hex: string) {
    applyStyle({ color: hex });
  }

  function applySize(px: string) {
    applyStyle({ size: px });
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

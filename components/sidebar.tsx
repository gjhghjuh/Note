"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createNotebook, deleteNotebook } from "@/lib/actions/notebook";
import { createTag, deleteTag } from "@/lib/actions/tag";

type Notebook = { id: string; name: string };
type Tag = { id: string; name: string };

// 侧栏：搜索 + 笔记本/标签过滤与增删
export default function Sidebar({
  notebooks,
  tags,
  activeNotebook,
  activeTag,
  q,
}: {
  notebooks: Notebook[];
  tags: Tag[];
  activeNotebook?: string;
  activeTag?: string;
  q?: string;
}) {
  const router = useRouter();

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 border-r border-[var(--border)] bg-[var(--surface)]/40 p-4 backdrop-blur-sm">
      {/* 搜索（ISSUE-9） */}
      <SearchBox q={q} />

      {/* 笔记本 */}
      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          笔记本
        </h2>
        <ul className="space-y-1">
          <li>
            <Link
              href="/"
              className={`block rounded px-2 py-1 text-sm hover:bg-[var(--surface)] ${
                !activeNotebook && !activeTag
                  ? "bg-[var(--surface)] text-[var(--text)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              全部笔记
            </Link>
          </li>
          {notebooks.map((nb) => (
            <li key={nb.id} className="group flex items-center">
              <Link
                href={`/?notebook=${nb.id}`}
                className={`block flex-1 truncate rounded px-2 py-1 text-sm hover:bg-[var(--surface)] ${
                  activeNotebook === nb.id
                    ? "bg-[var(--surface)] text-[var(--text)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {nb.name}
              </Link>
              <button
                onClick={async () => {
                  await deleteNotebook(nb.id);
                  router.refresh();
                }}
                className="mr-1 hidden text-[var(--text-muted)] group-hover:block hover:text-[var(--text)]"
                title="删除笔记本"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <NewItem
          placeholder="新建笔记本"
          onCreate={async (name) => {
            await createNotebook(name);
            router.refresh();
          }}
        />
      </section>

      {/* 标签 */}
      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          标签
        </h2>
        <ul className="space-y-1">
          {tags.map((tag) => (
            <li key={tag.id} className="group flex items-center">
              <Link
                href={`/?tag=${tag.id}`}
                className={`block flex-1 truncate rounded px-2 py-1 text-sm hover:bg-[var(--surface)] ${
                  activeTag === tag.id
                    ? "bg-[var(--surface)] text-[var(--text)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                #{tag.name}
              </Link>
              <button
                onClick={async () => {
                  await deleteTag(tag.id);
                  router.refresh();
                }}
                className="mr-1 hidden text-[var(--text-muted)] group-hover:block hover:text-[var(--text)]"
                title="删除标签"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <NewItem
          placeholder="新建标签"
          onCreate={async (name) => {
            await createTag(name);
            router.refresh();
          }}
        />
      </section>
    </aside>
  );
}

// 新建输入行：输入名称后回车或点 + 提交
function NewItem({
  placeholder,
  onCreate,
}: {
  placeholder: string;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onCreate(trimmed);
    setName("");
  }

  return (
    <form onSubmit={submit} className="mt-2 flex gap-1">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded border border-[var(--border)] bg-transparent px-2 py-1 text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--text-muted)]"
      />
      <button
        type="submit"
        className="rounded border border-[var(--border)] px-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        +
      </button>
    </form>
  );
}

// 搜索框：防抖后更新 URL 查询参数，服务端据此过滤
function SearchBox({ q }: { q?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(q ?? "");
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const trimmed = value.trim();
      router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
    }, 300);
    return () => clearTimeout(timer);
  }, [value, router]);

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="搜索笔记..."
      className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--text-muted)]"
    />
  );
}

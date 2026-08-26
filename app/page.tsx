import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Sidebar from "@/components/sidebar";

export const dynamic = "force-dynamic";

// 首页：侧栏 + 笔记列表，支持笔记本/标签过滤与关键词搜索
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ notebook?: string; tag?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { notebook, tag, q } = await searchParams;

  const where: Prisma.NoteWhereInput = {
    userId: user.id,
    ...(notebook ? { notebookId: notebook } : {}),
    ...(tag ? { tags: { some: { id: tag } } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [notes, notebooks, tags] = await Promise.all([
    prisma.note.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { notebook: true, tags: true },
    }),
    prisma.notebook.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
    prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        notebooks={notebooks}
        tags={tags}
        activeNotebook={notebook}
        activeTag={tag}
        q={q}
      />
      <main className="flex-1 p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Noteped</h1>
            <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/auth/signout"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              退出登录
            </a>
            <Link
              href="/note/new"
              className="rounded bg-[var(--text)] px-3 py-2 text-sm font-medium text-[var(--bg)] hover:opacity-90"
            >
              新建笔记
            </Link>
          </div>
        </header>

        {notes.length === 0 ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/60 p-6 text-[var(--text-muted)]">
            {q
              ? `没有匹配「${q}」的笔记。`
              : "还没有笔记，点击右上角「新建笔记」开始。"}
          </div>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note.id}>
                <Link
                  href={`/note/${note.id}`}
                  className="block rounded border border-[var(--border)] bg-[var(--surface)]/60 p-4 backdrop-blur-sm hover:border-[var(--text-muted)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{note.title || "无标题"}</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {note.updatedAt.toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    {note.notebook && <span>{note.notebook.name}</span>}
                    {note.tags.length > 0 && (
                      <span>{note.tags.map((t) => `#${t.name}`).join(" ")}</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

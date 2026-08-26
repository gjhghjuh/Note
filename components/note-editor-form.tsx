"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownEditor from "@/components/markdown-editor";
import { createNote, updateNote } from "@/lib/actions/note";

type Notebook = { id: string; name: string };
type Tag = { id: string; name: string };

// 笔记编辑表单：新建与编辑共用，保存走 Server Action
export default function NoteEditorForm({
  note,
  notebooks,
  tags,
}: {
  note?: {
    id: string;
    title: string;
    content: string;
    notebookId: string | null;
    tagIds: string[];
  };
  notebooks: Notebook[];
  tags: Tag[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [notebookId, setNotebookId] = useState<string | null>(
    note?.notebookId ?? null
  );
  const [tagIds, setTagIds] = useState<string[]>(note?.tagIds ?? []);
  const [saving, setSaving] = useState(false);

  function toggleTag(id: string) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const input = { title, content, notebookId, tagIds };
      if (note) {
        await updateNote(note.id, input);
      } else {
        await createNote(input);
      }
      router.push("/");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-3 p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题"
          className="flex-1 border-0 bg-transparent text-lg font-semibold outline-none placeholder:text-[var(--text-muted)]"
        />
        <select
          value={notebookId ?? ""}
          onChange={(e) => setNotebookId(e.target.value || null)}
          className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm text-[var(--text)]"
        >
          <option value="">无笔记本</option>
          {notebooks.map((nb) => (
            <option key={nb.id} value={nb.id}>
              {nb.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-[var(--text)] px-3 py-1.5 text-sm font-medium text-[var(--bg)] disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 px-4 pb-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              tagIds.includes(tag.id)
                ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]"
                : "border-[var(--border)] text-[var(--text-muted)]"
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <MarkdownEditor initialContent={content} onChange={setContent} />
      </div>
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NoteEditorForm from "@/components/note-editor-form";

export const dynamic = "force-dynamic";

// 编辑笔记页：加载目标笔记 + 笔记本 + 标签，渲染预填表单
export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const note = await prisma.note.findFirst({
    where: { id, userId: user.id },
    include: { tags: true },
  });
  if (!note) notFound();

  const [notebooks, tags] = await Promise.all([
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
    <NoteEditorForm
      note={{
        id: note.id,
        title: note.title,
        content: note.content,
        notebookId: note.notebookId,
        tagIds: note.tags.map((t) => t.id),
      }}
      notebooks={notebooks}
      tags={tags}
    />
  );
}

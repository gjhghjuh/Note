import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NoteEditorForm from "@/components/note-editor-form";

export const dynamic = "force-dynamic";

// 新建笔记页：加载当前用户的笔记本与标签，渲染空编辑表单
export default async function NewNotePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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

  return <NoteEditorForm notebooks={notebooks} tags={tags} />;
}

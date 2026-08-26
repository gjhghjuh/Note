"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// 笔记变更的输入约束
export type NoteInput = {
  title: string;
  content: string;
  notebookId: string | null;
  tagIds: string[];
};

export async function createNote(input: NoteInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("未登录");

  const note = await prisma.note.create({
    data: {
      title: input.title,
      content: input.content,
      userId: user.id,
      notebookId: input.notebookId,
      tags: input.tagIds.length
        ? { connect: input.tagIds.map((id) => ({ id })) }
        : undefined,
    },
  });
  revalidatePath("/");
  return note;
}

export async function updateNote(id: string, input: NoteInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("未登录");

  const existing = await prisma.note.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new Error("笔记不存在");

  const note = await prisma.note.update({
    where: { id },
    data: {
      title: input.title,
      content: input.content,
      notebookId: input.notebookId,
      version: { increment: 1 },
      tags: { set: input.tagIds.map((id) => ({ id })) },
    },
  });
  revalidatePath("/");
  return note;
}

export async function deleteNote(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("未登录");

  await prisma.note.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/");
}

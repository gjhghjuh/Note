"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function createNotebook(name: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("未登录");

  const notebook = await prisma.notebook.create({
    data: { name, userId: user.id },
  });
  revalidatePath("/");
  return notebook;
}

export async function renameNotebook(id: string, name: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("未登录");

  await prisma.notebook.updateMany({
    where: { id, userId: user.id },
    data: { name },
  });
  revalidatePath("/");
}

export async function deleteNotebook(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("未登录");

  // 删除后其下笔记的 notebookId 会被置空（schema 里 onDelete: SetNull）
  await prisma.notebook.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/");
}

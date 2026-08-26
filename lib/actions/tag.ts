"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function createTag(name: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("未登录");

  // 重名由 schema 的 @@unique([userId, name]) 兜底，重复会抛错
  const tag = await prisma.tag.create({
    data: { name, userId: user.id },
  });
  revalidatePath("/");
  return tag;
}

export async function deleteTag(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("未登录");

  await prisma.tag.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/");
}

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import nodemailer from "nodemailer";
import { prisma } from "./db";

// 开发模式：用 globalThis 暂存最近的登录链接（跨模块实例共享），供登录页直接展示
const loginUrlStore = globalThis as unknown as { latestLoginUrl?: string };

export function getLatestLoginUrl(): string | null {
  return loginUrlStore.latestLoginUrl ?? null;
}

// 认证配置：邮箱魔法链接 + JWT 会话
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      sendVerificationRequest: async ({ identifier, url }) => {
        if (process.env.SMTP_HOST) {
          // 配置了 SMTP：真正发送邮件
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
          await transporter.sendMail({
            to: identifier,
            from: process.env.SMTP_USER,
            subject: "登录 Noteped",
            text: `打开以下链接登录 Noteped：\n${url}\n`,
            html: `<p>点击链接登录 Noteped：</p><p><a href="${url}">${url}</a></p>`,
          });
        } else {
          // 未配置 SMTP：开发环境把链接留在内存与日志，供登录页展示
          loginUrlStore.latestLoginUrl = url;
          console.log(`Noteped 登录链接（${identifier}）: ${url}`);
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
};

// 获取当前登录的完整用户（含 id），未登录返回 null
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

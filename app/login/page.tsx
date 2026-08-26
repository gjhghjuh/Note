"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

// 登录页：邮箱魔法链接。开发模式未配 SMTP 时自动完成登录
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn("email", { email, redirect: false });
    // 未配置 SMTP（开发模式）：自动跳转到登录链接完成登录
    const res = await fetch("/api/dev/login-link");
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    // 配置了 SMTP：提示查收邮件
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-sm p-8">
        <p>登录链接已发送到 {email}。</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          请查收邮箱并点击其中的链接登录。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm p-8">
      <h1 className="mb-6 text-xl font-semibold">登录 Noteped</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--text-muted)]"
        />
        <button
          type="submit"
          className="w-full rounded bg-[var(--text)] px-3 py-2 text-sm font-medium text-[var(--bg)] hover:opacity-90"
        >
          登录
        </button>
      </form>
    </div>
  );
}

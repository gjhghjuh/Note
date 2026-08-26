import type { Metadata } from "next";
import "./globals.css";
import "highlight.js/styles/github-dark.css";
import WallpaperBackground from "@/components/wallpaper-background";
import AudioProvider from "@/components/audio-provider";

export const metadata: Metadata = {
  title: "Noteped",
  description: "面向个人知识管理的 Markdown 笔记应用",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        {/* 壁纸背景层：位于内容之下 */}
        <WallpaperBackground />
        {/* 键入音效 Provider：ISSUE-11 实现 Web Audio 逻辑 */}
        <AudioProvider />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}

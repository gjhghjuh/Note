"use client";

import { useEffect, useRef, useState } from "react";

type Wallpaper = { url: string; type: "image" | "video" };

// 壁纸背景：支持上传本地图片/视频，深色遮罩保证文字可读
export default function WallpaperBackground() {
  const [wallpaper, setWallpaper] = useState<Wallpaper | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 首次加载：读本地缓存恢复上次的壁纸
  useEffect(() => {
    const saved = localStorage.getItem("noteped:wallpaper");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Wallpaper;
        if (parsed.url) setWallpaper(parsed);
      } catch {
        // 忽略损坏的本地缓存
      }
    }
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.url) {
      const next = { url: data.url as string, type: data.type as Wallpaper["type"] };
      setWallpaper(next);
      localStorage.setItem("noteped:wallpaper", JSON.stringify(next));
    }
    e.target.value = "";
  }

  return (
    <>
      {/* 壁纸层：视频或图片 */}
      {wallpaper?.type === "video" ? (
        <video
          src={wallpaper.url}
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 z-0 h-full w-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="fixed inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: wallpaper ? `url(${wallpaper.url})` : undefined }}
        />
      )}
      {/* 深色遮罩层：保证正文可读 */}
      <div
        aria-hidden
        className="fixed inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(160deg, rgba(13,17,23,0.85) 0%, rgba(13,17,23,0.55) 50%, rgba(13,17,23,0.8) 100%)",
        }}
      />
      {/* 上传壁纸按钮 */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-4 right-4 z-20 rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-1.5 text-xs text-[var(--text-muted)] backdrop-blur hover:text-[var(--text)]"
      >
        上传壁纸
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFile}
        className="hidden"
      />
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

// 键入音效：用户上传自己的音频文件，普通按键与 Enter 键可用不同音效
export default function AudioProvider() {
  const [keyUrl, setKeyUrl] = useState<string | null>(null);
  const [enterUrl, setEnterUrl] = useState<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const keyBufferRef = useRef<AudioBuffer | null>(null);
  const enterBufferRef = useRef<AudioBuffer | null>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const enterInputRef = useRef<HTMLInputElement>(null);

  // 恢复上次上传的音效
  useEffect(() => {
    setKeyUrl(localStorage.getItem("noteped:key-sound"));
    setEnterUrl(localStorage.getItem("noteped:enter-sound"));
  }, []);

  function getContext(): AudioContext {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  }

  // 音效 URL 变化时解码到内存，播放时零延迟
  useEffect(() => {
    const ctx = getContext();
    async function load(url: string | null, ref: { current: AudioBuffer | null }) {
      if (!url) {
        ref.current = null;
        return;
      }
      try {
        const res = await fetch(url);
        ref.current = await ctx.decodeAudioData(await res.arrayBuffer());
      } catch {
        ref.current = null; // 解码失败则静音
      }
    }
    load(keyUrl, keyBufferRef);
    load(enterUrl, enterBufferRef);
  }, [keyUrl, enterUrl]);

  function play(buffer: AudioBuffer | null) {
    if (!buffer) return;
    const ctx = getContext();
    if (ctx.state === "suspended") ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start();
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // 输入法组词期间的按键不单独发声，交给 compositionupdate 处理
      if (e.isComposing) return;
      if (e.key.length !== 1 && e.key !== "Backspace" && e.key !== "Enter") return;
      play(e.key === "Enter" ? enterBufferRef.current : keyBufferRef.current);
    }

    // 中文等输入法组词：每敲一个拼音字母/候选变化都发声
    function onCompositionUpdate() {
      play(keyBufferRef.current);
    }

    // 选词上屏：用 Enter 音效作为确认反馈
    function onCompositionEnd() {
      play(enterBufferRef.current);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("compositionupdate", onCompositionUpdate);
    window.addEventListener("compositionend", onCompositionEnd);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("compositionupdate", onCompositionUpdate);
      window.removeEventListener("compositionend", onCompositionEnd);
    };
  }, []);

  async function upload(file: File, kind: "key" | "enter") {
    const formData = new FormData();
    formData.set("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!data.url) return;
    if (kind === "key") {
      setKeyUrl(data.url);
      localStorage.setItem("noteped:key-sound", data.url);
    } else {
      setEnterUrl(data.url);
      localStorage.setItem("noteped:enter-sound", data.url);
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-20 flex flex-col gap-1.5">
      <button
        onClick={() => keyInputRef.current?.click()}
        className="rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-1.5 text-xs text-[var(--text-muted)] backdrop-blur hover:text-[var(--text)]"
      >
        普通按键音效{keyUrl ? "（已设置）" : "（未设置）"}
      </button>
      <button
        onClick={() => enterInputRef.current?.click()}
        className="rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-1.5 text-xs text-[var(--text-muted)] backdrop-blur hover:text-[var(--text)]"
      >
        Enter 音效{enterUrl ? "（已设置）" : "（未设置）"}
      </button>
      <input
        ref={keyInputRef}
        type="file"
        accept="audio/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f, "key");
          e.target.value = "";
        }}
        className="hidden"
      />
      <input
        ref={enterInputRef}
        type="file"
        accept="audio/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f, "enter");
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// 文件上传：保存壁纸（图片/视频）与键入音效（音频）到 public/uploads，返回可访问 URL
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "缺少文件" }, { status: 400 });
  }

  const isVideo = file.type.startsWith("video");
  const isAudio = file.type.startsWith("audio");
  if (!file.type.startsWith("image") && !isVideo && !isAudio) {
    return Response.json({ error: "仅支持图片、视频或音频" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase() || (isVideo ? ".mp4" : isAudio ? ".mp3" : ".jpg");
  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  const type = isVideo ? "video" : isAudio ? "audio" : "image";
  return Response.json({ url: `/uploads/${filename}`, type });
}

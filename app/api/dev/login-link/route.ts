import { getLatestLoginUrl } from "@/lib/auth";

// 开发辅助：返回最近一次生成的登录链接（仅在未配置 SMTP 时有值）
export async function GET() {
  return Response.json({ url: getLatestLoginUrl() });
}

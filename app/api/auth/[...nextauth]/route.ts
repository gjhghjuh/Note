import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Auth.js 路由：处理邮箱登录的请求与回调
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

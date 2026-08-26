import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 配置：迁移/内省用连接串从 schema 移到此处
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: "prisma/migrations",
  },
});

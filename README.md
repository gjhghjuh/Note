# Noteped

个人知识管理的 Markdown 笔记应用。用笔记本与标签组织笔记，支持全文搜索；编辑器分栏实时预览，可对文字自选颜色与字号、插入自定义表格；支持壁纸背景与键入音效。

## 功能特性

- **邮箱魔法链接登录**：基于 next-auth v4，开发模式未配置 SMTP 时自动完成登录。
- **笔记管理**：笔记的增删改查，笔记本与标签分类。
- **分栏 Markdown 编辑器**：左侧源码 + 右侧实时预览，支持 GFM 与代码高亮。
- **文字自选样式**：任意行或词可独立设置颜色与字号（见下文「自定义样式语法」）。
- **自定义表格**：工具栏网格选择器插入任意行列的表格（见下文「插入表格」）。
- **壁纸背景**：上传图片或视频作为应用背景。
- **键入音效**：上传自己的音频作为按键音，普通按键与 Enter 键可用不同音效，支持中文输入法。
- **全文搜索**：按标题与正文搜索笔记。

## 自定义样式语法

编辑器预览使用自定义语法给文字着色、调整字号：

```
{{#ef4444}}红色文字{{/}}    {{!20}}大号文字{{/}}    {{#3b82f6!20}}蓝色大字{{/}}
```

`{{#hex}}` 设定颜色（`hex` 为十六进制，可不带 `#`），`{{!N}}` 设定字号（`N` 为像素值），两者可单独使用，也可组合成 `{{#hex!N}}`；`{{/}}` 表示结束。同一行内可用不同样式、不同区间各自设置，互不影响。样式区间内的文字按纯文本处理，不解析嵌套的 Markdown 格式。

## 插入表格

工具栏的「插入表格」按钮打开网格选择器，鼠标划过实时预览行列，点击即在光标处插入对应大小的 GFM 表格（首行作表头），预览区按标准 Markdown 表格渲染：

```
| 表头1 | 表头2 | 表头3 |
| --- | --- | --- |
| 内容  | 内容  | 内容  |
```

## 技术栈

- **框架**：Next.js 16（App Router / Turbopack）+ React 19 + TypeScript
- **样式**：Tailwind CSS v4
- **数据库**：PostgreSQL 16 + Prisma 7（`@prisma/adapter-pg` 驱动适配器）
- **认证**：next-auth v4（邮箱魔法链接）+ nodemailer
- **Markdown**：react-markdown + remark-gfm + remark-breaks + rehype-highlight
- **客户端状态**：zustand

## 目录结构

```
app/          页面与路由（App Router）、Server Actions、API 路由
components/   客户端组件（编辑器、音效、侧栏、壁纸等）
lib/          服务端工具（Prisma 客户端、认证、数据操作）
prisma/       Prisma schema 与迁移
public/       静态资源（上传的壁纸/音效位于 public/uploads，不入库）
```

## 环境要求

- Node.js 20 或更高（建议 22 LTS）
- Docker（本地运行 PostgreSQL）
- npm

## 快速开始

1. 安装依赖：

   ```bash
   npm install
   ```

   `postinstall` 会自动执行 `prisma generate`，把 Prisma 客户端生成到 `generated/`（已 gitignore）。

2. 启动 PostgreSQL：

   ```bash
   docker compose up -d
   ```

3. 配置环境变量：将 `.env.example` 复制为 `.env` 并填写。

   Windows PowerShell：

   ```powershell
   Copy-Item .env.example .env
   ```

   开发模式只需 `DATABASE_URL` 与 `NEXTAUTH_SECRET` 即可；不配置 SMTP 时会走本地自动登录。

4. 初始化数据库：

   ```bash
   npx prisma migrate dev --name init
   ```

   也可用 `npx prisma db push` 快速同步 schema（不生成迁移文件）。

5. 启动开发服务器：

   ```bash
   npm run dev
   ```

   浏览器访问 http://localhost:3000。

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串（默认 `postgresql://noteped:noteped@localhost:5432/noteped?schema=public`） |
| `NEXTAUTH_SECRET` | 认证签名密钥，生产环境务必改为随机值 |
| `NEXTAUTH_URL` | 应用地址（默认 `http://localhost:3000`） |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | 邮件服务配置，用于发送登录链接（开发可留空） |
| `LLM_API_KEY` / `LLM_BASE_URL` | AI 能力预留（待定） |

## 脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器 |

## 许可证

本项目为私有项目，暂未指定开源许可证。

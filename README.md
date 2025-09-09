# 🌟 Vorest's Personal Website

一个功能全面、技术现代化的全栈个人网站项目，集成了博客、文档库、图库、评论系统、用户中心和强大的管理面板。项目为 Vercel Serverless 环境特别优化，并采用前后端分离架构。

## ✨ 功能特性

### 🏠 核心功能
- **📝 博客系统** - 支持Markdown，文章分类、标签、置顶，全文搜索。
- **📄 文档库** - 支持多种格式文档（PDF, DOCX, XLSX, PPTX, TXT, MD）的上传、管理和在线预览，支持文档分类、标签和搜索。
- **🖼️ 图库管理** - 支持图片批量上传、分类管理、标签系统和瀑布流展示。
- **💬 评论系统** - 支持多级嵌套回复、点赞、用户身份标识和管理员审核。
- **👥 用户系统** - 提供用户注册、登录、JWT认证、个人主页和权限管理（管理员/普通用户）。
- **🔗 友情链接** - 支持友情链接的申请、审核和展示。
- **🔍 统一搜索** - 提供跨越博客和文档的全文搜索功能，支持关键词高亮和相关性排序。
- **🌦️ 天气查询** - （可能存在的隐藏功能）提供天气信息查询。

### 🎨 界面与交互
- **🌬️ 动态粒子背景** - 基于 `particles.js` 实现的动态蒲公英粒子效果。
- **📱 响应式设计** - 完美适配桌面、平板和手机等不同尺寸的设备。
- **💻 现代化UI** - 采用毛玻璃、渐变背景和流畅的动画效果，提升用户视觉体验。
- **📄 文档在线预览** - 集成 `Vue-Office` 和 `pdfjs-dist`，支持多种主流文档格式的在线预览。

### ⚙️ 管理功能
- **📊 管理员面板** - 提供一个全面的后台管理系统，用于管理网站的所有内容。
- **🔐 权限控制** - 基于角色的访问控制（RBAC），区分管理员和普通用户权限。
- **📈 数据统计** - 提供网站核心数据的统计概览。
- **🚦 内容审核** - 支持对评论、用户注册和友情链接进行审核。
- **👤 用户面板** - 普通用户拥有独立的面板，可管理个人信息和发表的内容。

## 🛠️ 技术栈

### 前端 (Frontend)
- **框架**: `Vue 3` (Composition API)
- **构建工具**: `Vite`
- **路由**: `Vue Router`
- **状态管理**: `Pinia`
- **UI组件库**: `Element Plus`
- **HTTP客户端**: `Axios`
- **文档预览**:
  - `@vue-office/docx` (Word)
  - `@vue-office/excel` (Excel)
  - `@vue-office/pptx` (PowerPoint)
  - `pdfjs-dist` (PDF)
- **Markdown解析**: `marked`
- **粒子效果**: `particles.js`
 - **安全**: `dompurify`

### 后端 (Backend)
- **框架**: `Node.js` + `Express`
- **数据库**: `MongoDB` + `Mongoose`
- **认证**: `JWT` (JSON Web Token)
- **文件上传**: `Multer`
- **Serverless部署适配**: `@vercel/blob` (用于文件存储)
- **密码加密**: `bcryptjs`
- **图片处理**: `sharp`
 - **文档处理**: `libreoffice-convert`, `pdf-lib`, `pdf2pic`, `mammoth`
 - **跨域**: `cors`

### 开发与部署
- **并发任务**: `concurrently`
- **热重载**: `nodemon`
- **代码规范**: `ESLint`
- **版本控制**: `Git`
- **部署平台**: `Vercel` (后端), `GitHub Pages` (前端), `MongoDB Atlas` (数据库), `Cloudflare Workers` (API代理)

## 🚀 快速开始

如果你想本地部署，请：
### 环境要求
- Node.js ≥ 18.0.0（Vite 6 要求）
- npm ≥ 8.0.0
- MongoDB (本地或云端)

### 安装与启动
1.  **克隆项目**
    ```powershell
    git clone https://github.com/Vorest0628/my-website.git
    cd my-website
    ```

2.  **一键安装所有依赖**
    ```powershell
    npm run install:all
    ```

3.  **配置环境变量**
    - 复制 `backend/setting.env.example` 为 `backend/setting.env`。
    - 复制 `frontend/setting.env.example` 为 `frontend/setting.env`。
    - 根据您的本地环境修改这两个 `.env` 文件，配置数据库连接、JWT密钥等。

4.  **启动开发环境**
    ```powershell
    npm run dev
    ```
    项目将在本地启动，前端访问 `http://localhost:5173`，后端API服务在 `http://localhost:3000`。

## 📁 项目结构

```
my-website/
├── 📂 backend/             # 后端 (Node.js + Express)
│   ├── 📂 controllers/     # 控制器 (业务逻辑)
│   ├── 📂 models/         # 数据模型 (Mongoose Schemas)
│   ├── 📂 routes/         # API 路由
│   ├── 📂 middleware/     # 中间件 (认证、权限)
│   ├── 📂 utils/          # 工具函数
│   ├── ⚙️ app.js           # 应用入口
│   ├── 📄 vercel.json      # Vercel 路由/构建配置
│   └── 🔧 setting.env     # 环境变量
├── 📂 frontend/           # 前端 (Vue 3 + Vite)
│   ├── 📂 src/
│   │   ├── 📂 api/        # API 请求模块
│   │   ├── 📂 assets/     # 静态资源 (CSS, 图片)
│   │   ├── 📂 components/ # 可复用组件
│   │   ├── 📂 router/     # 路由配置
│   │   ├── 📂 store/      # 状态管理 (Pinia)
│   │   ├── 📂 views/      # 页面组件
│   │   └── ⚡ main.js      # 应用入口
│   └── ⚡ vite.config.js  # Vite 配置
├── 📄 cloudflare-worker.js # Cloudflare Worker API 代理
├── 📄 CNAME                # 自定义域名（如使用 GitHub Pages）
├── 📄 .gitignore
├── 📄 package.json        # 根项目配置
└── 📖 README.md           # 就是你现在看到的这个文件
```

## 部署指南

本项目已为 `Vercel` 平台优化，推荐使用 Vercel 进行一键部署。
如果你想基于本项目效仿属于自己的个人网站，在运营上线时可以参考如下配置：


1.  **前端部署 (Vercel)**
    - 使用vite进行 `npm run build` 的构建
    - 将全部项目内容部署到github并使用github pages

2.  **后端部署 (Vercel)**
    - 将 `backend` 目录作为另一个 Vercel 项目进行部署。
    - Vercel 会自动识别为 Node.js Serverless Function。
    - 在 Vercel 项目设置中，配置后端的环境变量（`MONGODB_URI`, `JWT_SECRET`, `BLOB_READ_WRITE_TOKEN` 等）。

3.  **文件存储 (Vercel Blob)**
    - 在 Vercel 后端项目中，集成 Vercel Blob 服务。
    - 获取 `BLOB_READ_WRITE_TOKEN` 并配置到环境变量中。
    - 项目中的文件上传（文档、图库）会自动使用 Vercel Blob 进行存储。

4.  **数据库 (MongoDB Atlas)**
    - 推荐使用 MongoDB Atlas 作为云数据库。
    - 创建免费的数据库集群，并将连接字符串配置到后端环境变量 `MONGODB_URI` 中。
    - **重要**: 确保在 MongoDB Atlas 的网络访问设置中，允许来自所有IP地址（`0.0.0.0/0`）的连接，以便 Vercel Serverless 函数可以访问。

5.  **Cloudflare Worker 代理（可选但推荐）**
    - 目的：绕过大陆地区访问 Vercel 的不稳定，提升 API 可用性。
    - 步骤：
      1) 打开仓库根目录的 `cloudflare-worker.js`，将常量 `API_ORIGIN` 设置为你的 Vercel 后端域名（例如 `https://your-backend.vercel.app`）。
      2) 在 Cloudflare Dashboard 新建 Worker，粘贴脚本并发布；可绑定自定义域名或使用 `*.workers.dev` 子域。
      3) 前端将 `frontend/setting.env` 中的 `VITE_APP_API_URL` 指向 Worker 域名的 `/api` 路径，例如：
         ```
         VITE_APP_API_URL=https://your-worker.workers.dev/api
         ```
      4) 确认后端的 `CORS_ORIGIN` 覆盖到你的前端实际域名（含 GitHub Pages/Vercel 域名）。

## 🤝 贡献

欢迎对本项目进行贡献！如果您有任何想法或建议，或者发现bug，请随时提交 Pull Request 或创建 Issue。

1.  Fork 本项目
2.  创建您的功能分支 (`git checkout -b feature/YourFeature`)
3.  提交您的更改 (`git commit -m 'Add some feature'`)
4.  推送到分支 (`git push origin feature/YourFeature`)
5.  提交 Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源。
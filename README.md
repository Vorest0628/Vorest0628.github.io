# 🌟 Vorest's Personal Website

一个功能全面、技术现代化的全栈个人网站项目，集成了博客、文档库、图库、评论系统、用户中心和强大的管理面板。项目采用前后端分离架构，并支持传统服务器部署。

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
- **对象存储（可选）**: `@vercel/blob`
- **密码加密**: `bcryptjs`
- **图片处理**: `sharp`
 - **文档处理**: `libreoffice-convert`, `pdf-lib`, `pdf2pic`, `mammoth`
 - **跨域**: `cors`

### 开发与部署
- **并发任务**: `concurrently`
- **热重载**: `nodemon`
- **代码规范**: `ESLint`
- **版本控制**: `Git`
- **部署平台**: `阿里云服务器` (前后端), `MongoDB Atlas` (数据库)

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
├── 📄 .gitignore
├── 📄 package.json         # 根项目配置
└── 📖 README.md           # 就是你现在看到的这个文件
```

## 部署指南

本项目当前推荐采用阿里云服务器直连部署：前端静态资源与后端服务可部署在同一台服务器，由 Nginx 统一转发 `/` 和 `/api`。
如果你想基于本项目搭建自己的站点，可以参考如下配置：

1.  **前端部署**
    - 在 `frontend` 目录执行 `npm run build`，产物输出到 `frontend/dist`。
    - 将 `frontend/dist` 部署到 Nginx 静态目录，或由你现有的 Web 服务器托管。

2.  **后端部署**
    - 在 `backend` 目录配置生产环境变量（`MONGODB_URI`, `JWT_SECRET`, `PORT` 等）。
    - 使用 `npm start`、`pm2` 或 `systemd` 运行 Node 服务。
    - 建议通过 Nginx 将 `/api` 反向代理到后端端口，这样前端可直接同源访问 API，无需额外代理服务。

3.  **CORS 配置**
    - 如果前后端同域部署，前端直接请求 `/api`，通常无需额外处理。
    - 如果前后端分域部署，请在后端设置 `CORS_ORIGIN`，多个来源使用英文逗号分隔，例如：
      ```
      CORS_ORIGIN=https://www.example.com,https://admin.example.com
      ```

4.  **文件存储**
    - 默认可使用本地磁盘存储：`STORAGE_DRIVER=local`。
    - 若你仍希望接入对象存储，可切换为 `STORAGE_DRIVER=blob`，并配置 `BLOB_READ_WRITE_TOKEN`。

5.  **数据库**
    - 推荐使用 MongoDB Atlas 作为云数据库。
    - 将连接字符串配置到后端环境变量 `MONGODB_URI`。
    - 记得在 MongoDB Atlas 网络访问设置中放行你的服务器出口 IP。

## 🤝 贡献

欢迎对本项目进行贡献！如果您有任何想法或建议，或者发现bug，请随时提交 Pull Request 或创建 Issue。

1.  Fork 本项目
2.  创建您的功能分支 (`git checkout -b feature/YourFeature`)
3.  提交您的更改 (`git commit -m 'Add some feature'`)
4.  推送到分支 (`git push origin feature/YourFeature`)
5.  提交 Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源。

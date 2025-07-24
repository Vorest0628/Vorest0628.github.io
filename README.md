# 🌟 Vorest's Personal Website

一个功能完整的现代化个人网站，集成博客、文档库、图库、评论系统和管理面板等功能，支持动态粒子背景效果。

## ✨ 功能特性

### 🏠 核心功能
- **📝 博客系统** - 支持Markdown编写，分类管理，置顶功能，全文搜索
- **📄 文档库** - 多格式文档管理，在线预览，置顶展示，文档搜索
- **🖼️ 图库管理** - 图片上传、分类展示、缩略图生成、状态管理
- **💬 评论系统** - 多层次评论回复，审核机制，实时通知
- **👥 用户管理** - 用户注册登录，权限控制，个人面板
- **🔗 友情链接** - 友站推荐管理，申请审核
- **🔍 全文搜索** - Google风格搜索，支持博客和文档统一搜索

### 🎨 界面特效
- **🌬️ 粒子背景** - 蒲公英飘散效果，particles.js驱动
- **🎭 响应式设计** - 完美适配桌面、平板、手机
- **💻 现代化UI** - 毛玻璃效果，渐变背景，优雅动画
- **🌙 主题支持** - 支持背景图片自定义

### ⚙️ 管理功能
- **📊 管理员面板** - 全面的内容管理系统
- **🔐 权限控制** - 基于角色的访问控制
- **📈 数据统计** - 访问量和内容统计
- **🚦 内容审核** - 评论、用户审核机制
- **👤 用户面板** - 个人评论管理，账户设置

## 🛠️ 技术栈

### 前端技术
```
Vue 3.5.13           - 渐进式JavaScript框架
Composition API      - 现代Vue开发方式
Vue Router 4.5.1     - 客户端路由管理
Pinia 3.0.2          - 轻量级状态管理
Vite 6.2.4           - 快速构建工具
Element Plus 2.9.11  - Vue3组件库
```

### 前端增强
```
particles.js 2.0.0   - 粒子背景效果
pdfjs-dist 5.3.93    - PDF在线预览
marked 15.0.12       - Markdown解析
highlight.js 11.11.1 - 代码高亮
date-fns 4.1.0       - 日期处理
lodash 4.17.21       - 工具函数库
axios 1.9.0          - HTTP客户端
```

### 后端技术
```
Node.js              - JavaScript运行环境
Express 4.18.3       - Web应用框架
MongoDB + Mongoose   - NoSQL数据库
JWT 9.0.2            - 身份认证
Multer 1.4.5         - 文件上传
bcryptjs 2.4.3       - 密码加密
```

### 文档处理
```
libreoffice-convert  - Office文档转换
mammoth 1.9.1        - Word文档解析
pdf-lib 1.17.1       - PDF处理
sharp 0.34.2         - 图片处理
pdf2pic 3.2.0        - PDF转图片
```

### 开发工具
```
nodemon 3.1.0        - 开发热重载
concurrently 9.1.2   - 并发任务运行
ESLint               - 代码质量检查
Git                  - 版本控制
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- MongoDB >= 4.4.0  
- npm >= 8.0.0

### 一键安装
```bash
# 克隆项目
git clone https://github.com/Vorest0628/my-website.git
cd my-website

# 安装所有依赖
npm run install:all

# 启动开发环境
npm run dev
```

### 分步安装
```bash
# 1. 安装根目录依赖
npm install

# 2. 安装后端依赖
cd backend && npm install

# 3. 安装前端依赖
cd ../frontend && npm install

# 4. 启动数据库
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# 5. 启动项目
cd .. && npm run dev
```

## 📁 项目结构

```
my-website/
├── 📂 backend/                 # 后端服务
│   ├── 📂 controllers/         # 业务控制器
│   ├── 📂 models/             # 数据模型
│   ├── 📂 routes/             # API路由
│   ├── 📂 middleware/         # 中间件
│   ├── 📂 utils/              # 工具函数
│   ├── 📂 uploads/            # 文件上传目录
│   ├── 📂 scripts/            # 数据库脚本
│   ├── ⚙️ app.js               # 应用入口
│   └── 🔧 setting.env         # 环境配置
├── 📂 frontend/               # 前端应用
│   ├── 📂 src/
│   │   ├── 📂 api/            # API接口层
│   │   ├── 📂 components/     # 可复用组件
│   │   ├── 📂 views/          # 页面组件
│   │   ├── 📂 router/         # 路由配置
│   │   ├── 📂 store/          # 状态管理
│   │   ├── 📂 utils/          # 工具函数
│   │   └── 📂 assets/         # 静态资源
│   ├── 📂 public/             # 公共资源
│   └── ⚡ vite.config.js      # 构建配置
├── 📂 docs/                   # 项目文档
├── 📄 package.json            # 项目配置
└── 📖 README.md               # 项目说明
```

## 🎯 核心功能详解

### 📝 博客系统
- **Markdown支持** - 实时预览，语法高亮
- **分类管理** - 灵活分类系统
- **置顶功能** - 重要文章优先展示
- **状态控制** - 草稿/已发布/置顶
- **全文搜索** - MongoDB文本索引

### 📄 文档库
- **多格式支持** - PDF, DOC, PPT, XLS等
- **在线预览** - 无需下载即可查看
- **转换服务** - 自动格式转换
- **分类标签** - 便于组织管理
- **下载统计** - 跟踪文档使用情况

### 💬 评论系统
- **多层回复** - 支持评论嵌套
- **实时通知** - 新评论即时提醒
- **审核机制** - 防止垃圾评论
- **来源追踪** - 标记评论来源页面

### 🖼️ 图库管理
- **批量上传** - 支持多图片上传
- **缩略图** - 自动生成预览图
- **标签分类** - 灵活的分类系统
- **状态管理** - 公开/私有控制

### 👥 用户系统
- **注册登录** - JWT身份认证
- **权限管理** - 用户/管理员角色
- **个人面板** - 评论管理，设置修改
- **状态控制** - 审核/启用状态

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|-----|------|------|
| 🎨 前端网站 | http://localhost:5174 | 主网站界面 |
| 🔧 后端API | http://localhost:3000/api | RESTful API |
| 👑 管理面板 | http://localhost:5174/admin | 管理员控制台 |
| 👤 用户面板 | http://localhost:5174/user | 个人管理中心 |
| 🌬️ 粒子演示 | http://localhost:5174/particles-demo | 特效展示 |

## ⚙️ 配置说明

### 后端配置 (backend/setting.env)
```env
# 数据库
MONGODB_URI=mongodb://localhost:27017/my_website

# JWT安全
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# 服务器
PORT=3000
NODE_ENV=development

# 文件上传
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=52428800

# 跨域
CORS_ORIGIN=http://localhost:5174
```

### 前端配置 (frontend/setting.env)
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_TITLE=Vorest's Personal Website
```

## 🎨 粒子效果配置

### 特效参数
- **粒子数量**: 65个 (性能优化)
- **颜色主题**: 蓝白渐变
- **运动方向**: 右上角飘散
- **交互效果**: 鼠标悬停气泡，点击增加粒子
- **性能优化**: 自动清理，防止内存泄漏

### 自定义粒子
可在 `frontend/src/components/ParticlesBackground.vue` 中调整:
- 粒子数量和密度
- 颜色和透明度
- 运动速度和方向
- 交互效果配置

## 📱 响应式支持

| 设备类型 | 屏幕宽度 | 适配特性 |
|---------|----------|----------|
| 🖥️ 桌面 | ≥1024px | 完整布局，侧边栏 |
| 📱 平板 | 768-1023px | 调整布局，折叠侧边栏 |
| 📱 手机 | <768px | 移动优化，堆叠布局 |

## 🔒 安全特性

- **JWT认证** - 安全的用户身份验证
- **密码加密** - bcrypt哈希加密
- **XSS防护** - 输入内容过滤
- **CORS配置** - 跨域请求控制
- **文件验证** - 上传文件类型检查
- **权限控制** - 基于角色的访问权限

## 🚀 部署指南

### GitHub Pages部署
详见 [GitHubPages部署指南.md](GitHubPages部署指南.md)

### 云服务部署
推荐平台:
- **Vercel** - 前端部署
- **Render** - 后端部署  
- **MongoDB Atlas** - 数据库托管

## 📊 性能优化

### 前端优化
- **懒加载** - 路由组件按需加载
- **代码分割** - Vite自动代码分割
- **图片优化** - 自动压缩和格式转换
- **缓存策略** - 静态资源缓存
- **粒子优化** - 限制粒子数量，自动清理

### 后端优化
- **数据库索引** - 搜索和查询优化
- **文件压缩** - 图片自动压缩
- **API缓存** - 减少重复查询
- **连接池** - 数据库连接优化

## 🔄 更新日志

### v1.0.0 (最新)
- ✅ 完整的博客系统
- ✅ 文档库管理
- ✅ 图库功能
- ✅ 用户权限系统
- ✅ 评论系统
- ✅ 管理员面板
- ✅ 粒子背景效果
- ✅ 全文搜索功能
- ✅ 响应式设计

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/新功能`)
3. 提交更改 (`git commit -m '添加新功能'`)
4. 推送分支 (`git push origin feature/新功能`)
5. 开启 Pull Request

## 📝 开发规范

- **代码风格**: ESLint + Prettier
- **提交规范**: Conventional Commits
- **分支管理**: Git Flow
- **测试要求**: API测试 + 单元测试

## 📄 许可证

本项目采用 [MIT License](LICENSE) - 查看文件了解详情

## 👨‍💻 作者信息

**Vorest** 
- 🐙 GitHub: [@Vorest0628](https://github.com/Vorest0628)
- 📧 Email: your-email@example.com
- 🌐 Website: [Your Website](https://vorest0628.github.io)

## 🙏 致谢

感谢以下开源项目：
- Vue.js 团队
- Element Plus 社区
- Particles.js 作者
- MongoDB 团队
- 所有贡献者

---

⭐ **如果这个项目对你有帮助，请给它一个星标！**

![项目预览](preview.png)

> 💡 这是一个完整的全栈项目，适合学习和实际部署使用 
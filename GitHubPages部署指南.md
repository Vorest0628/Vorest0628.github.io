# 🚀 GitHub Pages 部署完整指南

本指南将详细介绍如何将 **Vorest's Personal Website** 项目成功部署到 GitHub Pages，实现前后端分离部署。

## 📋 项目概览

### 项目架构
```
Vorest's Personal Website
├── 🎨 前端 (Vue 3 + Vite)    → GitHub Pages
├── 🔧 后端 (Node.js + Express) → 云服务部署
└── 🗄️ 数据库 (MongoDB)        → MongoDB Atlas
```

### 核心特性
- ✨ **现代化技术栈**: Vue 3, Vite, Express, MongoDB
- 🌬️ **粒子背景效果**: particles.js 驱动的动态背景
- 📱 **完全响应式**: 适配桌面、平板、手机
- 🔍 **全文搜索**: 博客和文档统一搜索
- 🔐 **权限管理**: JWT 认证 + 角色控制
- 📊 **管理面板**: 完整的内容管理系统

## 🎯 部署策略：动静分离

**GitHub Pages 只支持静态网站托管**，因此我们采用动静分离策略：

| 组件 | 部署位置 | 说明 |
|-----|---------|------|
| 🎨 **前端** | GitHub Pages | 静态文件托管 |
| 🔧 **后端** | Render/Vercel | Node.js 云服务 |
| 🗄️ **数据库** | MongoDB Atlas | 云数据库 |

---

## 🛠️ 部署步骤详解

### 第1步：前端构建与配置

#### 1.1 安装依赖
```bash
cd frontend
npm install
```

#### 1.2 配置生产环境变量
创建 `frontend/.env.production` 文件：
```env
# 后端API地址（部署后的云服务地址）
VITE_API_BASE_URL=https://your-backend-app.onrender.com/api

# 网站标题
VITE_APP_TITLE=Vorest's Personal Website

# 启用生产模式
NODE_ENV=production
```

#### 1.3 配置 Vite 构建
更新 `frontend/vite.config.js`：
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  
  // GitHub Pages 部署配置
  base: '/my-website/',  // 替换为你的仓库名
  
  // 构建优化
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // 分离第三方库
          vendor: ['vue', 'vue-router', 'pinia'],
          particles: ['particles.js'],
          ui: ['element-plus']
        }
      }
    }
  },
  
  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

#### 1.4 更新路由配置
修改 `frontend/src/router/index.js`：
```javascript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  // 生产环境使用仓库名作为基础路径
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ... 路由配置
  ]
})

export default router
```

#### 1.5 构建生产版本
```bash
npm run build
```

构建完成后，`frontend/dist` 目录包含所有静态文件。

### 第2步：后端云部署

#### 2.1 推荐云平台对比

| 平台 | 免费额度 | 优势 | 适合场景 |
|-----|---------|------|----------|
| **Render** | ✅ 750小时/月 | 自动部署，简单易用 | 推荐新手 |
| **Vercel** | ✅ 100GB带宽 | 性能优异，CDN加速 | 追求性能 |
| **Railway** | ✅ $5免费额度 | 数据库集成 | 一站式解决 |
| **Heroku** | ❌ 已取消免费套餐 | 老牌PaaS | 付费使用 |

#### 2.2 Render 部署步骤（推荐）

1. **创建后端仓库**
   ```bash
   # 创建单独的后端仓库
   mkdir my-website-backend
   cp -r backend/* my-website-backend/
   cd my-website-backend
   git init
   git add .
   git commit -m "Initial backend commit"
   git remote add origin https://github.com/yourusername/my-website-backend.git
   git push -u origin main
   ```

2. **在 Render 创建服务**
   - 登录 [Render](https://render.com)
   - 点击 "New +" → "Web Service"
   - 连接 GitHub 仓库
   - 配置部署设置：
     ```
     Name: my-website-backend
     Environment: Node
     Build Command: npm install
     Start Command: npm start
     ```

3. **配置环境变量**
   在 Render 面板中添加：
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/my_website
   JWT_SECRET=your-super-secret-production-jwt-key
   CORS_ORIGIN=https://yourusername.github.io
   PORT=10000
   ```

#### 2.3 数据库迁移到 MongoDB Atlas

1. **创建 Atlas 集群**
   - 注册 [MongoDB Atlas](https://cloud.mongodb.com)
   - 创建免费 M0 集群
   - 配置网络访问（0.0.0.0/0）
   - 创建数据库用户

2. **数据迁移**
   ```bash
   # 导出本地数据
   mongodump --db my_website --out ./backup
   
   # 导入到 Atlas
   mongorestore --uri "mongodb+srv://username:password@cluster.mongodb.net/my_website" ./backup/my_website
   ```

### 第3步：GitHub Pages 部署

#### 3.1 使用 GitHub Actions 自动部署（推荐）

创建 `.github/workflows/deploy.yml`：
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
        
    - name: Install dependencies
      working-directory: ./frontend
      run: npm ci
      
    - name: Build
      working-directory: ./frontend
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./frontend/dist
        cname: your-domain.com  # 可选：自定义域名
```

#### 3.2 手动部署方式

```bash
# 安装部署工具
cd frontend
npm install --save-dev gh-pages

# 添加部署脚本到 package.json
{
  "scripts": {
    "build": "vite build",
    "deploy": "gh-pages -d dist"
  }
}

# 执行部署
npm run build
npm run deploy
```

### 第4步：配置与优化

#### 4.1 自定义域名（可选）

1. **购买域名**并配置 DNS：
   ```
   Type: CNAME
   Name: www
   Value: yourusername.github.io
   ```

2. **在 GitHub 仓库设置中配置自定义域名**

3. **更新前端配置**：
   ```javascript
   // vite.config.js
   export default defineConfig({
     base: '/',  // 自定义域名不需要仓库名
   })
   ```

#### 4.2 性能优化

1. **启用 GitHub Pages 缓存**
   ```html
   <!-- public/index.html -->
   <meta http-equiv="Cache-Control" content="max-age=31536000">
   ```

2. **压缩资源**
   ```javascript
   // vite.config.js
   import { defineConfig } from 'vite'
   import { compression } from 'vite-plugin-compression'
   
   export default defineConfig({
     plugins: [
       vue(),
       compression({
         algorithm: 'gzip',
         deleteOriginFile: false
       })
     ]
   })
   ```

3. **CDN 加速（可选）**
   ```html
   <!-- 使用 CDN 加载大型库 -->
   <script src="https://unpkg.com/particles.js@2.0.0/particles.min.js"></script>
   ```

### 第5步：特殊功能处理

#### 5.1 粒子效果优化
```javascript
// 生产环境粒子配置优化
const particleConfig = {
  particles: {
    number: {
      value: import.meta.env.PROD ? 40 : 65,  // 生产环境减少粒子数量
      density: {
        enable: true,
        value_area: 1200
      }
    },
    // ... 其他配置
  }
}
```

#### 5.2 路由配置
确保 GitHub Pages 支持 SPA 路由：
```html
<!-- public/404.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Vorest's Personal Website</title>
  <script>
    // SPA 路由重定向
    var pathSegmentsToKeep = 1;
    var l = window.location;
    l.replace(
      l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
      l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + 
      '/?/' + l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
      (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
      l.hash
    );
  </script>
</head>
<body></body>
</html>
```

---

## 🔧 环境配置总结

### 开发环境
```env
# frontend/.env.development
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_TITLE=Vorest's Personal Website (Dev)
```

### 生产环境
```env
# frontend/.env.production  
VITE_API_BASE_URL=https://your-backend.onrender.com/api
VITE_APP_TITLE=Vorest's Personal Website
```

### 后端生产环境
```env
# Render 环境变量
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/my_website
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://yourusername.github.io
PORT=10000
MAX_FILE_SIZE=52428800
```

---

## 🚀 部署检查清单

### ✅ 部署前检查
- [ ] 前端构建成功 (`npm run build`)
- [ ] 后端 API 部署完成
- [ ] 数据库连接正常
- [ ] 环境变量配置正确
- [ ] CORS 域名设置正确

### ✅ 部署后验证
- [ ] 网站可以正常访问
- [ ] 粒子效果正常显示
- [ ] 用户注册登录功能正常
- [ ] 博客/文档搜索功能正常
- [ ] 文件上传功能正常
- [ ] 移动端响应式正常

### ✅ 性能检查
- [ ] 页面加载速度 < 3秒
- [ ] Lighthouse 评分 > 90
- [ ] 图片压缩优化
- [ ] 缓存策略生效

---

## 🆘 常见问题解决

### 问题1：静态资源404
**原因**: 路径配置错误
**解决**: 
```javascript
// vite.config.js
export default defineConfig({
  base: '/repository-name/',  // 确保仓库名正确
})
```

### 问题2：API请求失败
**原因**: CORS 配置错误
**解决**:
```javascript
// backend CORS 配置
app.use(cors({
  origin: ['https://yourusername.github.io', 'http://localhost:5174'],
  credentials: true
}))
```

### 问题3：粒子效果不显示
**原因**: CDN 加载失败或配置错误
**解决**:
```javascript
// 使用本地 particles.js
import 'particles.js'
// 或使用可靠的CDN
script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js'
```

### 问题4：路由404错误
**原因**: GitHub Pages 不支持 SPA 路由
**解决**: 添加 `404.html` 重定向脚本（见上文）

---

## 📊 部署成本估算

| 服务 | 免费额度 | 超出费用 | 推荐用途 |
|-----|---------|----------|----------|
| **GitHub Pages** | 1GB存储，100GB带宽 | 免费 | 前端托管 |
| **Render** | 750小时/月 | $7/月 | 后端 API |
| **MongoDB Atlas** | 512MB存储 | $9/月 | 数据库 |
| **总计** | **完全免费** | ~$16/月 | 小型项目足够 |

---

## 🎉 部署完成！

恭喜！你的个人网站现已成功部署到 GitHub Pages。

### 🌟 最终访问地址
- **主网站**: `https://yourusername.github.io/my-website`
- **管理面板**: `https://yourusername.github.io/my-website/admin`
- **粒子演示**: `https://yourusername.github.io/my-website/particles-demo`

### 📈 后续优化建议
1. **SEO优化** - 添加 meta 标签，sitemap
2. **监控告警** - 设置正常运行时间监控
3. **备份策略** - 定期备份数据库
4. **CDN加速** - 使用 Cloudflare 等 CDN
5. **SSL证书** - GitHub Pages 自动提供 HTTPS

---

⭐ **部署成功后，别忘了给项目一个星标！**

> 💡 如遇问题，请检查控制台错误日志或提交 Issue

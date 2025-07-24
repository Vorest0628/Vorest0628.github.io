# Vorest's Personal Website

基于Vue 3的个人网站，采用组件化设计，具有现代化的UI和响应式布局。

## 功能特性

- 🎨 现代化的UI设计，支持透明度和毛玻璃效果
- 📱 完全响应式布局，适配各种设备
- 🧩 组件化架构，便于维护和扩展
- 🎵 音乐播放器功能
- 📝 博客系统
- 💬 评论系统
- 🖼️ 图库展示
- 📚 文档库管理
- 🔗 友情链接管理

## 项目结构

```
frontend/
├── src/
│   ├── components/          # 公共组件
│   │   ├── MainLayout.vue   # 主布局组件
│   │   ├── Header.vue       # 页头组件
│   │   ├── Navigation.vue   # 导航组件
│   │   ├── Sidebar.vue      # 侧边栏组件
│   │   └── Footer.vue       # 页脚组件
│   ├── views/              # 页面组件
│   │   ├── Home.vue        # 首页
│   │   ├── Blog.vue        # 博客列表
│   │   ├── BlogDetail.vue  # 博客详情
│   │   ├── Playlist.vue    # 音乐播放列表
│   │   └── ...
│   └── router/             # 路由配置
└── public/                 # 静态资源
```

## 快速开始

1. 安装依赖：
```bash
cd frontend
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

## 背景图片配置

### 当前配置

网站已经自动配置了背景图片支持。背景图片应放置在 `frontend/src/assets/image/background-bottom.jpg`。

### 背景图片设置

1. **自动加载**：如果 `src/assets/image/background-bottom.jpg` 文件存在，系统会自动加载
2. **备用渐变**：如果图片不存在，会使用美观的渐变背景

### 更换背景图片

1. 将您的背景图片文件放置到 `frontend/src/assets/image/` 目录下
2. 确保文件名为 `background-bottom.jpg`（推荐格式：JPG/PNG）
3. 重新启动开发服务器以应用新图片

### 禁用背景图片

如果您只想使用渐变背景，可以在 `MainLayout.vue` 中注释掉背景图片相关代码：

```javascript
// 注释掉这部分代码以禁用背景图片
/*
onMounted(() => {
  document.documentElement.classList.add('with-background-image')
  document.documentElement.style.setProperty('--background-image', `url(${backgroundImageUrl})`)
})
*/
```

### 自定义背景

您可以在 `MainLayout.vue` 的全局样式中自定义背景：

```css
html {
  background: 
    /* 您的自定义渐变 */
    linear-gradient(180deg, 
      rgba(您的颜色) 0%,
      rgba(您的颜色) 100%
    );
}
```

## 样式特性

- **毛玻璃效果**：主要内容区域使用 `backdrop-filter: blur(5px)` 实现
- **透明度**：各组件使用 `rgba` 颜色值实现半透明效果
- **阴影效果**：统一的阴影样式提升视觉层次
- **动画效果**：悬停动画和状态指示器

## 技术栈

- Vue 3 (Composition API)
- Vue Router 4
- Vite
- CSS3 (Grid + Flexbox)

## 浏览器支持

- Chrome 88+
- Firefox 87+
- Safari 14+
- Edge 88+

## 开发说明

### 组件设计原则
- 每个组件职责单一，便于维护
- 使用语义化的HTML标签
- CSS采用BEM命名规范
- 响应式设计优先

### 颜色主题
- 主色调：rgb(45, 167, 224)
- 辅助色：skyblue, powderblue
- 文本色：#2c3e50, #666
- 背景色：渐变蓝色系

## 许可证

Copyright 2025 by Vorest0628. All rights reserved.

<!-- 
  MainLayout组件
  功能：
  1. 组合所有布局组件
  2. 实现响应式布局
  3. 管理页面缓存
  4. 提供统一的页面结构
-->
<template>
    <div class="app">
      <!-- 粒子背景 -->
      <ParticlesBackground />
      
      <!-- 主要内容区域 -->
      <div class="container">
        <!-- 头部组件 -->
        <Header />

        <!-- 导航组件 -->
        <Navigation />

        <!-- 主内容区 -->
        <main class="main-content">
          <router-view v-slot="{ Component }">
            <!-- 根据keepAlive配置决定是否使用缓存 -->
            <keep-alive>
              <component 
                :is="Component" 
                v-if="Component && $route.meta.keepAlive"
                :key="$route.fullPath"
              />
            </keep-alive>
            <!-- 不使用缓存的组件 -->
            <component 
              :is="Component" 
              v-if="Component && !$route.meta.keepAlive"
              :key="$route.fullPath"
            />
            <!-- 加载状态 -->
            <div v-if="!Component" class="loading">
              <p>页面加载中...</p>
            </div>
          </router-view>
        </main>
        
        <!-- 侧边栏组件 -->
        <Sidebar />

        <!-- 页脚组件 -->
        <Footer />
      </div>
    </div>
  </template>
  
  <script setup>
  import { onMounted } from 'vue'
  // 导入布局组件
  import Header from './Header.vue'
  import Sidebar from './Sidebar.vue'
  import Footer from './Footer.vue'
  import Navigation from './Navigation.vue'
  import ParticlesBackground from './ParticlesBackground.vue'

  // 导入背景图片 - 使用Vite的URL导入
  import backgroundImageUrl from '../assets/image/background-bottom.jpg?url'

  // 设置背景图片
  onMounted(() => {
    // 启用背景图片
    document.documentElement.classList.add('with-background-image')
    // 动态设置背景图片URL
    document.documentElement.style.setProperty('--background-image', `url(${backgroundImageUrl})`)
  })
  </script>
  
  <style scoped>
  /* 应用容器样式 */
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: transparent;
    margin: 0;
    padding: 0;
    position: relative; /* 为粒子背景提供定位参考 */
  }
  
  /* 主容器样式 */
  .container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-areas: 
      "header header"
      "nav nav"
      "main sidebar"
      "footer footer";
    grid-template-columns: 3fr 1fr; /* 调整为83.3% vs 16.7%，让主内容区更宽 */
    gap: 20px;
    padding: 20px;
    width: 100%;
    box-sizing: border-box;
    flex: 1; /* 让容器占据剩余空间 */
  }
  
  /* 主内容区样式 */
  .main-content {
    grid-area: main;
    background-color: rgba(255, 255, 255, 0.95);
    padding: 0; /* 移除内层padding，让页面组件自行控制 */
    border-radius: 5px;
    box-shadow: 0 2px 15px rgba(0,0,0,0.1);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(135, 206, 235, 0.3);
    min-height: 400px; /* 确保有最小高度 */
    width: 100%;
    overflow: hidden; /* 确保内容不溢出圆角边界 */
  }
  
  /* 加载状态样式 */
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: #666;
    font-style: italic;
  }
  
  /* 响应式布局 */
  @media (max-width: 768px) {
    .container {
      grid-template-areas:
        "header"
        "nav"
        "main"
        "sidebar"
        "footer";
      grid-template-columns: 1fr;
      padding: 15px;
      gap: 15px;
    }
    
    .main-content {
      padding: 15px;
    }
  }
  </style>
  
  <style>
  /* 全局样式：基础样式重置，清除浏览器默认样式，确保跨浏览器一致性 */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  /* 根元素样式: 设置全局字体和背景 */
  html {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 16px;
    min-height: 100vh;
    /* 默认渐变背景 */
    background: 
      linear-gradient(
        180deg, 
        rgba(125, 185, 232, 0.85) 0%,
        rgba(166, 219, 246, 0.9) 30%,
        rgba(30, 87, 153, 0.85) 100%
      );
    
    background-attachment: fixed;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;
  }

  /* 当启用背景图片时的样式 */
  html.with-background-image {
    background: 
      /* 渐变遮罩层 */
      linear-gradient(
        180deg, 
        rgba(125, 185, 232, 0.7) 0%,
        rgba(166, 219, 246, 0.8) 30%,
        rgba(30, 87, 153, 0.75) 100%
      ),
      /* 背景图片使用CSS变量 */
      var(--background-image, none) center bottom / cover no-repeat,
      /* 备用渐变 */
      linear-gradient(
        180deg,
        rgb(125, 185, 232) 0%,
        rgb(166, 219, 246) 50%,
        rgb(30, 87, 153) 100%
      );
    
    background-attachment: fixed, fixed, fixed;
  }

  body {
    background-color: transparent;
    margin: 0;
    padding: 0;
    line-height: 1.6;
  }
  
  /* 全局链接样式 */
  a:link {
    color: skyblue;
    font-weight: bold;
  }
  
  a:visited {
    color: rebeccapurple;
    font-weight: bold;
  }
    
  a:hover {
    color: powderblue;
  }
  </style>
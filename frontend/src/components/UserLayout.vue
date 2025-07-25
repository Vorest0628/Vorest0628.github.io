<!-- 
  UserLayout组件 - 用户管理面板专用布局
  功能：
  1. 组合所有布局组件
  2. 为用户管理面板提供专门的布局
  3. 实现响应式布局
  4. 提供统一的用户面板结构
-->
<template>
  <div class="user-app">
    <!-- 粒子背景 -->
    <ParticlesBackground />
    
    <!-- 主要内容区域 -->
    <div class="user-container">
      <!-- 头部组件 -->
      <Header />

      <!-- 导航组件 -->
      <Navigation />

      <!-- 用户面板主内容区 -->
      <main class="user-main-content">
        <router-view v-slot="{ Component }">
          <!-- 用户面板组件 -->
          <component 
            :is="Component" 
            v-if="Component"
            :key="$route.fullPath"
          />
          <!-- 加载状态 -->
          <div v-if="!Component" class="loading">
            <el-loading-spinner style="margin-right: 10px" />
            <span>用户面板加载中...</span>
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

// 导入背景图片
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
/* 用户应用容器样式 */
.user-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: transparent;
  margin: 0;
  padding: 0;
  position: relative; /* 为粒子背景提供定位参考 */
}

/* 用户主容器样式 */
.user-container {
  max-width: 1400px; /* 比普通页面稍宽，适合管理面板 */
  margin: 0 auto;
  display: grid;
  grid-template-areas: 
    "header header"
    "nav nav"
    "user-main sidebar"
    "footer footer";
  grid-template-columns: 4fr 1fr; /* 为用户面板提供更多空间 */
  gap: 20px;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
  flex: 1;
}

/* 用户面板主内容区样式 */
.user-main-content {
  grid-area: user-main;
  background-color: rgba(255, 255, 255, 0.97);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(135, 206, 235, 0.3);
  min-height: 600px;
  width: 100%;
  overflow: hidden;
  /* 移除内边距，让子组件完全控制布局 */
}

/* 加载状态样式 */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #666;
  font-size: 16px;
  gap: 10px;
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .user-container {
    max-width: 100%;
    grid-template-columns: 3fr 1fr;
  }
}

@media (max-width: 768px) {
  .user-container {
    grid-template-areas:
      "header"
      "nav"
      "user-main"
      "sidebar"
      "footer";
    grid-template-columns: 1fr;
    padding: 15px;
    gap: 15px;
  }
  
  .user-main-content {
    min-height: 500px;
  }
}

@media (max-width: 480px) {
  .user-container {
    padding: 10px;
    gap: 10px;
  }
  
  .user-main-content {
    min-height: 400px;
    border-radius: 6px;
  }
}
</style> 
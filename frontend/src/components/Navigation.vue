<!-- 
  Navigation组件
  功能：
  1. 提供主导航菜单
  2. 实现搜索功能
  3. 下拉菜单功能
  4. 响应式设计
  5. 使用Teleport实现全局宽度
-->
<template>
  <!-- 使用 Teleport 将导航栏传送到 body，超越 container 限制 -->
  <Teleport to="body">
    <nav class="main-nav" ref="navElement">
      <!-- 网站标识 -->
      <div class="site-brand">
        <router-link to="/">Vorest's Website</router-link>
      </div>

      <!-- 导航菜单 -->
      <ul class="nav-menu">
        <li><router-link to="/" @click="debugRoute('/')">主页</router-link></li>
        <li><router-link to="/blog" @click="debugRoute('/blog')">博客</router-link></li>
        
        <!-- 工具箱 - 暂时是假按钮 -->
        <li>
          <a href="#" @click.prevent="handleToolbox" class="toolbox-btn">工具箱</a>
        </li>
        
        <!-- 资源库下拉菜单 -->
        <li class="dropdown" 
            @mouseenter="showResourcesDropdown = true" 
            @mouseleave="showResourcesDropdown = false">
          <a href="#" @click.prevent class="dropdown-toggle">资源库 ▾</a>
          <transition name="dropdown">
            <ul class="dropdown-menu" v-show="showResourcesDropdown">
              <li><router-link to="/gallery" @click="debugRoute('/gallery')">图库</router-link></li>
              <li><router-link to="/documents" @click="debugRoute('/documents')">文档库</router-link></li>
            </ul>
          </transition>
        </li>
        
        <!-- 其他下拉菜单 -->
        <li class="dropdown" 
            @mouseenter="showOthersDropdown = true" 
            @mouseleave="showOthersDropdown = false">
          <a href="#" @click.prevent class="dropdown-toggle">其他 ▾</a>
          <transition name="dropdown">
            <ul class="dropdown-menu" v-show="showOthersDropdown">
              <li><router-link to="/comments" @click="debugRoute('/comments')">评论</router-link></li>
              <li><router-link to="/friends" @click="debugRoute('/friends')">友情链接</router-link></li>
              <li><router-link to="/about" @click="debugRoute('/about')">关于我</router-link></li>
            </ul>
          </transition>
        </li>
      </ul>

      <!-- 用户操作区域 -->
      <div class="user-actions">
        <!-- 管理功能按钮 -->
        <template v-if="authStore.isAuthenticated">
          <button 
            @click="goToUserPanel" 
            class="user-panel-btn" 
            :title="authStore.isAdmin ? '管理员控制台' : '用户面板'"
          >
            <i class="fas fa-cog"></i>
            {{ authStore.isAdmin ? '管理控制台' : '用户面板' }}
          </button>
          <button @click="handleLogout" class="logout-btn" title="退出登录">
            <i class="fas fa-sign-out-alt"></i>
            退出
          </button>
        </template>
        <template v-else>
          <button @click="handleShowLogin" class="login-btn" title="用户登录">
            <i class="fas fa-user"></i>
            登录
          </button>
        </template>

        <!-- 搜索框 -->
        <form class="search-form" @submit.prevent="handleSearch">
          <input 
            type="search" 
            v-model="searchQuery" 
            placeholder="搜索博客或文档..."
          >
          <button type="submit">
            <i class="fas fa-search"></i>
          </button>
        </form>
      </div>
    </nav>
  </Teleport>
  
  <!-- 占位元素，维持 Grid 布局，动态调整高度 -->
  <div class="nav-placeholder" :style="{ height: navHeight + 'px' }"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'

const router = useRouter()
const authStore = useAuthStore()
const searchQuery = ref('')
const showResourcesDropdown = ref(false)
const showOthersDropdown = ref(false)
const navElement = ref(null)
const navHeight = ref(100) // 导航栏高度，默认100px

// 调试函数
const debugRoute = (path) => {
  console.log(`点击导航链接: ${path}`)
  console.log('当前路由:', router.currentRoute.value.path)
}

// 工具箱按钮处理
const handleToolbox = () => {
  alert('工具箱功能开发中，敬请期待！')
}

// 搜索处理
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({
      name: 'search',
      query: { q: searchQuery.value.trim() }
    }).catch(err => {
      console.error('路由跳转失败:', err)
    })
    searchQuery.value = ''
  }
}

// 跳转到用户面板
const goToUserPanel = () => {
  if (authStore.isAdmin) {
    router.push('/admin/dashboard')
  } else {
    router.push('/user/panel')
  }
}

// 处理登出
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    authStore.logout()
    console.log('已退出登录')
    if (router.currentRoute.value.path.startsWith('/admin') || 
        router.currentRoute.value.path.startsWith('/user')) {
      router.push('/')
    }
  }
}

// 显示登录模态框（触发全局事件）
const handleShowLogin = () => {
  window.dispatchEvent(new Event('show-login'))
}

// 组件挂载时初始化认证状态
onMounted(async () => {
  await authStore.initAuth()
  
  // 初始化导航栏高度
  updateNavHeight()
  
  // 监听窗口大小变化
  window.addEventListener('resize', updateNavHeight)
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', updateNavHeight)
})

// 更新导航栏高度
const updateNavHeight = () => {
  // 使用 nextTick 确保 DOM 已经渲染
  setTimeout(() => {
    if (navElement.value) {
      // 获取导航栏的实际高度
      const rect = navElement.value.getBoundingClientRect()
      // 设置占位元素的高度 = 导航栏高度 + top边距 + 一些额外间距
      navHeight.value = rect.height + 5 // 25px top + 5px 额外间距
    }
  }, 100) // 稍微延迟以确俛teleport完成
}
</script>

<style scoped>
/* 占位元素，维持 Grid 布局，高度动态调整 */
.nav-placeholder {
  grid-area: nav;
  margin: 0;
  padding: 0;
  transition: height 0.3s ease; /* 添加平滑过渡 */
}

/* 导航栏样式 */
.main-nav {
  background-color: rgba(245, 245, 245, 0.95);
  border-radius: 5px;
  padding: 15px 30px;
  margin: 0 auto;
  border: 3px solid skyblue;
  position: fixed; /* 使用 fixed 定位 */
  top: 0px; /* 距离顶部的距离 */
  left: 50%;
  transform: translateX(-50%); /* 水平居中 */
  z-index: 100;
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 20px;
  justify-content: space-between;
  width: calc(100% - 20px); /* 两边各留20px边距 */
}

/* 网站标识 */
.site-brand {
  flex-shrink: 0;
}

.site-brand a {
  color: rgb(45, 167, 224);
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: bold;
  white-space: nowrap;
}

.site-brand a:hover {
  color: rgb(35, 147, 204);
}

/* 导航菜单 */
.nav-menu {
  list-style: none;
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  align-items: center;
  margin: 0;
  padding: 0;
  flex: 1;
}

/* 导航链接 */
.nav-menu > li > a,
.nav-menu > li > .dropdown-toggle,
.toolbox-btn {
  color: rgb(45, 167, 224);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
  display: inline-block;
  font-weight: 500;
  border: 2px solid transparent;
  white-space: nowrap;
}

.nav-menu > li > a:hover,
.nav-menu > li > .dropdown-toggle:hover,
.toolbox-btn:hover {
  background-color: rgb(45, 167, 224);
  color: white;
  border-color: rgb(45, 167, 224);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(45, 167, 224, 0.3);
}

/* 下拉菜单容器 */
.dropdown {
  position: relative;
}

.dropdown-toggle {
  cursor: pointer;
}

/* 下拉菜单 */
.dropdown-menu {
  position: absolute;
  top: 100%; /* 紧贴按钮下边 */
  left: 0;
  background-color: white;
  border: 2px solid skyblue;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  list-style: none;
  padding: 8px 0;
  min-width: 140px;
  z-index: 200;
  transform-origin: top center;
  margin-top: 2px; /* 轻微间距避免重叠 */
}

/* 下拉菜单动画 */
.dropdown-enter-active {
  animation: dropdown-in 0.2s ease-out;
}

.dropdown-leave-active {
  animation: dropdown-out 0.15s ease-in;
}

@keyframes dropdown-in {
  0% {
    opacity: 0;
    transform: translateY(-10px) scaleY(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scaleY(1);
  }
}

@keyframes dropdown-out {
  0% {
    opacity: 1;
    transform: translateY(0) scaleY(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px) scaleY(0.8);
  }
}

.dropdown-menu li {
  margin: 0;
}

.dropdown-menu a {
  display: block;
  padding: 8px 16px;
  color: rgb(45, 167, 224);
  text-decoration: none;
  transition: all 0.2s ease;
  border: none;
  border-radius: 0;
  white-space: nowrap;
}

.dropdown-menu a:hover {
  background-color: rgba(45, 167, 224, 0.1);
  color: rgb(35, 147, 204);
  transform: none;
  box-shadow: none;
}

/* 用户操作区域 */
.user-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* 用户按钮样式 */
.login-btn, .logout-btn, .user-panel-btn {
  background-color: white;
  color: rgb(45, 167, 224);
  border: 2px solid rgb(45, 167, 224);
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  white-space: nowrap;
}

.user-panel-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.user-panel-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.3);
}

.login-btn:hover, .logout-btn:hover {
  background-color: rgb(45, 167, 224);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(45, 167, 224, 0.3);
}

/* 搜索表单 */
.search-form {
  display: flex;
  gap: 5px;
  align-items: center;
}

.search-form input[type="search"] {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.3s;
  min-width: 140px;
}

.search-form input[type="search"]:focus {
  outline: none;
  border-color: skyblue;
}

.search-form button[type="submit"] {
  background-color: skyblue;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-form button[type="submit"]:hover {
  background-color: rgb(45, 167, 224);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(45, 167, 224, 0.3);
}

/* 响应式设计 - 根据内容宽度智能适配 */

/* 中等宽度屏幕 (900px - 1200px) - 缩小间距但保持横向 */
@media (max-width: 1200px) and (min-width: 901px) {
  .main-nav {
    gap: 12px;
    padding: 12px 20px;
  }

  .site-brand a {
    font-size: 1.1rem;
  }

  .nav-menu {
    gap: 8px;
  }

  .nav-menu > li > a,
  .nav-menu > li > .dropdown-toggle,
  .toolbox-btn {
    padding: 7px 14px;
    font-size: 0.9rem;
  }

  .user-actions {
    gap: 8px;
  }

  .login-btn, .logout-btn, .user-panel-btn {
    padding: 7px 12px;
    font-size: 0.85rem;
  }

  .search-form input[type="search"] {
    min-width: 120px;
  }
}

/* 小屏幕 (700px - 900px) - 开始折叠，搜索框和按钮换行 */
@media (max-width: 900px) and (min-width: 701px) {
  .main-nav {
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 15px;
    justify-content: center;
  }

  .site-brand {
    order: 1;
    flex: 0 0 auto;
  }

  .site-brand a {
    font-size: 1rem;
  }

  .nav-menu {
    order: 2;
    flex: 1 1 auto;
    justify-content: center;
    gap: 6px;
  }

  .nav-menu > li > a,
  .nav-menu > li > .dropdown-toggle,
  .toolbox-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
  }

  .user-actions {
    order: 3;
    width: 100%;
    justify-content: center;
    gap: 8px;
  }

  .login-btn, .logout-btn, .user-panel-btn {
    padding: 6px 12px;
    font-size: 0.8rem;
  }

  .search-form {
    max-width: 300px;
  }
}

/* 移动端 (<=700px) - 完全纵向布局 */
@media (max-width: 700px) {
  .main-nav {
    flex-direction: column;
    padding: 8px 10px;
    gap: 6px;
    left: 0;
    right: 0;
    top: 5px;
    width: 100%;
    max-width: 100%;
    transform: none;
    border-radius: 0;
    overflow-x: auto;
    overflow-y: visible;
  }

  .nav-placeholder {
    height: auto;
    min-height: 30px;
  }

  .site-brand {
    width: 100%;
    text-align: center;
  }

  .site-brand a {
    font-size: 1rem;
  }

  .nav-menu {
    flex-direction: row;
    width: 100%;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .nav-menu > li {
    width: auto;
    flex: 0 0 auto;
  }

  .nav-menu > li > a,
  .nav-menu > li > .dropdown-toggle,
  .toolbox-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
    min-width: auto;
  }

  .dropdown-menu {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    top: auto;
    width: 200px;
  }

  .user-actions {
    flex-direction: row;
    width: 100%;
    justify-content: center;
    gap: 6px;
  }

  .login-btn, .logout-btn, .user-panel-btn {
    padding: 6px 10px;
    font-size: 0.8rem;
    min-width: auto;
  }

  .search-form {
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
  }

  .search-form input[type="search"] {
    flex: 1;
    font-size: 0.85rem;
    padding: 6px 10px;
  }

  .search-form button[type="submit"] {
    padding: 6px 10px;
  }
}
</style>

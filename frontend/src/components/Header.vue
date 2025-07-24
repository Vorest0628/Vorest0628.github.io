<!-- 
  Header组件
  功能：
  1. 显示网站标题和logo
  2. 提供主导航菜单
  3. 显示用户信息和登录状态
  4. 实现响应式设计
-->
<template>
  <header class="main-header">
    <!-- Logo和标题 -->
    <div class="logo">
      <router-link to="/">
        <h1>Vorest's personal website</h1>
      </router-link>
    </div>

    <!-- 用户信息 -->
    <div class="user-info">
      <template v-if="authStore.isAuthenticated">
        <div class="user-profile">
          <span class="username">{{ authStore.user.username }}</span>
          <span v-if="authStore.isAdmin" class="admin-badge">管理员</span>
        </div>
        <!-- 用户面板入口 -->
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
        <button @click="showLoginModal = true" class="login-btn" title="用户登录">
          <i class="fas fa-user"></i>
          登录
        </button>
      </template>
    </div>

    <!-- 登录模态框 -->
    <LoginModal 
      :visible="showLoginModal" 
      @close="showLoginModal = false"
      @success="handleLoginSuccess"
    />
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import LoginModal from './LoginModal.vue'

// 使用路由和认证store
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const showLoginModal = ref(false)

// 处理登录成功
const handleLoginSuccess = () => {
  console.log('登录成功！欢迎,', authStore.user.username)
  // 如果是管理员，提示管理员面板可用
  if (authStore.isAdmin) {
    console.log('管理员权限已激活，您可以访问管理面板')
  }
}

// 跳转到用户面板
const goToUserPanel = () => {
  if (authStore.isAdmin) {
    // 管理员跳转到管理员控制台
    router.push('/admin/dashboard')
  } else {
    // 普通用户跳转到用户面板
    router.push('/user/panel')
  }
}

// 处理登出
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    authStore.logout()
    console.log('已退出登录')
    // 如果当前在管理员页面或用户面板页面，退出后跳转到首页
    if (router.currentRoute.value.path.startsWith('/admin') || 
        router.currentRoute.value.path.startsWith('/user')) {
      router.push('/')
    }
  }
}

// 处理全局登录事件
const handleGlobalLogin = () => {
  showLoginModal.value = true
}

// 组件挂载时初始化认证状态
onMounted(async () => {
  await authStore.initAuth()
  
  // 监听全局登录事件
  window.addEventListener('show-login', handleGlobalLogin)
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener('show-login', handleGlobalLogin)
})
</script>

<style scoped>
/* 页眉样式: 使用grid-area将元素放置在指定的网格区域 */
.main-header {
  grid-area: header; /* Grid区域: 将元素放入名为header的网格区域 */
  background-image: linear-gradient(105deg,rgb(45, 167, 224),powderblue);
  color: white;
  padding: 20px;
  border-radius: 5px; /* 圆角: 使用圆角美化元素边缘 */
  border: 3px solid skyblue; /* 添加与Navigation相同的边框 */
  display: flex; /* Flexbox: 在头部区域内使用一维弹性布局 */
  justify-content: space-between; /* Flex对齐: 水平分布两端对齐 */
  align-items: center; /* Flex对齐: 垂直居中对齐 */
  box-sizing: border-box; /* 确保边框包含在宽度计算内 */
}

.logo h1 {
  text-shadow: 3px 3px 1px black; /* 文本阴影: 添加立体效果 */
  margin: 0;
}

.logo a {
  text-decoration: none;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 8px;
}

.username {
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.admin-badge {
  background-color: rgba(255,255,255,0.2);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgba(255,255,255,0.3);
}

.login-btn, .logout-btn, .user-panel-btn {
  background-color: white;
  color: rgb(45, 167, 224);
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.user-panel-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: 1px solid rgba(255,255,255,0.3);
}

.user-panel-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.login-btn:hover, .logout-btn:hover {
  background-color: rgba(255,255,255,0.95);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.login-btn i, .logout-btn i {
  font-size: 0.85rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .logo h1 {
    font-size: 1.5rem;
  }

  .user-info {
    justify-content: center;
    flex-wrap: wrap;
  }

  .user-profile {
    flex-direction: column;
    gap: 4px;
    margin-right: 0;
    margin-bottom: 8px;
  }

  .admin-badge {
    font-size: 0.7rem;
  }

  .login-btn, .logout-btn {
    padding: 8px 14px;
    font-size: 0.85rem;
  }
}
</style>
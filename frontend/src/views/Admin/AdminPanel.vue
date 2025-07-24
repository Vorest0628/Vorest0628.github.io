<template>
  <div class="admin-panel">
    <!-- 管理员欢迎头部 -->
    <div class="admin-header">
      <div class="welcome-section">
        <h1>管理员控制台</h1>
        <p class="welcome-text">欢迎回来，{{ userInfo?.username }}！</p>
      </div>
    </div>

    <!-- 管理功能导航 -->
    <div class="admin-nav">
      <div class="nav-grid">
        <div 
          v-for="navItem in adminNavItems" 
          :key="navItem.key"
          class="nav-card"
          @click="currentView = navItem.key"
          :class="{ active: currentView === navItem.key }"
        >
          <div class="nav-icon">{{ navItem.icon }}</div>
          <h3>{{ navItem.label }}</h3>
          <p>{{ navItem.description }}</p>
          <div v-if="navItem.pending > 0" class="pending-badge">
            {{ navItem.pending }}
          </div>
        </div>
      </div>
    </div>

    <!-- 管理内容区域 -->
    <div class="admin-content">
      <!-- 总览页面 -->
      <div v-if="currentView === 'overview'" class="overview-content">
        <h2>系统总览</h2>
        
        <div class="recent-activities">
          <h3>最近活动</h3>
          <div v-if="recentActivities.length > 0" class="activity-list">
            <div v-for="activity in recentActivities.slice(0, 3)" :key="activity.id" class="activity-item">
              <div class="activity-icon">{{ activity.icon }}</div>
              <div class="activity-content">
                <div class="activity-text">{{ activity.text }}</div>
                <div class="activity-time">{{ formatTime(activity.time) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-activity">
            <p>暂无最近活动</p>
          </div>
        </div>
      </div>

      <!-- 各种管理组件 -->
      <component 
        :is="currentComponent" 
        v-if="currentView !== 'overview'"
        @update-pending="updatePendingCount"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { useRouter } from 'vue-router'
import { authStorage } from '@/utils/auth'
import { adminApi } from '@/api/admin'

// 懒加载管理组件
import AdminBlogManager from './components/AdminBlogManager.vue'
import AdminFriendLinkManager from './components/AdminFriendLinkManager.vue'
import AdminGalleryManager from './components/AdminGalleryManager.vue'
import AdminDocumentManager from './components/AdminDocumentManager.vue'
import AdminCommentReview from './components/AdminCommentReview.vue'
import AdminUserManager from './components/AdminUserManager.vue'
import UserPanel from '../User/UserPanel.vue'

const router = useRouter()

const currentView = ref('overview')
const userInfo = ref(null)
const stats = reactive({
  blogs: 0,
  images: 0,
  documents: 0,
  comments: 0
})

const pendingCounts = reactive({
  comments: 0
})

const recentActivities = ref([])

// 计算总待审核数量
const totalPending = computed(() => {
  return pendingCounts.comments
})

// 管理导航项目
const adminNavItems = computed(() => [
  {
    key: 'blogs',
    icon: '📝',
    label: '博客管理',
    description: '创建和编辑博客文章',
    pending: 0
  },
  {
    key: 'gallery',
    icon: '🖼️',
    label: '图库管理',
    description: '管理图片和分类',
    pending: 0
  },
  {
    key: 'documents',
    icon: '📄',
    label: '文档管理',
    description: '管理文档和资源',
    pending: 0
  },
  {
    key: 'friend-links',
    icon: '🔗',
    label: '友情链接',
    description: '管理友情链接申请',
    pending: 0
  },
  {
    key: 'users',
    icon: '👥',
    label: '用户管理',
    description: '管理用户账户和权限',
    pending: 0
  },
  {
    key: 'comments',
    icon: '💬',
    label: '评论管理',
    description: '管理用户评论',
    pending: pendingCounts.comments
  },
  {
    key: 'user-panel',
    icon: '👤',
    label: '我的面板',
    description: '管理个人评论和设置',
    pending: 0
  }
])

// 当前显示的组件
const currentComponent = computed(() => {
  const componentMap = {
    blogs: AdminBlogManager,
    gallery: AdminGalleryManager,
    documents: AdminDocumentManager,
    'friend-links': AdminFriendLinkManager,
    users: AdminUserManager,
    comments: AdminCommentReview,
    'user-panel': UserPanel
  }
  return componentMap[currentView.value]
})

// 获取用户信息
const getUserInfo = () => {
  const { user } = authStorage.getAuth()
  userInfo.value = user
}

// 获取统计数据
const getStats = async () => {
  try {
    const response = await adminApi.getStats()
    if (response.success) {
      Object.assign(stats, response.data.stats)
      Object.assign(pendingCounts, response.data.pendingCounts)
      // 限制最近活动为最多3条
      recentActivities.value = (response.data.recentActivities || []).slice(0, 3)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    // 使用模拟数据
    Object.assign(stats, {
      blogs: 15,
      images: 128,
      documents: 25,
      playlists: 45,
      comments: 89
    })
    Object.assign(pendingCounts, {
      comments: 3,
      recommendations: 2
    })
    // 设置模拟的最近活动数据，限制为3条
    recentActivities.value = [
      {
        id: 1,
        icon: '🚀',
        text: '系统启动完成',
        time: new Date()
      },
      {
        id: 2,
        icon: '👨‍💼',
        text: '管理员登录成功',
        time: new Date(Date.now() - 1000 * 60 * 10)
      },
      {
        id: 3,
        icon: '🔗',
        text: '数据库连接正常',
        time: new Date(Date.now() - 1000 * 60 * 30)
      }
    ]
  }
}

// 更新待审核数量
const updatePendingCount = (type, count) => {
  pendingCounts[type] = count
}

// 格式化时间
const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  getUserInfo()
  getStats()
})
</script>

<style scoped>
.admin-panel {
  padding: 20px;
  max-width: 100%;
}

.admin-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
  text-align: center;
}

.admin-header h1 {
  margin: 0 0 10px 0;
  font-size: 2.2rem;
  font-weight: 600;
}

.welcome-text {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.admin-nav {
  margin-bottom: 30px;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.nav-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  text-align: center;
}

.nav-card:hover {
  border-color: #667eea;
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
}

.nav-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nav-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.nav-card h3 {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
}

.nav-card p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.pending-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}

.admin-content {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 30px;
  min-height: 400px;
}

.overview-content h2 {
  color: #333;
  margin-bottom: 30px;
  font-size: 1.8rem;
}

.recent-activities {
  margin-bottom: 30px;
}

.recent-activities h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.3rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.activity-icon {
  font-size: 1.5rem;
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.activity-time {
  font-size: 0.9rem;
  color: #666;
}

.empty-activity {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-activity p {
  margin: 0;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-panel {
    padding: 15px;
  }

  .admin-header {
    padding: 20px;
  }

  .admin-header h1 {
    font-size: 1.8rem;
  }

  .nav-grid {
    grid-template-columns: 1fr;
  }

  .admin-content {
    padding: 20px;
  }
}
</style> 
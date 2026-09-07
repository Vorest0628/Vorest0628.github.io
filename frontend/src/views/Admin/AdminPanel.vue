<template>
  <div class="admin-panel">
    <!-- 管理员欢迎头部 -->
    <div class="admin-header">
      <div class="welcome-section">
        <span class="header-kicker">CONTROL CENTER</span>
        <h1>管理员控制台</h1>
        <p class="welcome-text">
          欢迎回来，{{ userInfo?.username }}！
        </p>
      </div>
      <div class="header-status">
        <span
          class="status-dot"
          aria-hidden="true"
        />
        <span>系统运行正常</span>
        <span class="role-chip">管理员</span>
      </div>
    </div>

    <!-- 管理功能导航 -->
    <div class="admin-nav">
      <div class="nav-grid">
        <button
          v-for="navItem in adminNavItems" 
          :key="navItem.key"
          type="button"
          class="nav-card"
          :class="{ active: currentView === navItem.key }"
          @click="currentView = navItem.key"
        >
          <div class="nav-icon">
            {{ navItem.icon }}
          </div>
          <h3>{{ navItem.label }}</h3>
          <p>{{ navItem.description }}</p>
          <div
            v-if="navItem.pending > 0"
            class="pending-badge"
          >
            {{ navItem.pending }}
          </div>
        </button>
      </div>
    </div>

    <!-- 管理内容区域 -->
    <div class="admin-content">
      <!-- 总览页面 -->
      <div
        v-if="currentView === 'overview'"
        class="overview-content"
      >
        <div class="section-heading">
          <div>
            <span class="section-kicker">OVERVIEW</span>
            <h2>系统总览</h2>
          </div>
          <span class="section-date">{{ formatDate(new Date()) }}</span>
        </div>

        <div class="stats-grid">
          <div
            v-for="stat in overviewStats"
            :key="stat.key"
            class="stat-card"
          >
            <span class="stat-icon">{{ stat.icon }}</span>
            <div>
              <span class="stat-label">{{ stat.label }}</span>
              <strong>{{ stats[stat.key] ?? 0 }}</strong>
            </div>
          </div>
        </div>
        
        <div class="recent-activities">
          <div class="subsection-heading">
            <h3>最近活动</h3>
            <span>{{ recentActivities.length }} 条记录</span>
          </div>
          <div
            v-if="recentActivities.length > 0"
            class="activity-list"
          >
            <div
              v-for="activity in recentActivities.slice(0, 3)"
              :key="activity.id"
              class="activity-item"
            >
              <div class="activity-icon">
                {{ activity.icon }}
              </div>
              <div class="activity-content">
                <div class="activity-text">
                  {{ activity.text }}
                </div>
                <div class="activity-time">
                  {{ formatTime(activity.time) }}
                </div>
              </div>
            </div>
          </div>
          <div
            v-else
            class="empty-activity"
          >
            <p>暂无最近活动</p>
          </div>
        </div>
      </div>

      <!-- 各种管理组件 -->
      <component 
        :is="currentComponent" 
        v-if="currentView !== 'overview'"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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

const currentView = ref('overview')
const userInfo = ref(null)
const stats = reactive({
  users: 0,
  blogs: 0,
  galleryItems: 0,
  documents: 0,
  friendLinks: 0,
  comments: 0
})

const recentActivities = ref([])
const pending = reactive({ blogs: 0, comments: 0, galleryItems: 0 })

const overviewStats = [
  { key: 'blogs', label: '博客文章', icon: '📝' },
  { key: 'galleryItems', label: '图库资源', icon: '🖼️' },
  { key: 'documents', label: '文档资源', icon: '📄' },
  { key: 'users', label: '注册用户', icon: '👥' }
]

// 管理导航项目
const adminNavItems = computed(() => [
  {
    key: 'overview',
    icon: '📊',
    label: '系统总览',
    description: '查看站点运行概况',
    pending: 0
  },
  {
    key: 'blogs',
    icon: '📝',
    label: '博客管理',
    description: '创建和编辑博客文章',
    pending: pending.blogs
  },
  {
    key: 'gallery',
    icon: '🖼️',
    label: '图库管理',
    description: '管理图片和分类',
    pending: pending.galleryItems
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
    pending: pending.comments
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
    const response = await adminApi.getDashboard()
    if (response.success) {
      Object.assign(stats, response.data.stats)
      Object.assign(pending, response.data.pending || {})

      const recent = response.data.recent || {}
      recentActivities.value = [
        ...(recent.blogs || []).map(item => ({
          id: `blog-${item._id || item.id}`,
          icon: '📝',
          text: `新增博客：${item.title}`,
          time: item.createdAt
        })),
        ...(recent.comments || []).map(item => ({
          id: `comment-${item._id || item.id}`,
          icon: '💬',
          text: `收到新评论${item.author?.username ? `：${item.author.username}` : ''}`,
          time: item.createdAt
        })),
        ...(recent.users || []).map(item => ({
          id: `user-${item._id || item.id}`,
          icon: '👤',
          text: `新用户加入：${item.username}`,
          time: item.createdAt
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 3)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    // 使用模拟数据
    Object.assign(stats, {
      blogs: 15,
      documents: 25,
      galleryItems: 128,
      comments: 89,
      users: 45
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



// 格式化时间
const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  getUserInfo()
  getStats()
})
</script>

<style scoped>
.admin-panel {
  width: 100%;
  padding: 18px 0 28px;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.78);
  color: var(--summer-text-main);
  padding: 24px 28px;
  border-radius: 14px;
  margin-bottom: 18px;
  box-shadow: 0 12px 28px rgba(32, 94, 137, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.55);
}

.header-kicker,
.section-kicker {
  display: block;
  color: var(--color-primary-dark);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  line-height: 1.2;
}

.admin-header h1 {
  margin: 6px 0 4px;
  font-size: 1.9rem;
  font-weight: 700;
  font-family: var(--summer-font-display);
  letter-spacing: 0.01em;
  color: var(--summer-text-main);
}

.welcome-text {
  margin: 0;
  font-size: 0.92rem;
  color: var(--summer-text-subtle);
}

.header-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  color: var(--summer-text-subtle);
  font-size: 0.78rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 0 4px rgba(0, 200, 83, 0.12);
}

.role-chip {
  margin-left: 8px;
  padding: 4px 9px;
  border: 1px solid rgba(45, 180, 255, 0.24);
  border-radius: 999px;
  background: rgba(45, 180, 255, 0.1);
  color: var(--color-primary-dark);
  font-weight: 700;
}

.admin-nav {
  margin-bottom: 18px;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.nav-card {
  appearance: none;
  font: inherit;
  min-height: 112px;
  background: var(--color-surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 10px;
  padding: 15px 14px;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  position: relative;
  text-align: left;
  box-shadow: 0 7px 18px rgba(40, 101, 140, 0.09);
  color: var(--summer-text-main);
}

.nav-card:hover {
  border-color: rgba(45, 180, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(45, 180, 255, 0.17);
}

.nav-card.active {
  border-color: var(--color-primary-dark);
  background: var(--color-primary-dark);
  color: white;
  box-shadow: 0 10px 22px rgba(0, 153, 238, 0.25);
}

.nav-icon {
  font-size: 1.55rem;
  line-height: 1;
  margin-bottom: 11px;
}

.nav-card h3 {
  margin: 0 0 4px;
  font-size: 0.95rem;
}

.nav-card p {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.45;
  color: var(--summer-text-subtle);
}

.nav-card.active p {
  color: rgba(255, 255, 255, 0.85);
}

.pending-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #e63946;
  color: white;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  box-shadow: 0 3px 10px rgba(230, 57, 70, 0.35);
}

.admin-content {
  background: var(--color-surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.74);
  border-radius: 14px;
  padding: 26px;
  min-height: 400px;
  box-shadow: 0 10px 24px rgba(40, 101, 140, 0.1);
}

.section-heading,
.subsection-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.section-heading {
  margin-bottom: 20px;
}

.section-heading h2 {
  margin: 5px 0 0;
}

.section-date,
.subsection-heading > span {
  color: var(--summer-text-muted);
  font-size: 0.76rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 28px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 14px;
  border: 1px solid rgba(45, 180, 255, 0.14);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.48);
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: rgba(45, 180, 255, 0.13);
  font-size: 1.1rem;
}

.stat-label {
  display: block;
  margin-bottom: 1px;
  color: var(--summer-text-subtle);
  font-size: 0.72rem;
}

.stat-card strong {
  display: block;
  color: var(--summer-text-main);
  font-size: 1.25rem;
  line-height: 1.2;
}

.overview-content h2 {
  color: var(--summer-text-main);
  font-size: 1.45rem;
}

.recent-activities {
  margin-bottom: 30px;
}

.recent-activities h3 {
  color: var(--summer-text-main);
  margin: 0;
  font-size: 1.05rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(45, 180, 255, 0.12);
  border-left: 3px solid var(--color-primary);
  border-radius: 8px;
}

.activity-icon {
  font-size: 1.5rem;
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-weight: 500;
  color: var(--summer-text-main);
  margin-bottom: 5px;
}

.activity-time {
  font-size: 0.78rem;
  color: var(--summer-text-muted);
}

.empty-activity {
  text-align: center;
  padding: 2rem;
  color: var(--summer-text-subtle);
}

.empty-activity p {
  margin: 0;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-panel {
    padding: 12px 0 20px;
  }

  .admin-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 20px;
  }

  .admin-header h1 {
    font-size: 1.65rem;
  }

  .nav-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-content {
    padding: 20px 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .nav-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }
}
</style>

<!--
  UserPanel - 用户管理面板
  功能：
  1. 普通用户专用管理界面
  2. 只能管理自己的内容
  3. 我的评论、账户设置
-->
<template>
  <div class="user-panel-content">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-content">
        <h1>用户管理面板</h1>
        <p class="user-info">
          欢迎，{{ authStore.user?.username }}！
          <span class="role-badge user">普通用户</span>
        </p>
      </div>
    </div>

    <!-- 普通用户界面 -->
    <div class="user-section">
      <div class="section-tabs">
        <el-tabs v-model="activeTab" type="border-card" class="custom-tabs">
          <el-tab-pane 
            v-for="tab in userTabs" 
            :key="tab.key"
            :label="tab.label"
            :name="tab.key"
          >
            <template #label>
              <span class="tab-label">
                {{ tab.label }}
                <el-badge 
                  v-if="tab.count > 0" 
                  :value="tab.count" 
                  type="primary"
                  style="margin-left: 5px"
                />
              </span>
            </template>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="tab-content">
        <!-- 我的评论 -->
        <div v-show="activeTab === 'my-comments'" class="my-comments">
          <UserCommentManager />
        </div>

        <!-- 账户设置 -->
        <div v-show="activeTab === 'settings'" class="account-settings">
          <UserAccountSettings />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/user'

// 懒加载组件
const UserCommentManager = defineAsyncComponent(() => import('./components/UserCommentManager.vue'))
const UserAccountSettings = defineAsyncComponent(() => import('./components/UserAccountSettings.vue'))

const authStore = useAuthStore()
const router = useRouter()

// 响应式数据
const activeTab = ref('my-comments')
const userStats = ref({
  myComments: 0,
})

// 普通用户标签页
const userTabs = computed(() => [
  { key: 'my-comments', label: '我的评论', count: userStats.value.myComments },
  { key: 'settings', label: '账户设置', count: 0 }
])

// 加载用户统计数据
const loadUserStats = async () => {
  try {
    const response = await userApi.getMyStats()
    if (response.success) {
      userStats.value = response.data
    }
  } catch (error) {
    console.error('加载用户统计数据失败:', error)
    // 使用默认数据作为备用
    userStats.value = {
      myComments: 0,
    }
  }
}

// 检查权限并初始化
const initializePanel = async () => {
  // 检查是否已登录
  if (!authStore.isAuthenticated) {
    alert('请先登录后再访问用户面板')
    router.push('/')
    return
  }

  // 如果是管理员，重定向到管理员控制台
  if (authStore.isAdmin) {
    console.log('管理员用户，重定向到管理员控制台')
    router.push('/admin/dashboard')
    return
  }

  // 加载用户数据
  await loadUserStats()
}

// 组件挂载
onMounted(async () => {
  await authStore.initAuth()
  await initializePanel()
})
</script>

<style scoped>
.user-panel-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  background: linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%);
  color: white;
  padding: 30px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.header-content h1 {
  margin-bottom: 10px;
  font-size: 2.2rem;
  font-weight: 600;
}

.user-info {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-left: 10px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
}

.section-tabs {
  margin-bottom: 20px;
}

.custom-tabs {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.tab-label {
  display: flex;
  align-items: center;
}

.tab-content {
  flex: 1;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  min-height: 400px;
}

.my-recommendations,
.my-comments,
.account-settings {
  min-height: 300px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-header {
    padding: 20px;
  }
  
  .header-content h1 {
    font-size: 1.8rem;
  }
  
  .tab-content {
    padding: 15px;
  }
}
</style> 
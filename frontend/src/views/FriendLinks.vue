<!-- 
  FriendLinks页面组件
  功能：
  1. 展示友情链接列表
  2. 友链分类管理
  3. 友链状态管理
-->
<template>
  <div class="friend-links">
    <h1>友情链接</h1>
    
    <!-- 页面介绍 -->
    <div class="intro-section">
      <p>欢迎来到友情链接页面！这里收录了一些优秀的个人博客和技术网站。</p>
      <p>希望这些网站能对你有所帮助，一起在互联网的世界里探索学习吧！</p>
    </div>

    <!-- 友链分类过滤 -->
    <div class="link-filters">
      <button 
        v-for="category in categories" 
        :key="category"
        @click="filterByCategory(category)"
        :class="{ active: selectedCategory === category }"
        class="category-btn"
      >
        {{ category }}
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <p>正在加载友情链接...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button @click="getFriendLinks" class="retry-btn">重试</button>
    </div>

    <!-- 友链列表 -->
    <div v-else class="links-grid">
      <div 
        v-for="link in filteredLinks" 
        :key="link._id || link.id"
        class="link-card"
        @click="visitLink(link)"
      >
        <div class="link-avatar">
          <img :src="getLinkAvatar(link.avatar)" :alt="link.name" />
        </div>
        
        <div class="link-info">
          <h3>{{ link.name }}</h3>
          <p>{{ link.description || '暂无描述' }}</p>
          <div class="link-meta">
            <span class="link-category">{{ link.category }}</span>
            <span class="link-status" :class="getStatusClass(link.isActive)">
              {{ getStatusText(link.isActive) }}
            </span>
          </div>
          <div v-if="link.tags && link.tags.length" class="link-tags">
            <span 
              v-for="tag in link.tags" 
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
        
        <div class="link-actions">
          <a :href="getFormattedUrl(link.url)" target="_blank" class="visit-btn" @click.stop>
            🔗 访问
          </a>
          <span class="visit-count">访问: {{ link.visitCount || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && !error && filteredLinks.length === 0" class="empty-state">
      <h3>暂无友链</h3>
      <p>该分类下还没有友情链接</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { friendLinkApi } from '@/api/friendLink'

// 响应式数据
const selectedCategory = ref('全部')
const allLinks = ref([])
const loading = ref(false)
const error = ref('')

// 计算属性
const categories = computed(() => {
  const cats = ['全部', ...new Set(allLinks.value.map(link => link.category))]
  return cats
})

const filteredLinks = computed(() => {
  let links = allLinks.value.filter(link => link.isActive === true)
  
  if (selectedCategory.value !== '全部') {
    links = links.filter(link => link.category === selectedCategory.value)
  }
  
  return links
})

// 获取友情链接列表
const getFriendLinks = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await friendLinkApi.getFriendLinks()
    if (response.success) {
      allLinks.value = response.data.friendLinks || response.data
    } else {
      throw new Error(response.message || '获取友情链接失败')
    }
  } catch (err) {
    console.error('❌ 获取友情链接失败:', err)
    error.value = err.message || '获取友情链接失败，请稍后重试'
    
    // 设置模拟数据作为备用
    allLinks.value = [
      {
        id: 1,
        name: 'Vue.js 官方文档',
        url: 'https://vuejs.org',
        avatar: 'https://vuejs.org/logo.svg',
        description: 'Vue.js 官方文档，渐进式JavaScript框架',
        category: '学习资源',
        isActive: true,
        tags: ['Vue', 'JavaScript', '前端'],
        visitCount: 150
      },
      {
        id: 2,
        name: 'GitHub',
        url: 'https://github.com',
        avatar: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
        description: '全球最大的代码托管平台',
        category: '工具网站',
        isActive: true,
        tags: ['Git', '开源', '代码'],
        visitCount: 89
      }
    ]
  } finally {
    loading.value = false
  }
}

// 方法
const filterByCategory = (category) => {
  selectedCategory.value = category
}

const visitLink = async (link) => {
  try {
    // 记录访问统计
    await friendLinkApi.clickFriendLink(link._id || link.id)
    // 更新本地计数
    link.visitCount = (link.visitCount || 0) + 1
  } catch (error) {
    console.error('记录访问失败:', error)
  }
  
  // 打开链接
  window.open(getFormattedUrl(link.url), '_blank')
}

const getStatusClass = (isActive) => {
  return isActive ? 'status-active' : 'status-inactive'
}

const getStatusText = (isActive) => {
  return isActive ? '正常' : '待审核'
}

const getLinkAvatar = (avatar) => {
  if (!avatar) return '/image/default-logo.png'
  if (avatar.startsWith('http')) return avatar
  const baseUrl = import.meta.env.VITE_APP_API_URL?.replace('/api', '') || 'http://localhost:3000'
  return `${baseUrl}${avatar}`
}

const getFormattedUrl = (url) => {
  if (!url) return '#'
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return 'https://' + url
}

onMounted(() => {
  getFriendLinks()
})
</script>

<style scoped>
.friend-links {
  padding: 20px;
  min-height: 600px;
  width: 100%;
}

h1 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
  font-size: 2.5rem;
}

.intro-section {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
}

.intro-section p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 10px;
}

.link-filters {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.category-btn {
  padding: 10px 20px;
  border: 2px solid #2ecc71;
  background-color: white;
  color: #2ecc71;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
}

.category-btn:hover,
.category-btn.active {
  background-color: #2ecc71;
  color: white;
  transform: translateY(-2px);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 3px 15px rgba(0,0,0,0.1);
}

.error-state h3 {
  color: #e74c3c;
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.5rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 50px;
}

.link-card {
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 3px 15px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 15px;
}

.link-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 25px rgba(0,0,0,0.15);
}

.link-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0f0f0;
}

.link-info {
  flex: 1;
}

.link-info h3 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 1.2rem;
}

.link-info p {
  color: #666;
  margin-bottom: 10px;
  line-height: 1.4;
  font-size: 0.9rem;
}

.link-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
  align-items: center;
}

.link-category {
  background-color: #2ecc71;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.link-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.status-active {
  background-color: #27ae60;
  color: white;
}

.status-inactive {
  background-color: #f39c12;
  color: white;
}

.link-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.tag {
  background-color: #ecf0f1;
  color: #2c3e50;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.75rem;
}

.link-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.visit-btn {
  background-color: #3498db;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.9rem;
  text-align: center;
  transition: background-color 0.3s;
}

.visit-btn:hover {
  background-color: #2980b9;
}

.visit-count {
  font-size: 0.8rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 3px 15px rgba(0,0,0,0.1);
}

.empty-state h3 {
  color: #999;
  margin-bottom: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .friend-links {
    padding: 15px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .links-grid {
    grid-template-columns: 1fr;
  }
  
  .link-card {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .link-actions {
    flex-direction: row;
    justify-content: center;
  }
}
</style>

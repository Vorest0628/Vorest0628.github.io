<!-- 
  Sidebar组件
  功能：
  1. 显示相关链接
  2. 显示最近文章
  3. 显示标签云
  4. 显示在线状态
-->
<template>
  <aside class="sidebar">
    <div class="sidebar-content">
      <!-- 在线状态 -->
      <div class="online-status">
        <div class="status-dot"></div>
        <span class="status-text">当前在线</span>
      </div>

      <h2>相关链接</h2>
      <ul>
        <!-- 外部链接: 使用a标签创建到其他网站的链接 -->
        <li><a href="https://space.bilibili.com/276555959" target="_blank">Bilibili</a></li>
        <li><a href="https://github.com/Vorest0628" target="_blank">Github</a></li>
        <li><router-link to="/about">关于我</router-link></li>
        <li><router-link to="/gallery">图库</router-link></li>
        <li><router-link to="/documents">文档库</router-link></li>
      </ul>
      
      <!-- 侧边栏组件: 使用div.widget创建可重用的侧边栏内容模块 -->
      <div class="widget">
        <h3>最近文章</h3>
        <div v-if="loadingContent" class="content-loading">
          <p>加载中...</p>
        </div>
        <ul v-else-if="recentBlogs.length > 0">
          <li v-for="blog in recentBlogs" :key="blog._id">
            <a href="#" @click.prevent="goToBlogBySlug(blog.slug || blog._id)">
              {{ blog.title }}
            </a>
            <span class="post-date">{{ formatDate(blog.createdAt) }}</span>
          </li>
        </ul>
        <div v-else class="empty-content">
          <p>暂无最近文章</p>
        </div>
      </div>

      <!-- 标签云组件: 使用Flexbox创建灵活的标签布局 -->
      <div class="widget">
        <h3>标签云</h3>
        <div class="tag-cloud">
          <a href="#" @click.prevent="searchTag('音乐')">音乐</a>
          <a href="#" @click.prevent="searchTag('编程')">编程</a>
          <a href="#" @click.prevent="searchTag('ACG')">ACG</a>
          <a href="#" @click.prevent="searchTag('Vue3')">前端</a>
          <a href="#" @click.prevent="searchTag('AI')">AI</a>
        </div>
      </div>

      <!-- 访问统计 -->
      <div class="widget">
        <h3>网站统计</h3>
        <div v-if="loading" class="stats-loading">
          <p>加载中...</p>
        </div>
        <div v-else class="stats">
          <div class="stat-item">
            <span class="stat-number">{{ formatNumber(stats.visitCount) }}</span>
            <span class="stat-label">总访问量</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats.blogsCount }}</span>
            <span class="stat-label">文章数量</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats.commentsCount }}</span>
            <span class="stat-label">评论数量</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats.totalContent }}</span>
            <span class="stat-label">总内容数</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { statsApi } from '@/api/stats'

const router = useRouter()

// 响应式数据
const loading = ref(true)
const loadingContent = ref(true)
const stats = ref({
  visitCount: 0,
  blogsCount: 0,
  commentsCount: 0,
  documentsCount: 0,
  imagesCount: 0,
  songsCount: 0,
  totalContent: 0
})
const recentBlogs = ref([])
const recentDocuments = ref([])

// 获取统计数据
const getStats = async () => {
  try {
    loading.value = true
    const response = await statsApi.getWebsiteStats()
    
    if (response.success) {
      // 合并API数据和默认值，确保所有字段都有值
      stats.value = {
        visitCount: response.data?.visitCount || 0,
        blogsCount: response.data?.blogsCount || 0,
        commentsCount: response.data?.commentsCount || 0,
        documentsCount: response.data?.documentsCount || 0,
        imagesCount: response.data?.imagesCount || 0,
        songsCount: response.data?.songsCount || 0,
        totalContent: response.data?.totalContent || 0
      }
    } else {
      console.error('获取统计数据失败:', response.message)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    // 使用默认数据作为备用
    stats.value = {
      visitCount: 1234,
      blogsCount: 0,
      commentsCount: 0,
      documentsCount: 0,
      imagesCount: 0,
      songsCount: 0,
      totalContent: 0
    }
  } finally {
    loading.value = false
  }
}

// 获取最新内容
const getRecentContent = async () => {
  try {
    loadingContent.value = true
    const response = await statsApi.getPopularContent() // The endpoint is still /popular
    
    if (response.success) {
      recentBlogs.value = response.data.recentBlogs || []
    } else {
      console.error('获取最新内容失败:', response.message)
    }
  } catch (error) {
    console.error('获取最新内容失败:', error)
  } finally {
    loadingContent.value = false
  }
}

// 格式化数字显示
const formatNumber = (num) => {
  // 处理undefined、null或非数字值
  if (num === undefined || num === null || isNaN(num)) {
    return '0'
  }
  
  const numValue = Number(num)
  if (numValue >= 1000) {
    return (numValue / 1000).toFixed(1) + 'k'
  }
  return numValue.toString()
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

// 记录页面访问
const recordVisit = async () => {
  try {
    await statsApi.recordVisit({
      page: router.currentRoute.value.path,
      userAgent: navigator.userAgent
    })
  } catch (error) {
    // 静默处理访问记录错误
    console.debug('记录访问失败:', error)
  }
}

const goToBlog = (blogId) => {
  router.push(`/blog/${blogId}`)
}

const goToBlogBySlug = (slugOrId) => {
  router.push(`/blog/${slugOrId}`)
}

const searchTag = (tag) => {
  router.push({
    path: '/blog',
    query: { tag }
  })
}

// 组件挂载时获取数据
onMounted(() => {
  getStats()
  getRecentContent()
  recordVisit()
})
</script>

<style scoped>
/* 侧边栏样式: 设置在Grid布局中的sidebar区域 */
.sidebar {
  grid-area: sidebar;
  background-color: rgba(248, 248, 248, 0.95); /* 添加轻微透明度 */
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 15px rgba(0,0,0,0.1); /* 增强阴影效果 */
  backdrop-filter: blur(5px); /* 背景模糊效果 */
  border: 1px solid rgba(135, 206, 235, 0.3); /* 添加轻微边框 */
}

/* 侧边栏标题: 添加底部边框强调标题 */
.sidebar h2 {
  color: #2c3e50; /* 使用一致的深蓝色 */
  border-bottom: 2px solid rgb(45, 167, 224); /* 使用主题蓝色 */
  padding-bottom: 10px;
  margin-bottom: 15px;
  font-size: 1.3rem;
}

/* 侧边栏列表: 自定义列表样式 */
.sidebar ul {
  list-style: none;
  padding-left: 0; /* 移除左边距 */
}

.sidebar ul li {
  margin-bottom: 10px; /* 增加列表项之间的间距 */
}

.sidebar ul li a {
  color: rgb(45, 167, 224);
  text-decoration: none;
  padding: 5px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: block;
}

.sidebar ul li a:hover {
  background-color: rgba(45, 167, 224, 0.1);
  color: rgb(30, 87, 153);
}

/* 小部件: 在侧边栏中创建独立的内容块 */
.widget {
  margin-top: 25px;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(135, 206, 235, 0.2);
}

.widget h3 {
  color: #34495e;
  border-bottom: 1px solid rgba(45, 167, 224, 0.3);
  padding-bottom: 5px;
  margin-bottom: 10px;
  font-size: 1.1rem;
}

/* 相关网站链接样式 */
.widget a {
  color: skyblue;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s;
}

.widget a:hover {
  color: powderblue;
}

.widget a:visited {
  color: rebeccapurple;
}

/* 最近文章样式 */
.recent-posts {
  list-style: none;
  padding: 0;
}

.recent-posts li {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.recent-posts a {
  color: #2c3e50;
  text-decoration: none;
  display: block;
  margin-bottom: 5px;
  font-weight: normal;
}

.recent-posts a:hover {
  color: #42b983;
}

.widget ul li {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(238, 238, 238, 0.8);
}

.widget ul li:last-child {
  border-bottom: none;
}

.widget ul li a {
  display: block;
  margin-bottom: 5px;
  font-weight: normal;
}

.post-date {
  font-size: 0.8rem;
  color: #666;
  display: block;
}

/* 标签云: 使用Flexbox创建灵活换行的标签布局 */
.tag-cloud {
  display: flex;
  flex-wrap: wrap; /* Flex换行: 允许项目在空间不足时换行 */
  gap: 8px;
}

.tag-cloud a {
  background-color: rgba(238, 238, 238, 0.8);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem; /* rem单位: 相对于根元素字体大小的单位，便于响应式缩放 */
  text-decoration: none;
  color: #555;
  transition: all 0.3s ease;
  border: 1px solid rgba(135, 206, 235, 0.3);
}

.tag-cloud a:hover {
  background-color: rgb(45, 167, 224);
  color: white;
  transform: translateY(-1px);
}

/* 在线状态指示器 */
.online-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  padding: 10px;
  background-color: rgba(46, 204, 113, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(46, 204, 113, 0.3);
}

.status-dot {
  width: 8px;
  height: 8px;
  background-color: #2ecc71;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(46, 204, 113, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(46, 204, 113, 0);
  }
}

.status-text {
  color: #27ae60;
  font-size: 0.9rem;
  font-weight: 500;
}

/* 统计信息样式 */
.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stats-loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.stats-loading p {
  margin: 0;
  font-style: italic;
}

.content-loading {
  text-align: center;
  padding: 15px;
  color: #666;
}

.content-loading p {
  margin: 0;
  font-style: italic;
}

.empty-content {
  text-align: center;
  padding: 15px;
  color: #999;
}

.empty-content p {
  margin: 0;
  font-style: italic;
}

.stat-item {
  text-align: center;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  border: 1px solid rgba(135, 206, 235, 0.2);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-number {
  display: block;
  font-size: 1.4rem;
  font-weight: bold;
  color: rgb(45, 167, 224);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    padding: 15px;
  }
  
  .sidebar h2 {
    font-size: 1.2rem;
  }
  
  .widget {
    margin-top: 20px;
    padding: 12px;
  }

  .stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .stat-item {
    padding: 8px;
  }

  .stat-number {
    font-size: 1.2rem;
  }
}
</style>
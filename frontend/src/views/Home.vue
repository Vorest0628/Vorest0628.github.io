<!-- 
  Home页面组件
  功能：
  1. 展示个人简介
  2. 个人兴趣展示
  3. 个人照片
  4. 详细个人信息
-->
<template>
  <div class="home">
    <!-- 日期时间部分 -->
    <div class="datetime-section">
      <div class="current-date">{{ currentDate }}</div>
      <div class="current-time">{{ currentTime }}</div>
      <div class="welcome-message">欢迎来到我的个人网站</div>
      </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 置顶内容部分 -->
      <section class="pinned-section">
        <h2 class="section-title">📌 置顶内容</h2>
        
        <!-- 置顶文档 -->
        <div v-if="pinnedDocuments.length > 0" class="pinned-category">
          <h3 class="category-title">🗂️ 置顶文档</h3>
          <div class="pinned-cards">
            <div 
              v-for="doc in pinnedDocuments" 
              :key="doc._id" 
              class="pinned-card document-card"
              @click="navigateToDocument(doc)"
            >
              <div class="card-icon">📄</div>
              <div class="card-content">
                <h4 class="card-title">{{ doc.title }}</h4>
                <p class="card-meta">
                  <span class="card-date">{{ formatDate(doc.createdAt) }}</span>
                  <span class="card-category">{{ doc.category }}</span>
                </p>
                <p class="card-excerpt">{{ getDocumentExcerpt(doc) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 置顶博客 -->
        <div v-if="pinnedBlogs.length > 0" class="pinned-category">
          <h3 class="category-title">📝 置顶博客</h3>
          <div class="pinned-cards">
                         <div 
               v-for="blog in pinnedBlogs" 
               :key="blog._id" 
               class="pinned-card blog-card"
               @click="navigateToBlog(blog)"
             >
              <div class="card-icon">✍️</div>
              <div class="card-content">
                <h4 class="card-title">{{ blog.title }}</h4>
                <p class="card-meta">
                  <span class="card-date">{{ formatDate(blog.publishedAt || blog.createdAt) }}</span>
                  <span class="card-category">{{ blog.category }}</span>
                </p>
                <p class="card-excerpt">{{ blog.description || blog.excerpt }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 无置顶内容提示 -->
        <div v-if="pinnedDocuments.length === 0 && pinnedBlogs.length === 0" class="no-pinned">
          <div class="no-content-icon">📌</div>
          <p>暂无置顶内容</p>
        </div>
      </section>

      <!-- 最近博客部分 -->
      <section class="recent-section">
        <h2 class="section-title">📰 最近博客</h2>
        
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载内容...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">❌</div>
          <p>{{ error }}</p>
          <button @click="loadContent" class="retry-btn">重试</button>
        </div>

        <div v-else-if="recentBlogs.length > 0" class="recent-blogs">
                     <div 
             v-for="blog in recentBlogs" 
             :key="blog._id" 
             class="blog-item"
             @click="navigateToBlog(blog)"
           >
            <div class="blog-content">
              <h3 class="blog-title">{{ blog.title }}</h3>
              <p class="blog-description">{{ blog.description || blog.excerpt || '暂无描述' }}</p>
              <div class="blog-meta">
                <span class="blog-date">{{ formatDate(blog.publishedAt || blog.createdAt) }}</span>
                <span class="blog-category">{{ blog.category }}</span>
                <span class="blog-tags" v-if="blog.tags && blog.tags.length > 0">
                  {{ blog.tags.slice(0, 3).join(', ') }}
                </span>
              </div>
            </div>
            <div class="blog-arrow">→</div>
          </div>
        </div>

        <div v-else class="no-recent">
          <div class="no-content-icon">📝</div>
          <p>暂无最近博客</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { blogApi } from '@/api/blog'
import { documentApi } from '@/api/document'

const router = useRouter()

// 响应式数据
const currentDate = ref('')
const currentTime = ref('')
const pinnedDocuments = ref([])
const pinnedBlogs = ref([])
const recentBlogs = ref([])
const loading = ref(false)
const error = ref('')

let timeInterval = null

// 更新时间
const updateDateTime = () => {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 加载内容
const loadContent = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // 并行加载置顶内容和最近博客
    const [pinnedDocsRes, pinnedBlogsRes, recentBlogsRes] = await Promise.all([
      loadPinnedDocuments(),
      loadPinnedBlogs(),
      loadRecentBlogs()
    ])
    
    console.log('内容加载完成:', {
      pinnedDocs: pinnedDocsRes.length,
      pinnedBlogs: pinnedBlogsRes.length,
      recentBlogs: recentBlogsRes.length
    })
  } catch (err) {
    console.error('加载内容失败:', err)
    error.value = '加载内容失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 加载置顶文档
const loadPinnedDocuments = async () => {
  try {
    const response = await documentApi.getDocuments({ status: 'pinned', limit: 5 })
    if (response.success) {
      // 确保只显示状态为pinned的文档
      const documents = response.data.documents || response.data || []
      pinnedDocuments.value = documents.filter(doc => doc.status === 'pinned')
      return pinnedDocuments.value
    }
    return []
  } catch (err) {
    console.warn('加载置顶文档失败:', err)
    pinnedDocuments.value = [] // 失败时设置为空数组，不显示任何文档
    return []
  }
}

// 加载置顶博客
const loadPinnedBlogs = async () => {
  try {
    const response = await blogApi.getBlogs({ status: 'pinned', limit: 5 })
    if (response.success) {
      // 确保只显示状态为pinned的博客
      const blogs = response.data.blogs || response.data || []
      pinnedBlogs.value = blogs.filter(blog => blog.status === 'pinned')
      return pinnedBlogs.value
    }
    return []
  } catch (err) {
    console.warn('加载置顶博客失败:', err)
    pinnedBlogs.value = [] // 失败时设置为空数组，不显示任何博客
    return []
  }
}

// 加载最近博客
const loadRecentBlogs = async () => {
  try {
    const response = await blogApi.getBlogs({ 
      status: 'published', 
      limit: 5, 
      sort: '-publishedAt,-createdAt' 
    })
    if (response.success) {
      recentBlogs.value = response.data || []
      return recentBlogs.value
    }
    return []
  } catch (err) {
    console.warn('加载最近博客失败:', err)
    recentBlogs.value = [] // 失败时不显示模拟数据
    return []
  }
}

// 跳转到博客详情
const navigateToBlog = (blog) => {
  // 优先使用id，如果没有id则使用_id
  const id = blog.id || blog._id
  router.push(`/blog/${id}`)
}

// 跳转到文档库并搜索文档
const navigateToDocument = (doc) => {
  router.push({
    path: '/documents',
    query: { search: doc.title }
  })
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '未知时间'
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取文档摘要
const getDocumentExcerpt = (doc) => {
  if (doc.description) return doc.description
  if (doc.content) {
    return doc.content.length > 100 
      ? doc.content.substring(0, 100) + '...' 
      : doc.content
  }
  return '暂无描述'
}

// 组件挂载
onMounted(() => {
  // 立即更新一次时间
  updateDateTime()
  // 设置定时器，每秒更新时间
  timeInterval = setInterval(updateDateTime, 1000)
  // 加载内容
  loadContent()
})

// 组件卸载
onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  background-image: linear-gradient(105deg,rgb(45, 167, 224),powderblue);
  color: #333;
}

/* 日期时间部分 */
.datetime-section {
  text-align: center;
  padding: 3rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
}

.current-date {
  font-size: 2.5rem;
  font-weight: 300;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.current-time {
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 1rem;
  font-family: 'Courier New', monospace;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.welcome-message {
  font-size: 1.2rem;
  opacity: 0.9;
  font-weight: 300;
}

/* 主要内容区域 */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  background: white;
  border-radius: 20px 20px 0 0;
  min-height: 70vh;
}

/* 区域样式 */
.pinned-section,
.recent-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 3px solid #667eea;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 50px;
  height: 3px;
  background: #764ba2;
}

/* 置顶分类 */
.pinned-category {
  margin-bottom: 2rem;
}

.category-title {
  font-size: 1.3rem;
  color: #555;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 置顶卡片 */
.pinned-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.pinned-card {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.pinned-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.card-icon {
  font-size: 2rem;
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 10px;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.card-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.card-date,
.card-category {
  background: #f1f3f4;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.card-excerpt {
  color: #666;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 最近博客 */
.recent-blogs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.blog-item {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.blog-item:hover {
  transform: translateX(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.blog-content {
  flex: 1;
}

.blog-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.blog-description {
  color: #666;
  margin-bottom: 0.8rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
}

.blog-date,
.blog-category,
.blog-tags {
  background: #f8f9fa;
  color: #495057;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.blog-category {
  background: #e3f2fd;
  color: #1976d2;
}

.blog-tags {
  background: #f3e5f5;
  color: #7b1fa2;
}

.blog-arrow {
  font-size: 1.5rem;
  color: #667eea;
  transition: transform 0.3s ease;
}

.blog-item:hover .blog-arrow {
  transform: translateX(5px);
}

/* 状态样式 */
.loading-state,
.error-state,
.no-pinned,
.no-recent {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.no-content-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .current-date {
    font-size: 1.8rem;
  }
  
  .current-time {
    font-size: 2.5rem;
  }
  
  .welcome-message {
    font-size: 1rem;
  }
  
  .main-content {
    padding: 1rem 0.5rem;
    border-radius: 15px 15px 0 0;
  }
  
  .pinned-cards {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .pinned-card {
    padding: 1rem;
  }
  
  .blog-item {
    padding: 1rem;
    flex-direction: column;
    align-items: stretch;
  }
  
  .blog-arrow {
    align-self: center;
    transform: rotate(90deg);
  }
  
  .blog-item:hover .blog-arrow {
    transform: rotate(90deg) translateX(5px);
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .blog-meta {
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .datetime-section {
    padding: 2rem 0.5rem;
  }
  
  .main-content {
    margin: 0;
    border-radius: 0;
  }
  
  .card-meta,
  .blog-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>

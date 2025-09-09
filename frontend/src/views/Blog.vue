<!-- 
  Blog页面组件
  功能：
  1. 展示博客文章列表
  2. 文章分类过滤
  3. 搜索功能
  4. 分页功能
-->
<template>
  <div class="blog">
    <h1>我的博客</h1>
    
    <!-- 搜索和筛选 -->
    <div class="blog-filters">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索文章..."
          @input="filterPosts"
        />
      </div>
      
      <div class="category-filter">
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
    </div>

    <!-- 博客文章列表 -->
    <div class="blog-list">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <p>正在加载博客文章...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button @click="loadPosts" class="retry-btn">重试</button>
      </div>
      
      <!-- 文章列表 -->
      <article 
        v-else
        v-for="post in filteredPosts" 
        :key="post.id"
        class="blog-post"
        @click="goToPost(post.id)"
      >
        <div class="post-main">
          <div class="post-body">
            <div class="post-header">
              <h2>{{ post.title }}</h2>
              <div class="post-meta">
                <span class="post-date">{{ formatDate(post.date) }}</span>
                <span class="post-category">{{ post.category }}</span>
              </div>
            </div>
            <div class="post-content">
              <p>{{ post.excerpt }}</p>
            </div>
            <div class="post-tags">
              <span 
                v-for="tag in post.tags" 
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          <div class="post-aside" @click.stop>
            <div class="post-cover" v-if="getCoverSrc(post)">
              <img :src="getCoverSrc(post)" alt="预览图" loading="lazy" decoding="async" @error="onCoverError(post)" />
            </div>
            <div class="post-footer">
              <span class="read-more">阅读更多 →</span>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && !error && filteredPosts.length === 0" class="empty-state">
      <h3>暂无文章</h3>
      <p>{{ searchQuery || selectedCategory !== '全部' ? '没有找到匹配的文章' : '还没有发布任何文章' }}</p>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="totalPages > 1">
      <button 
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="page-btn"
      >
        上一页
      </button>
      
      <span class="page-info">
        第 {{ currentPage }} 页，共 {{ totalPages }} 页
      </span>
      
      <button 
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { blogApi } from '@/api/blog'

const router = useRouter()
const route = useRoute()

// 响应式数据
const searchQuery = ref('')
const selectedCategory = ref('全部')
const currentPage = ref(1)
const postsPerPage = 5
const loading = ref(false)
const error = ref('')

// 数据状态
const allPosts = ref([])
const categories = ref(['全部'])
const totalPosts = ref(0)

// 监听路由查询参数变化
watch(() => route.query.search, (newSearch) => {
  if (newSearch) {
    searchQuery.value = newSearch
    selectedCategory.value = '全部'
    currentPage.value = 1
    loadPosts()
  }
}, { immediate: true })

// 加载博客文章
const loadPosts = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const params = {
      page: currentPage.value,
      pageSize: postsPerPage,
      status: 'published'
    }
    
    // 添加分类筛选
    if (selectedCategory.value !== '全部') {
      params.category = selectedCategory.value
    }
    
    // 添加搜索条件
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
    const response = await blogApi.getBlogs(params)
    
    if (response.success) {
      allPosts.value = response.data || []
      totalPosts.value = response.total
    } else {
      throw new Error(response.message || '获取博客列表失败')
    }
  } catch (err) {
    console.error('加载博客失败:', err)
    error.value = err.message || '加载博客失败，请稍后重试'
    allPosts.value = []
  } finally {
    loading.value = false
  }
}

// 加载分类列表
const loadCategories = async () => {
  try {
    const response = await blogApi.getCategories()
    if (response.success) {
      categories.value = ['全部', ...response.data]
    }
  } catch (err) {
    console.error('加载分类失败:', err)
    // 使用默认分类
    categories.value = ['全部', '前端开发', 'AI技术', '游戏', '音乐']
  }
}

// 计算属性
const filteredPosts = computed(() => {
  return allPosts.value
})

const totalPages = computed(() => {
  return Math.ceil(totalPosts.value / postsPerPage)
})

// 方法
const filterByCategory = (category) => {
  selectedCategory.value = category
  currentPage.value = 1
  loadPosts()
}

const filterPosts = () => {
  currentPage.value = 1
  loadPosts()
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadPosts()
  }
}

const goToPost = (postId) => {
  router.push(`/blog/${postId}`)
}

const formatDate = (dateString) => {
  if (!dateString) return '未知日期'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', dateString)
    return '未知日期'
  }
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 解析封面地址（与详情页策略保持一致）
const ASSET_BASE = import.meta.env.PROD ? (import.meta.env.VITE_ASSET_BASE_URL || '') : '/uploads/'
const API_ORIGIN = import.meta.env.PROD ? (import.meta.env.VITE_APP_API_ORIGIN || 'https://api.shirakawananase.top') : ''
const getCoverSrc = (post) => {
  const href = post?.coverImage
  if (!href) return ''
  const isAbs = /^(https?:|data:)/i.test(href)
  const isApiRoute = /^\/api\/blog\//i.test(href)
  if (isAbs) return href
  if (isApiRoute) return API_ORIGIN ? `${API_ORIGIN}${href}` : href
  return ASSET_BASE ? `${ASSET_BASE.replace(/\/$/, '')}/${String(href).replace(/^\//, '')}` : href
}
const onCoverError = (post) => {
  // 控制台输出错误信息，便于诊断
  console.error('封面图加载失败或未设置:', post?.id, post?.coverImage)
}

// 组件挂载时加载数据
onMounted(async () => {
  await loadCategories()
  await loadPosts()
})
</script>

<style scoped>
.blog {
  padding: 30px; /* 与其他页面统一 */
  min-height: 600px;
  width: 100%;
  background-color: transparent;
  line-height: 1.6;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem;
}

.blog-filters {
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  gap: 15px; /* 减小间距 */
}

.search-box input {
  width: 100%;
  padding: 10px; /* 减小padding */
  border: 2px solid #ddd;
  border-radius: 5px; /* 减小圆角 */
  font-size: 1rem;
  transition: border-color 0.3s;
}

.search-box input:focus {
  outline: none;
  border-color: skyblue; /* 使用统一颜色 */
}

.category-filter {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.category-btn {
  padding: 6px 12px; /* 减小padding */
  border: 2px solid skyblue; /* 统一颜色 */
  background-color: white;
  color: skyblue;
  border-radius: 15px; /* 减小圆角 */
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.category-btn:hover,
.category-btn.active {
  background-color: skyblue;
  color: white;
}

.blog-list {
  display: flex;
  flex-direction: column;
  gap: 20px; /* 减小间距 */
}

.blog-post {
  background-color: #f8f8f8; /* 简化背景 */
  padding: 20px; /* 减小padding */
  border-radius: 5px; /* 减小圆角 */
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #eee; /* 简化边框 */
  border-left: 3px solid skyblue; /* 减小左边框 */
  box-shadow: none; /* 去除阴影 */
  min-height: 200px;
}

.post-main {
  display: flex;
  gap: 16px;
  height: 100%;
}

.post-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.post-aside {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.post-cover {
  width: 100%;
  position: relative;
  padding-bottom: 56.25%; /* 16:9 比例盒，保证等高同时展示完整图的缩放 */
  background: #f8f8f8;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s;
}

.post-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  display: block;
  object-fit: contain; /* 在固定比例盒内完整展示图片 */
  background-color: #f8f8f8;
  transition: all 0.3s;
}

.blog-post:hover .post-cover {
  background: #f0f0f0;
}

.blog-post:hover .post-cover img {
  background-color: #f0f0f0;
}

.blog-post:hover {
  transform: none; /* 去除变换效果 */
  box-shadow: none;
  background-color: #f0f0f0; /* 简单的悬停效果 */
}

.post-header h2 {
  color: #333;
  margin-bottom: 10px;
  font-size: 1.3rem; /* 减小字体 */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
}

.post-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 0.9rem;
  color: #666;
}

.post-category {
  background-color: skyblue; /* 统一颜色 */
  color: white;
  padding: 2px 6px; /* 减小padding */
  border-radius: 10px; /* 减小圆角 */
  font-size: 0.8rem;
}

.post-content p {
  color: #333; /* 统一颜色 */
  line-height: 1.6;
  margin-bottom: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.post-tags {
  display: flex;
  gap: 6px; /* 减小间距 */
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.tag {
  background-color: #eee; /* 简化背景 */
  color: #333; /* 统一颜色 */
  padding: 3px 6px; /* 减小padding */
  border-radius: 8px; /* 减小圆角 */
  font-size: 0.8rem;
}

.post-footer {
  text-align: right;
  margin-top: 8px;
}

.read-more {
  color: skyblue; /* 统一颜色 */
  font-weight: bold;
  cursor: pointer;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.loading-state p {
  font-size: 1.1rem;
  color: skyblue;
}

.error-state h3 {
  color: #e74c3c;
  margin-bottom: 10px;
}

.error-state p {
  margin-bottom: 20px;
}

.retry-btn {
  padding: 10px 20px;
  background-color: skyblue;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.retry-btn:hover {
  background-color: powderblue;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state h3 {
  color: #999;
  margin-bottom: 10px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px; /* 减小上边距 */
}

.page-btn {
  padding: 8px 16px; /* 减小padding */
  background-color: skyblue; /* 统一颜色 */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.page-btn:hover:not(:disabled) {
  background-color: powderblue; /* 统一悬停颜色 */
}

.page-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.page-info {
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .blog {
    padding: 15px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .blog-filters {
    gap: 15px;
  }
  
  .category-filter {
    justify-content: center;
  }
  
  .blog-post {
    padding: 20px;
    min-height: unset;
  }
  .post-main {
    flex-direction: column;
  }
  .post-aside {
    width: 100%;
  }
  .post-cover {
    padding-bottom: 56.25%;
  }
  
  .post-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .pagination {
    flex-direction: column;
    gap: 15px;
  }
}
</style>

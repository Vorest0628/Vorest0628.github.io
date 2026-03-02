<template>
  <div class="blog-page">
    <header class="page-head">
      <p class="head-kicker">Article Stream</p>
      <h1>博客</h1>
      <p class="head-desc">记录开发、灵感和日常更新。</p>
    </header>

    <section class="filter-card">
      <div class="search-box">
        <i class="fas fa-magnifying-glass"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索文章..."
          @input="filterPosts"
        />
      </div>

      <div class="category-filter">
        <button
          v-for="category in categories"
          :key="category"
          class="category-btn"
          :class="{ active: selectedCategory === category }"
          @click="filterByCategory(category)"
        >
          {{ category }}
        </button>
      </div>
    </section>

    <section class="content-area">
      <div v-if="loading" class="state-box">
        <div class="state-spinner"></div>
        <p>正在加载博客文章...</p>
      </div>

      <div v-else-if="error" class="state-box error">
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="loadPosts">重试</button>
      </div>

      <template v-else>
        <article
          v-for="post in filteredPosts"
          :key="getPostId(post)"
          class="blog-card"
          @click="goToPost(getPostId(post))"
        >
          <div class="post-main">
            <div class="post-body">
              <div class="post-head">
                <h2>{{ post.title }}</h2>
                <div class="post-meta">
                  <span class="pill">{{ formatDate(post.date || post.publishedAt || post.createdAt) }}</span>
                  <span class="pill category">{{ post.category || '未分类' }}</span>
                </div>
              </div>

              <p class="post-excerpt">
                {{ post.excerpt || post.description || '暂无摘要。' }}
              </p>

              <div class="post-tags" v-if="post.tags && post.tags.length">
                <span v-for="tag in post.tags" :key="tag" class="tag-item">{{ tag }}</span>
              </div>
            </div>

            <aside class="post-side" @click.stop>
              <div class="post-cover" v-if="getCoverSrc(post)">
                <img
                  :src="getCoverSrc(post)"
                  alt="文章封面"
                  loading="lazy"
                  decoding="async"
                  @error="onCoverError(post)"
                />
              </div>
              <div class="read-more">阅读更多 <i class="fas fa-arrow-right"></i></div>
            </aside>
          </div>
        </article>
      </template>
    </section>

    <div v-if="!loading && !error && filteredPosts.length === 0" class="state-box empty">
      <h3>暂无文章</h3>
      <p>
        {{ searchQuery || selectedCategory !== '全部' ? '没有找到匹配的文章。' : '还没有发布任何文章。' }}
      </p>
    </div>

    <footer v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        上一页
      </button>
      <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
        下一页
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { blogApi } from '@/api/blog'

const router = useRouter()
const route = useRoute()

const searchQuery = ref('')
const selectedCategory = ref('全部')
const currentPage = ref(1)
const postsPerPage = 5
const loading = ref(false)
const error = ref('')

const allPosts = ref([])
const categories = ref(['全部'])
const totalPosts = ref(0)
const coverErrorMap = ref({})

let searchDebounceTimer = null

const loadPosts = async () => {
  loading.value = true
  error.value = ''

  try {
    const params = {
      page: currentPage.value,
      pageSize: postsPerPage,
      status: 'published'
    }

    if (selectedCategory.value !== '全部') {
      params.category = selectedCategory.value
    }

    const search = searchQuery.value.trim()
    if (search) {
      params.search = search
    }

    const response = await blogApi.getBlogs(params)
    if (!response?.success) {
      throw new Error(response?.message || '获取博客列表失败')
    }

    allPosts.value = response.data || []
    totalPosts.value = Number(response.total) || allPosts.value.length
  } catch (err) {
    console.error('Failed to load blogs:', err)
    allPosts.value = []
    totalPosts.value = 0
    error.value = err?.message || '加载博客失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const response = await blogApi.getCategories()
    if (response?.success && Array.isArray(response.data)) {
      categories.value = ['全部', ...response.data]
      return
    }
  } catch (err) {
    console.warn('Failed to load categories:', err)
  }
  categories.value = ['全部', '前端开发', 'AI 技术', '游戏', '音乐']
}

const filteredPosts = computed(() => allPosts.value)

const totalPages = computed(() => {
  if (!totalPosts.value) return 0
  return Math.ceil(totalPosts.value / postsPerPage)
})

const filterByCategory = (category) => {
  selectedCategory.value = category
  currentPage.value = 1
  loadPosts()
}

const filterPosts = () => {
  currentPage.value = 1
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    loadPosts()
  }, 280)
}

const changePage = (page) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  loadPosts()
}

const getPostId = (post) => post?.id || post?._id || post?.slug

const goToPost = (postId) => {
  if (!postId) return
  router.push(`/blog/${postId}`)
}

const formatDate = (dateString) => {
  if (!dateString) return '未知日期'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '未知日期'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const ASSET_BASE = import.meta.env.PROD ? (import.meta.env.VITE_ASSET_BASE_URL || '') : '/uploads/'
const API_ORIGIN = import.meta.env.PROD ? (import.meta.env.VITE_APP_API_ORIGIN || 'https://api.shirakawananase.top') : ''

const getCoverSrc = (post) => {
  const id = getPostId(post)
  if (id && coverErrorMap.value[id]) return ''
  const href = post?.coverImage
  if (!href) return ''

  const isAbs = /^(https?:|data:)/i.test(href)
  const isApiRoute = /^\/api\/blog\//i.test(href)

  if (isAbs) return href
  if (isApiRoute) return API_ORIGIN ? `${API_ORIGIN}${href}` : href
  return ASSET_BASE
    ? `${ASSET_BASE.replace(/\/$/, '')}/${String(href).replace(/^\//, '')}`
    : href
}

const onCoverError = (post) => {
  const id = getPostId(post)
  if (!id) return
  coverErrorMap.value = {
    ...coverErrorMap.value,
    [id]: true
  }
}

watch(
  () => route.query.search,
  (newSearch) => {
    const search = typeof newSearch === 'string' ? newSearch : ''
    if (search === searchQuery.value) return
    searchQuery.value = search
    selectedCategory.value = '全部'
    currentPage.value = 1
    loadPosts()
  }
)

onMounted(async () => {
  if (typeof route.query.search === 'string') {
    searchQuery.value = route.query.search
  }
  await loadCategories()
  await loadPosts()
})

onUnmounted(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
})
</script>

<style scoped>
.blog-page {
  min-height: 100%;
  padding: 1.35rem;
  background: transparent;
}

.page-head {
  border-radius: 24px;
  padding: 1.3rem 1.2rem 1.15rem;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(240, 251, 255, 0.78);
  box-shadow: 0 14px 28px rgba(44, 110, 153, 0.14);
  margin-bottom: 1rem;
}

.head-kicker {
  margin: 0;
  color: #428ecf;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.page-head h1 {
  margin: 0.35rem 0;
  font-size: clamp(2rem, 5vw, 2.8rem);
  line-height: 1;
  color: #2f85d4;
  font-family: var(--summer-font-display);
}

.head-desc {
  margin: 0;
  color: #64839a;
}

.filter-card {
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.74);
  background: rgba(247, 252, 255, 0.75);
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 24px rgba(40, 101, 140, 0.11);
  padding: 0.9rem;
  margin-bottom: 1rem;
}

.search-box {
  position: relative;
}

.search-box i {
  position: absolute;
  top: 50%;
  left: 0.92rem;
  transform: translateY(-50%);
  color: #6ea4cf;
  font-size: 0.86rem;
}

.search-box input {
  width: 100%;
  border: 1px solid rgba(117, 194, 242, 0.55);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  height: 2.55rem;
  padding: 0 0.95rem 0 2.4rem;
  color: #336a94;
}

.search-box input:focus {
  outline: none;
  border-color: #42a4f2;
  box-shadow: 0 0 0 3px rgba(115, 200, 251, 0.24);
}

.category-filter {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.category-btn {
  border: 1px solid rgba(104, 182, 237, 0.55);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #2d79bc;
  padding: 0.36rem 0.82rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease;
}

.category-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(66, 148, 206, 0.2);
}

.category-btn.active {
  background: linear-gradient(135deg, #2f8ce2, #61c6ff);
  color: #fff;
  border-color: transparent;
}

.content-area {
  display: grid;
  gap: 0.8rem;
}

.blog-card {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 22px rgba(45, 103, 145, 0.11);
  padding: 1rem;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.blog-card:hover {
  transform: translateY(-2px);
  border-color: rgba(95, 182, 241, 0.82);
  box-shadow: 0 14px 28px rgba(45, 108, 156, 0.17);
}

.post-main {
  display: flex;
  gap: 0.8rem;
}

.post-body {
  flex: 1;
  min-width: 0;
}

.post-head h2 {
  margin: 0 0 0.45rem;
  color: #2c72ad;
  font-size: 1.18rem;
  line-height: 1.28;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(121, 194, 239, 0.45);
  background: #edf8ff;
  color: #4377a4;
  font-size: 0.74rem;
  padding: 0.24rem 0.66rem;
}

.pill.category {
  background: linear-gradient(135deg, #7ecfff, #9ad5ff);
  color: #195c93;
  border-color: transparent;
}

.post-excerpt {
  margin: 0.6rem 0 0;
  color: #5a7b93;
  line-height: 1.58;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
  margin-top: 0.65rem;
}

.tag-item {
  border-radius: 999px;
  border: 1px solid rgba(120, 197, 235, 0.45);
  background: #f3fbff;
  color: #4f82ab;
  font-size: 0.74rem;
  padding: 0.2rem 0.58rem;
}

.post-side {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
}

.post-cover {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(122, 200, 245, 0.35);
  background: #f3faff;
  aspect-ratio: 16 / 9;
}

.post-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.read-more {
  margin-top: 0.45rem;
  text-align: right;
  color: #2f87d7;
  font-weight: 700;
  font-size: 0.84rem;
}

.state-box {
  border-radius: 16px;
  border: 1px solid rgba(118, 196, 241, 0.4);
  background: rgba(255, 255, 255, 0.72);
  text-align: center;
  color: #4e7898;
  padding: 2rem 1rem;
}

.state-box.error h3,
.state-box.empty h3 {
  margin: 0 0 0.4rem;
}

.state-box p {
  margin: 0;
}

.state-spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid rgba(154, 214, 250, 0.5);
  border-top-color: #3a9ff0;
  animation: spin 0.95s linear infinite;
  margin: 0 auto 0.8rem;
}

.retry-btn {
  margin-top: 0.8rem;
  border: none;
  border-radius: 999px;
  padding: 0.48rem 0.92rem;
  background: linear-gradient(135deg, #ff90ac, #ffb4c5);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.pagination {
  margin-top: 1rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  background: rgba(247, 252, 255, 0.74);
  box-shadow: 0 8px 18px rgba(46, 110, 150, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.7rem;
}

.page-btn {
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #2f8de2, #5fc2ff);
  color: #fff;
  font-weight: 700;
  padding: 0.38rem 0.8rem;
  cursor: pointer;
}

.page-btn:disabled {
  background: #b8d4e8;
  cursor: not-allowed;
}

.page-info {
  color: #50748f;
  font-size: 0.9rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .post-main {
    flex-direction: column;
  }

  .post-side {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .blog-page {
    padding: 1rem 0.85rem;
  }

  .pagination {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>

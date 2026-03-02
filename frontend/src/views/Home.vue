<template>
  <div class="home">
    <section class="hero-section">
      <div class="hero-panel hero-copy">
        <p class="hero-kicker">Summer ACG Vibe</p>
        <h1 class="hero-title">Blog</h1>
        <p class="hero-desc">
          用清爽的天空色记录开发、灵感与日常。首页已切到夏日二次元基调，并预留动态云层衔接区做氛围过渡。
        </p>
        <div class="hero-actions">
          <button class="hero-btn primary" @click="router.push('/blog')">进入博客</button>
          <button class="hero-btn ghost" @click="router.push('/documents')">文档库</button>
        </div>
      </div>

      <div class="hero-panel hero-info">
        <p class="info-date">{{ currentDate }}</p>
        <p class="info-time">{{ currentTime }}</p>
        <p class="info-location">Shanghai · {{ currentWeekday }}</p>
        <p class="info-weather">15~20°C</p>
        <p class="info-tip">海风晴朗，适合写点新内容。</p>
      </div>
    </section>

    <section class="cloud-bridge" aria-label="动态云朵衔接区">
      <div class="cloud-track track-one">
        <span class="cloud c1"></span>
        <span class="cloud c2"></span>
        <span class="cloud c3"></span>
        <span class="cloud c4"></span>
        <span class="cloud c5"></span>
      </div>
      <div class="cloud-track track-two">
        <span class="cloud c6"></span>
        <span class="cloud c7"></span>
        <span class="cloud c8"></span>
        <span class="cloud c9"></span>
      </div>
      <div class="bridge-shimmer"></div>
      <p class="bridge-label">Cloud Motion Zone · 动态云朵衔接预留区</p>
    </section>

    <section class="home-main">
      <section class="block">
        <div class="section-head">
          <h2>置顶内容</h2>
          <button class="link-btn" @click="navigateToReadme">使用指南</button>
        </div>

        <div v-if="pinnedDocuments.length === 0 && pinnedBlogs.length === 0" class="state-box empty">
          暂无置顶内容
        </div>

        <div v-else class="pin-grid">
          <article class="pin-card pin-card-special" @click="navigateToReadme">
            <div class="pin-icon">📘</div>
            <div class="pin-body">
              <h3>网站使用指南</h3>
              <p>快速了解站点功能、分类结构和常见问题。</p>
              <span class="pill">永久置顶</span>
            </div>
          </article>

          <article
            v-for="doc in pinnedDocuments"
            :key="doc.id || doc._id"
            class="pin-card"
            @click="navigateToDocument(doc)"
          >
            <div class="pin-icon">📄</div>
            <div class="pin-body">
              <h3>{{ doc.title }}</h3>
              <p>{{ getDocumentExcerpt(doc) }}</p>
              <div class="meta-line">
                <span class="pill">{{ formatDate(doc.createdAt) }}</span>
                <span class="pill">{{ doc.category || '文档' }}</span>
              </div>
            </div>
          </article>

          <article
            v-for="blog in pinnedBlogs"
            :key="blog.id || blog._id"
            class="pin-card"
            @click="navigateToBlog(blog)"
          >
            <div class="pin-icon">📝</div>
            <div class="pin-body">
              <h3>{{ blog.title }}</h3>
              <p>{{ blog.description || blog.excerpt || '点击阅读完整内容。' }}</p>
              <div class="meta-line">
                <span class="pill">{{ formatDate(blog.publishedAt || blog.createdAt) }}</span>
                <span class="pill">{{ blog.category || '博客' }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="block">
        <div class="section-head">
          <h2>最近博客</h2>
          <button class="link-btn" @click="router.push('/blog')">查看全部</button>
        </div>

        <div v-if="loading" class="state-box">内容加载中...</div>

        <div v-else-if="error" class="state-box error">
          <span>{{ error }}</span>
          <button class="retry-btn" @click="loadContent">重试</button>
        </div>

        <div v-else-if="recentBlogs.length === 0" class="state-box empty">暂无最近博客</div>

        <div v-else class="recent-list">
          <article
            v-for="blog in recentBlogs"
            :key="blog.id || blog._id"
            class="recent-item"
            @click="navigateToBlog(blog)"
          >
            <h3>{{ blog.title }}</h3>
            <p>{{ blog.description || blog.excerpt || '暂无摘要。' }}</p>
            <div class="meta-line">
              <span class="pill">{{ formatDate(blog.publishedAt || blog.createdAt || blog.date) }}</span>
              <span class="pill">{{ blog.category || '未分类' }}</span>
              <span v-if="blog.tags && blog.tags.length" class="pill">
                {{ blog.tags.slice(0, 2).join(' · ') }}
              </span>
            </div>
          </article>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { blogApi } from '@/api/blog'
import { documentApi } from '@/api/document'

const router = useRouter()

const currentDate = ref('')
const currentTime = ref('')
const currentWeekday = ref('')
const pinnedDocuments = ref([])
const pinnedBlogs = ref([])
const recentBlogs = ref([])
const loading = ref(false)
const error = ref('')

let timeInterval = null

const updateDateTime = () => {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  currentWeekday.value = now.toLocaleDateString('zh-CN', { weekday: 'long' })
}

const loadPinnedDocuments = async () => {
  try {
    const response = await documentApi.getDocuments({ status: 'pinned', limit: 4 })
    if (response?.success) {
      const documents = response?.data?.documents || response?.data || []
      pinnedDocuments.value = documents.filter((item) => item?.status === 'pinned').slice(0, 4)
      return pinnedDocuments.value
    }
  } catch (err) {
    console.warn('Failed to load pinned documents:', err)
  }
  pinnedDocuments.value = []
  return []
}

const loadPinnedBlogs = async () => {
  try {
    const response = await blogApi.getBlogs({ status: 'pinned', page: 1, pageSize: 4 })
    if (response?.success) {
      const blogs = response.data || []
      pinnedBlogs.value = blogs.filter((item) => item?.status === 'pinned').slice(0, 4)
      return pinnedBlogs.value
    }
  } catch (err) {
    console.warn('Failed to load pinned blogs:', err)
  }
  pinnedBlogs.value = []
  return []
}

const loadRecentBlogs = async () => {
  try {
    const response = await blogApi.getBlogs({ status: 'published', page: 1, pageSize: 6 })
    if (response?.success) {
      recentBlogs.value = response.data || []
      return recentBlogs.value
    }
  } catch (err) {
    console.warn('Failed to load recent blogs:', err)
  }
  recentBlogs.value = []
  return []
}

const loadContent = async () => {
  loading.value = true
  error.value = ''

  try {
    await Promise.all([loadPinnedDocuments(), loadPinnedBlogs(), loadRecentBlogs()])
  } catch (err) {
    console.error('Failed to load content:', err)
    error.value = '加载失败，请稍后再试。'
  } finally {
    loading.value = false
  }
}

const navigateToBlog = (blog) => {
  const id = blog?.id || blog?._id || blog?.slug
  if (!id) return
  router.push(`/blog/${id}`)
}

const navigateToReadme = () => {
  router.push('/readme')
}

const navigateToDocument = (doc) => {
  if (!doc?.title) {
    router.push('/documents')
    return
  }
  router.push({
    path: '/documents',
    query: { search: doc.title }
  })
}

const getDocumentExcerpt = (doc) => {
  return doc?.description || doc?.summary || doc?.excerpt || '点击查看文档详情。'
}

const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '未知时间'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const prefetchCommonRoutes = () => {
  const routesToPrefetch = [
    () => import('../views/Blog.vue'),
    () => import('../views/DocumentLibrary.vue'),
    () => import('../views/Gallery.vue'),
    () => import('../views/FriendLinks.vue')
  ]

  if (typeof requestIdleCallback !== 'undefined') {
    routesToPrefetch.forEach((importFn, index) => {
      requestIdleCallback(() => {
        importFn().catch((err) => console.warn('Route prefetch failed:', err))
      }, { timeout: 2500 + index * 400 })
    })
    return
  }

  routesToPrefetch.forEach((importFn, index) => {
    setTimeout(() => {
      importFn().catch((err) => console.warn('Route prefetch failed:', err))
    }, 1800 + index * 250)
  })
}

onMounted(() => {
  updateDateTime()
  timeInterval = setInterval(updateDateTime, 1000)
  loadContent()
  prefetchCommonRoutes()
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<style scoped>
.home {
  position: relative;
  min-height: 100%;
  color: var(--summer-text-main);
  background:
    linear-gradient(
      180deg,
      rgba(67, 174, 250, 0.92) 0%,
      rgba(139, 230, 255, 0.86) 36%,
      rgba(222, 248, 255, 0.7) 50%,
      rgba(134, 234, 218, 0.78) 64%,
      rgba(149, 239, 221, 0.86) 100%
    );
  overflow: hidden;
}

.home::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 14%, rgba(255, 255, 255, 0.28), transparent 30%),
    radial-gradient(circle at 86% 18%, rgba(255, 255, 255, 0.25), transparent 28%),
    linear-gradient(120deg, rgba(255, 255, 255, 0.14), transparent 35%);
  pointer-events: none;
}

.hero-section,
.home-main {
  position: relative;
  z-index: 1;
}

.hero-section {
  display: grid;
  grid-template-columns: 1.55fr 1fr;
  gap: 1.5rem;
  padding: 2.2rem 2rem 1.6rem;
}

.hero-panel {
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(235, 248, 255, 0.62);
  box-shadow: 0 18px 45px rgba(40, 101, 150, 0.16);
  backdrop-filter: blur(14px);
}

.hero-copy {
  padding: 2.6rem 2.4rem;
}

.hero-kicker {
  margin: 0;
  font-size: 0.88rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #377cbf;
  font-weight: 700;
}

.hero-title {
  margin: 0.8rem 0 1rem;
  font-size: clamp(3.1rem, 7vw, 5.4rem);
  line-height: 0.9;
  font-family: var(--summer-font-display);
  color: #3193ea;
  text-shadow: 0 12px 24px rgba(41, 131, 210, 0.22);
}

.hero-desc {
  margin: 0;
  max-width: 34rem;
  color: var(--summer-text-subtle);
  font-size: 1.02rem;
}

.hero-actions {
  display: flex;
  gap: 0.8rem;
  margin-top: 1.6rem;
}

.hero-btn {
  border: none;
  border-radius: 999px;
  padding: 0.68rem 1.26rem;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.26s ease, box-shadow 0.26s ease, background-color 0.26s ease;
}

.hero-btn:hover {
  transform: translateY(-2px);
}

.hero-btn.primary {
  background: linear-gradient(135deg, #2f8ce2, #57beff);
  color: #fff;
  box-shadow: 0 10px 24px rgba(46, 144, 225, 0.34);
}

.hero-btn.ghost {
  background: rgba(255, 255, 255, 0.82);
  color: #2f78c6;
  border: 1px solid rgba(76, 170, 236, 0.5);
}

.hero-info {
  padding: 2.2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.info-date {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: #3688de;
}

.info-time {
  margin: 0;
  font-size: 2.1rem;
  font-weight: 800;
  color: #26649c;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

.info-location {
  margin: 0;
  color: #5a7f9f;
  font-style: italic;
  font-size: 1.2rem;
}

.info-weather {
  margin: 0;
  font-size: 2rem;
  color: #ff8ba3;
  font-family: var(--summer-font-display);
}

.info-tip {
  margin: 0.4rem 0 0;
  color: #4e7d97;
  font-size: 0.95rem;
}

.cloud-bridge {
  position: relative;
  height: 140px;
  margin: 0 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.75);
  border-bottom: 1px solid rgba(255, 255, 255, 0.6);
  background: linear-gradient(
    180deg,
    rgba(240, 251, 255, 0.9) 0%,
    rgba(237, 251, 255, 0.58) 45%,
    rgba(172, 239, 228, 0.52) 100%
  );
  overflow: hidden;
}

.bridge-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.24) 50%, transparent 65%);
  animation: bridge-shimmer 8.6s linear infinite;
}

.bridge-label {
  position: absolute;
  left: 50%;
  bottom: 0.85rem;
  transform: translateX(-50%);
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(46, 117, 165, 0.62);
  white-space: nowrap;
  z-index: 3;
}

.cloud-track {
  position: absolute;
  top: 0;
  left: -45%;
  width: 220%;
  height: 100%;
  pointer-events: none;
}

.track-one {
  animation: cloud-drift-left 58s linear infinite;
}

.track-two {
  animation: cloud-drift-right 78s linear infinite;
  opacity: 0.78;
}

.cloud {
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.84);
  filter: blur(0.6px);
  animation: cloud-bob 9s ease-in-out infinite;
}

.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
}

.c1 {
  width: 220px;
  height: 56px;
  top: 26px;
  left: 6%;
  animation-delay: 0.2s;
}

.c2 {
  width: 190px;
  height: 48px;
  top: 52px;
  left: 31%;
  animation-delay: 0.9s;
}

.c3 {
  width: 250px;
  height: 62px;
  top: 18px;
  left: 55%;
  animation-delay: 1.4s;
}

.c4 {
  width: 170px;
  height: 44px;
  top: 60px;
  left: 74%;
  animation-delay: 2.1s;
}

.c5 {
  width: 210px;
  height: 52px;
  top: 34px;
  left: 92%;
  animation-delay: 2.8s;
}

.c6 {
  width: 200px;
  height: 50px;
  top: 70px;
  left: 14%;
  animation-delay: 0.7s;
}

.c7 {
  width: 165px;
  height: 40px;
  top: 12px;
  left: 40%;
  animation-delay: 1.8s;
}

.c8 {
  width: 235px;
  height: 58px;
  top: 44px;
  left: 64%;
  animation-delay: 2.6s;
}

.c9 {
  width: 178px;
  height: 42px;
  top: 20px;
  left: 104%;
  animation-delay: 3.2s;
}

.cloud::before {
  width: 42%;
  height: 128%;
  top: -62%;
  left: 16%;
}

.cloud::after {
  width: 36%;
  height: 112%;
  top: -48%;
  right: 14%;
}

@keyframes cloud-drift-left {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-45%);
  }
}

@keyframes cloud-drift-right {
  from {
    transform: translateX(-10%);
  }
  to {
    transform: translateX(35%);
  }
}

@keyframes cloud-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes bridge-shimmer {
  from {
    transform: translateX(-30%);
  }
  to {
    transform: translateX(26%);
  }
}

.home-main {
  padding: 1.2rem 2rem 2.2rem;
  display: grid;
  gap: 1.5rem;
}

.block {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.68);
  background: rgba(247, 252, 255, 0.74);
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 34px rgba(52, 119, 160, 0.14);
  padding: 1.3rem;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.section-head h2 {
  margin: 0;
  font-size: 1.55rem;
  color: #2f84d7;
  font-family: var(--summer-font-display);
}

.link-btn {
  border: 1px solid rgba(62, 151, 226, 0.5);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #2f84d7;
  font-size: 0.86rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.link-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(58, 135, 210, 0.2);
}

.pin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.95rem;
}

.pin-card,
.recent-item {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 8px 20px rgba(51, 112, 151, 0.11);
  cursor: pointer;
  transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
}

.pin-card:hover,
.recent-item:hover {
  transform: translateY(-3px);
  border-color: rgba(79, 174, 236, 0.8);
  box-shadow: 0 14px 28px rgba(52, 118, 170, 0.18);
}

.pin-card {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
}

.pin-card-special {
  background: linear-gradient(135deg, rgba(55, 142, 224, 0.95), rgba(102, 204, 246, 0.96));
  color: #f6fdff;
  border-color: rgba(148, 229, 255, 0.7);
}

.pin-card-special .pin-body h3,
.pin-card-special .pin-body p {
  color: #f6fdff;
}

.pin-card-special .pill {
  background: rgba(255, 255, 255, 0.2);
  color: #f6fdff;
}

.pin-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(160deg, #8ecdf8, #5baee9);
  color: #fff;
  font-size: 1.2rem;
}

.pin-card-special .pin-icon {
  background: rgba(255, 255, 255, 0.2);
}

.pin-body h3 {
  margin: 0 0 0.38rem;
  color: #266796;
  font-size: 1.04rem;
  line-height: 1.3;
}

.pin-body p {
  margin: 0;
  color: #5d7c92;
  line-height: 1.5;
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.7rem;
}

.pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.28rem 0.72rem;
  font-size: 0.75rem;
  color: #3979a8;
  background: #ebf6ff;
  border: 1px solid rgba(112, 189, 243, 0.4);
}

.recent-list {
  display: grid;
  gap: 0.75rem;
}

.recent-item {
  padding: 1rem 1rem 0.95rem;
}

.recent-item h3 {
  margin: 0;
  color: #2f77ba;
  font-size: 1.08rem;
}

.recent-item p {
  margin: 0.5rem 0 0;
  color: #587a93;
  line-height: 1.52;
}

.state-box {
  border-radius: 14px;
  padding: 1rem;
  text-align: center;
  color: #4e7898;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(112, 194, 245, 0.35);
}

.state-box.empty {
  color: #6e8ea4;
}

.state-box.error {
  color: #b84a5a;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.retry-btn {
  border: none;
  border-radius: 999px;
  padding: 0.42rem 0.96rem;
  color: #fff;
  background: linear-gradient(135deg, #e06f88, #ff9db4);
  cursor: pointer;
}

@media (max-width: 1024px) {
  .hero-section {
    grid-template-columns: 1fr;
    padding: 1.6rem 1.2rem 1rem;
  }

  .hero-copy,
  .hero-info {
    padding: 1.4rem;
  }

  .cloud-bridge {
    margin: 0 0.6rem;
  }

  .home-main {
    padding: 0.95rem 1.2rem 1.5rem;
  }

  .hero-title {
    font-size: clamp(2.6rem, 12vw, 4rem);
  }
}

@media (max-width: 680px) {
  .hero-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .bridge-label {
    font-size: 0.66rem;
    letter-spacing: 0.08em;
  }

  .cloud-track {
    left: -75%;
    width: 260%;
  }
}
</style>

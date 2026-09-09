<template>
  <div class="home">
    <section class="hero-section" ref="heroPosition">
      <!-- Decorative Sun -->
      <div class="hero-sun-decoration animate-shimmer">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <g class="animate-pulse-glow">
            <line x1="36" y1="36" x2="36" y2="4" stroke="#FFCC66" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
            <line x1="36" y1="36" x2="52" y2="8.29" stroke="#FFCC66" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
            <line x1="36" y1="36" x2="63.71" y2="20" stroke="#FFCC66" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
            <line x1="36" y1="36" x2="68" y2="36" stroke="#FFCC66" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
            <line x1="36" y1="36" x2="63.71" y2="52" stroke="#FFCC66" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
            <line x1="36" y1="36" x2="52" y2="63.71" stroke="#FFCC66" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
            <line x1="36" y1="36" x2="36" y2="68" stroke="#FFCC66" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
            <line x1="36" y1="36" x2="20" y2="63.71" stroke="#FFCC66" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
            <line x1="36" y1="36" x2="8.29" y2="52" stroke="#FFCC66" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
            <line x1="36" y1="36" x2="4" y2="36" stroke="#FFCC66" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
            <line x1="36" y1="36" x2="8.29" y2="20" stroke="#FFCC66" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
            <line x1="36" y1="36" x2="20" y2="8.29" stroke="#FFCC66" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
          </g>
          <circle cx="36" cy="36" r="16" fill="#FFCC66" fill-opacity="0.9"/>
          <circle cx="36" cy="36" r="11" fill="#FFEE88" fill-opacity="0.85"/>
        </svg>
      </div>

      <!-- Floating Cloud -->
      <div class="hero-cloud-decoration animate-float-delayed">
        <svg width="80" height="42" viewBox="0 0 120 60" fill="none">
          <ellipse cx="60" cy="35" rx="55" ry="22" fill="white" fill-opacity="0.7"/>
          <ellipse cx="40" cy="28" rx="30" ry="20" fill="white" fill-opacity="0.8"/>
          <ellipse cx="80" cy="30" rx="28" ry="18" fill="white" fill-opacity="0.75"/>
        </svg>
      </div>

      <div class="hero-panel hero-copy">
        <p class="hero-kicker animate-fadeInUp">
          Summer
        </p>
        <h1 class="hero-title animate-fadeInUp">
          Blog
          <span class="hero-sparkle animate-sparkle">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" fill="#FFCC66" fill-opacity="0.9"/>
            </svg>
          </span>
        </h1>
        <p class="hero-desc animate-fadeInUp">
          在一片夏日，记录开发、灵感与日常。
        </p>
        <div class="hero-actions animate-fadeInUp">
          <button
            class="hero-btn primary"
            @click="router.push('/blog')"
          >
            进入博客
          </button>
          <button
            class="hero-btn ghost"
            @click="router.push('/documents')"
          >
            文档库
          </button>
        </div>
      </div>

      <div class="hero-panel hero-info animate-fadeInUp">
        <p class="info-date">
          {{ currentDate }}
        </p>
        <p class="info-time">
          {{ currentTime }}
        </p>
        <p class="info-location">
          {{ weatherCard.location }} · {{ currentWeekday }}
        </p>
        <p class="info-weather">
          {{ weatherHeadline }}
        </p>
        <p class="info-tip">
          {{ weatherSummary }}
        </p>
        <p class="info-meta">
          {{ weatherMeta }}
        </p>
      </div>
    </section>
    <Teleport to="body">
      <section
        class="cloud-bridge"
        aria-label="动态云朵衔接区"
        :style="cloudPositionStyle"
        v-if="isHomeRoute"
      >
        <div class="cloud-track track-one">
          <span class="cloud c1" />
          <span class="cloud c2" />
          <span class="cloud c3" />
          <span class="cloud c4" />
          <span class="cloud c5" />
        </div>
        <div class="cloud-track track-two">
          <span class="cloud c6" />
          <span class="cloud c7" />
          <span class="cloud c8" />
          <span class="cloud c9" />
        </div>
        <div class="bridge-shimmer" />
      </section>
    </Teleport>

    <section class="home-main">
      <section class="block">
        <div class="section-head">
          <h2><span style="color: #FFAA33;">☀</span> 置顶内容</h2>
          <button
            class="link-btn"
            @click="navigateToReadme"
          >
            使用指南
          </button>
        </div>

        <div
          v-if="pinnedDocuments.length === 0 && pinnedBlogs.length === 0"
          class="state-box empty"
        >
          暂无置顶内容
        </div>

        <div
          v-else
          class="pin-grid"
        >
          <article
            class="pin-card pin-card-special"
            @click="navigateToReadme"
          >
            <div class="pin-icon">
              📘
            </div>
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
            <div class="pin-icon">
              📄
            </div>
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
            <div class="pin-icon">
              📝
            </div>
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
          <h2><span style="color: #FFAA33;">★</span> 最近博客</h2>
          <button
            class="link-btn"
            @click="router.push('/blog')"
          >
            查看全部
          </button>
        </div>

        <div
          v-if="loading"
          class="state-box"
        >
          内容加载中...
        </div>

        <div
          v-else-if="error"
          class="state-box error"
        >
          <span>{{ error }}</span>
          <button
            class="retry-btn"
            @click="loadContent"
          >
            重试
          </button>
        </div>

        <div
          v-else-if="recentBlogs.length === 0"
          class="state-box empty"
        >
          暂无最近博客
        </div>

        <div
          v-else
          class="recent-list"
        >
          <article
            v-for="blog in recentBlogs"
            :key="blog.id || blog._id"
            class="recent-item"
            @click="navigateToBlog(blog)"
          >
            <div class="recent-content">
              <h3>{{ blog.title }}</h3>
              <p>{{ blog.description || blog.excerpt || '暂无摘要。' }}</p>
              <div class="meta-line">
                <span class="pill">{{ formatDate(blog.publishedAt || blog.createdAt || blog.date) }}</span>
                <span class="pill">{{ blog.category || '未分类' }}</span>
                <span
                  v-if="blog.tags && blog.tags.length"
                  class="pill"
                >
                  {{ blog.tags.slice(0, 2).join(' · ') }}
                </span>
              </div>
            </div>
            <aside class="blog-side">
              <div
                v-if="getCoverSrc(blog)"
                class="blog-cover"
              >
                <img
                  :src="getCoverSrc(blog)"
                  alt="博客封面"
                  loading="lazy"
                  decoding="async"
                  @error="handleImageError(blog)"
                />
              </div>
              <div class="read-more">
                阅读更多 <AppIcon name="arrow-right" />
              </div>
            </aside>
          </article>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter,useRoute } from 'vue-router'
import { blogApi } from '@/api/blog'
import { documentApi } from '@/api/document'
import { weatherApi } from '@/api/weather'
import { resolveStoredAssetUrl } from '@/utils/assetUrl'

const router = useRouter()
const route = useRoute()
const cloudSpeed = 2.5
const heroPosition = ref(null)
const baseScrollY = ref(0)
const cloudPosition=ref({ top: 0 , left: 0 })
const baseCloudPosition = ref(0)

const currentDate = ref('')
const currentTime = ref('')
const currentWeekday = ref('')
const pinnedDocuments = ref([])
const pinnedBlogs = ref([])
const recentBlogs = ref([])
const loading = ref(false)
const coverErrorBlogs = ref({})

const error = ref('')
const weatherLoading = ref(true)
const weatherError = ref(false)
const weatherCard = ref({
  location: 'Shanghai',
  temperature: null,
  low: null,
  high: null,
  humidity: null,
  description: '',
  icon: '',
  windSpeed: null,
  pressure: null,
  updatedAt: '',
  tip: ''
})

let timeInterval = null
let weatherInterval = null

const isHomeRoute = computed(() => route.name === 'home')

const weatherHeadline = computed(() => {
  if (weatherLoading.value && weatherCard.value.temperature === null) {
    return '天气获取中...'
  }

  if (weatherError.value && weatherCard.value.temperature === null) {
    return '实时天气暂不可用'
  }

  return `${weatherCard.value.icon} ${weatherCard.value.temperature}°C · ${weatherCard.value.low}~${weatherCard.value.high}°C`
})

const weatherSummary = computed(() => {
  if (weatherLoading.value && weatherCard.value.temperature === null) {
    return '正在同步上海最新天气。'
  }

  if (weatherError.value && weatherCard.value.temperature === null) {
    return '天气接口暂时不可用，稍后会自动重试。'
  }

  if (weatherError.value) {
    return `${weatherCard.value.description} · 天气更新稍有延迟`
  }

  return `${weatherCard.value.description} · 湿度 ${weatherCard.value.humidity}%`
})

const weatherMeta = computed(() => {
  if (weatherLoading.value && weatherCard.value.temperature === null) {
    return '将展示上海的实时温度、风速和气压。'
  }

  if (weatherError.value && weatherCard.value.temperature === null) {
    return '日期时间与首页内容仍可正常浏览。'
  }

  const meta = [
    `风速 ${weatherCard.value.windSpeed} km/h`,
    `气压 ${weatherCard.value.pressure} hPa`
  ]

  const updatedLabel = formatWeatherUpdateTime(weatherCard.value.updatedAt)
  if (updatedLabel) {
    meta.push(`更新 ${updatedLabel}`)
  }

  return meta.join(' · ')
})

const cloudPositionStyle=computed(()=>{
  return {
  position:'absolute',
  left:`0px`,
  top:`${cloudPosition.value.top}px`,
  zIndex: 9999
}})

const updateDateTime = () => {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
  currentWeekday.value = now.toLocaleDateString('zh-CN', { weekday: 'long' })
}

const formatWeatherUpdateTime = (dateString) => {
  if (!dateString) return ''
  const [datePart, timePart = ''] = String(dateString).split('T')

  if (timePart) {
    return timePart.slice(0, 5)
  }

  const date = new Date(datePart)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadWeather = async () => {
  const isInitialLoad = weatherCard.value.temperature === null

  if (isInitialLoad) {
    weatherLoading.value = true
  }

  weatherError.value = false

  try {
    weatherCard.value = await weatherApi.getShanghaiWeather()
  } catch (err) {
    weatherError.value = true
    console.warn('Failed to load Shanghai weather:', err)
  } finally {
    if (isInitialLoad) {
      weatherLoading.value = false
    }
  }
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

const getBlogId = (blog) => blog?.id || blog?._id || blog?.slug

const getCoverSrc = (blog) => {
  const id = getBlogId(blog)
  if (id && coverErrorBlogs.value[id]) return ''
  const href = blog?.coverImage
  if (!href) return ''
  return resolveStoredAssetUrl(href)
}

const handleImageError = (blog) => {
  const id = getBlogId(blog)
  if (!id) return
  coverErrorBlogs.value = {
    ...coverErrorBlogs.value,
    [id]: true
  }
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

const InitializeCloudPosition = () => {
  if(!heroPosition.value) return;
  const rect = heroPosition.value.getBoundingClientRect()
  baseCloudPosition.value =rect.bottom + window.scrollY//定位云朵初始位置
  baseScrollY.value = window.scrollY//定位scroll初始值
  UpdateCloudPosition()
}

const UpdateCloudPosition = () => {
  cloudPosition.value.top = baseCloudPosition.value + ( 1 - cloudSpeed ) * ( window.scrollY - baseScrollY.value )
}

onMounted(async () => {
  updateDateTime()
  // 首屏时间保持稳定，避免动态秒钟在性能测量期间不断成为新的 LCP 候选。
  // 一分钟后再开始按分钟更新，展示仍然足够及时。
  timeInterval = setTimeout(() => {
    updateDateTime()
    timeInterval = setInterval(updateDateTime, 60 * 1000)
  }, 60 * 1000)

  await nextTick()
  await loadWeather()
  weatherInterval = setInterval(loadWeather, 30 * 60 * 1000)
  await nextTick()
  
  InitializeCloudPosition()

  loadContent()
  prefetchCommonRoutes()
  window.addEventListener('scroll',UpdateCloudPosition)
  
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  if (weatherInterval) clearInterval(weatherInterval)
  window.removeEventListener('scroll',UpdateCloudPosition)
})
</script>

<style scoped>
.home {
  position: relative;
  min-height: 100%;
  color: var(--summer-text-main);
  background: transparent;
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

/* Decorative Elements */
.hero-sun-decoration {
  position: absolute;
  top: 1.2rem;
  right: 18%;
  z-index: 2;
  pointer-events: none;
}

.hero-cloud-decoration {
  position: absolute;
  top: 2rem;
  right: 6%;
  z-index: 1;
  pointer-events: none;
  opacity: 0.5;
}

/* Animation delays for hero elements */
.hero-kicker.animate-fadeInUp { animation-delay: 0.1s; }
.hero-title.animate-fadeInUp { animation-delay: 0.2s; }
.hero-desc.animate-fadeInUp { animation-delay: 0.3s; }
.hero-actions.animate-fadeInUp { animation-delay: 0.4s; }
.hero-info.animate-fadeInUp { animation-delay: 0.3s; }

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
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(2, 119, 189, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.hero-copy {
  padding: 2.6rem 2.4rem;
}

.hero-kicker {
  margin: 0;
  font-size: 0.88rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 700;
  text-shadow: 0 1px 8px rgba(2, 136, 209, 0.5);
}

.hero-title {
  margin: 0.8rem 0 1rem;
  font-size: clamp(3.1rem, 7vw, 5.4rem);
  line-height: 0.9;
  font-family: var(--summer-font-display);
  color: #FFFFFF;
  text-shadow: 0 2px 16px rgba(2, 136, 209, 0.6), 0 4px 30px rgba(2, 136, 209, 0.3), 0 0 60px rgba(79, 195, 247, 0.2);
  position: relative;
}

.hero-sparkle {
  position: absolute;
  top: -0.5rem;
  left: clamp(120px, 30vw, 200px);
}

.hero-desc {
  margin: 0;
  max-width: 34rem;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.02rem;
  text-shadow: 0 1px 8px rgba(2, 136, 209, 0.5);
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
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(45, 180, 255, 0.4);
}

.hero-btn.primary:hover {
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
  box-shadow: 0 6px 24px rgba(45, 180, 255, 0.55);
}

.hero-btn.ghost {
  background: rgba(255, 255, 255, 0.7);
  color: var(--summer-text-main);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 2px 12px rgba(2, 136, 209, 0.1);
}

.hero-btn.ghost:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 20px rgba(2, 136, 209, 0.2);
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
  color: var(--summer-text-main);
}

.info-time {
  margin: 0;
  font-size: 2.1rem;
  font-weight: 800;
  color: var(--summer-text-main);
  font-family: var(--summer-font-display), 'JetBrains Mono', 'Consolas', monospace;
}

.info-location {
  margin: 0;
  color: var(--summer-text-secondary);
  font-style: italic;
  font-size: 1.2rem;
}

.info-weather {
  margin: 0;
  font-size: 2rem;
  color: var(--color-weather-temp);
  font-family: var(--summer-font-display);
}

.info-tip {
  margin: 0.4rem 0 0;
  color: var(--summer-text-secondary);
  font-size: 0.95rem;
}

.info-meta {
  margin: 0;
  color: var(--summer-text-muted);
  font-size: 0.88rem;
  line-height: 1.45;
}

.cloud-bridge {
  position: relative;
  height: 150px;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  overflow: hidden;
}

.bridge-shimmer {
  position: absolute;
  inset: 0;
  animation: bridge-shimmer 8.6s linear infinite;
}

.cloud-track {
  position: absolute;
  top: 15%;
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
  padding: 1.2rem 0 2.2rem;
  display: grid;
  gap: 1.5rem;
}

.block {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 24px rgba(2, 136, 209, 0.15);
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
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 4px 24px rgba(2, 136, 209, 0.15);
  cursor: pointer;
  transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
}

.pin-card:hover,
.recent-item:hover {
  transform: translateY(-3px);
  border-color: rgba(79, 174, 236, 0.8);
  box-shadow: 0 16px 48px rgba(2, 136, 209, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5);
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
  color: var(--color-tag-text);
  background: var(--color-tag-bg);
  border: 1px solid rgba(112, 189, 243, 0.4);
  transition: all 0.2s ease;
}

.pill:hover {
  background: rgba(45, 180, 255, 0.35);
}

.recent-list {
  display: grid;
  gap: 0.75rem;
}

.recent-item {
  display: flex;
  gap: 0.9rem;
  align-items: stretch;
  padding: 1rem;
}

.recent-content {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.recent-content h3 {
  margin: 0;
  color: #2f77ba;
  font-size: 1.08rem;
  line-height: 1.32;
}

.recent-content p {
  margin: 0.5rem 0 0;
  color: #587a93;
  line-height: 1.52;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-side {
  width: 210px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.55rem;
}

.blog-cover {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(122, 200, 245, 0.38);
  background: linear-gradient(135deg, rgba(235, 249, 255, 0.95), rgba(255, 255, 255, 0.8));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76);
}

.blog-cover img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.28s ease;
}

.recent-item:hover .blog-cover img {
  transform: scale(1.04);
}

.read-more {
  align-self: flex-end;
  color: #2f84d7;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.read-more i {
  margin-left: 0.22rem;
  transition: transform 0.22s ease;
}

.recent-item:hover .read-more i {
  transform: translateX(3px);
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

  .cloud-track {
    left: -75%;
    width: 260%;
  }

  .recent-item {
    flex-direction: column;
  }

  .blog-side {
    width: 100%;
  }

  .read-more {
    align-self: flex-start;
  }
}
</style>

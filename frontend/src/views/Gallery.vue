<template>
  <div class="gallery-page">
    <header class="page-head">
      <p class="head-kicker">
        Visual Board
      </p>
      <h1>图库展示</h1>
      <p class="head-desc">
        精选图像集合，支持分类与标签筛选。
      </p>
    </header>

    <section class="filter-card">
      <div class="filter-group">
        <h3>分类</h3>
        <div class="filter-pills">
          <button
            v-for="category in categories"
            :key="category"
            class="filter-pill"
            :class="{ active: selectedCategory === category }"
            @click="filterByCategory(category)"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <div
        v-if="availableTags.length > 0"
        class="filter-group"
      >
        <h3>标签</h3>
        <div class="filter-pills">
          <button
            class="filter-pill"
            :class="{ active: selectedTag === '全部' }"
            @click="filterByTag('全部')"
          >
            全部
          </button>
          <button
            v-for="tag in availableTags"
            :key="tag"
            class="filter-pill"
            :class="{ active: selectedTag === tag }"
            @click="filterByTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </section>

    <div
      v-if="loading"
      class="state-box"
    >
      <div class="state-spinner" />
      <p>正在加载图片...</p>
    </div>

    <div
      v-else-if="error"
      class="state-box error"
    >
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button
        class="retry-btn"
        @click="loadImages"
      >
        重试
      </button>
    </div>

    <section
      v-else
      class="masonry-grid"
    >
      <article
        v-for="(image, index) in filteredImages"
        :key="image._id || image.id"
        class="masonry-item"
        :style="{ animationDelay: `${index * 45}ms` }"
        @click="openLightbox(image, index)"
      >
        <div class="image-shell">
          <img
            :src="getImageUrl(image.thumbnail)"
            :alt="image.title"
            loading="lazy"
            @error="handleImageError"
          >
          <div class="image-overlay">
            <h4>{{ image.title }}</h4>
            <p v-if="image.description">
              {{ image.description }}
            </p>
            <div class="meta-line">
              <span class="pill category">{{ image.category || '未分类' }}</span>
              <span
                v-if="image.secondaryTags && image.secondaryTags.length"
                class="pill"
              >
                {{ image.secondaryTags.slice(0, 2).join(' · ') }}
              </span>
            </div>
          </div>
        </div>
      </article>
    </section>

    <div
      v-if="!loading && !error && filteredImages.length === 0"
      class="state-box empty"
    >
      <h3>暂无图片</h3>
      <p>{{ getEmptyStateMessage() }}</p>
    </div>

    <Teleport to="body">
      <div
        v-if="showLightbox"
        class="lightbox-overlay"
        @click="closeLightbox"
      >
        <div
          class="lightbox-container"
          @click.stop
        >
          <button
            class="lightbox-close"
            @click="closeLightbox"
          >
            <i class="fas fa-xmark" />
          </button>

          <div class="lightbox-image">
            <img
              :src="getImageUrl(currentImage?.fullSize || currentImage?.thumbnail)"
              :alt="currentImage?.title"
            >
          </div>

          <div class="lightbox-info">
            <h3>{{ currentImage?.title }}</h3>
            <p v-if="currentImage?.description">
              {{ currentImage.description }}
            </p>
            <div class="meta-line">
              <span class="pill category">{{ currentImage?.category || '未分类' }}</span>
              <span
                v-if="currentImage?.date"
                class="pill"
              >{{ formatDate(currentImage.date) }}</span>
            </div>
            <div
              v-if="currentImage?.secondaryTags && currentImage.secondaryTags.length"
              class="tag-line"
            >
              <span
                v-for="tag in currentImage.secondaryTags"
                :key="tag"
                class="tag-item"
              >{{ tag }}</span>
            </div>
          </div>

          <button
            v-if="currentImageIndex > 0"
            class="lightbox-nav prev"
            @click="previousImage"
          >
            <i class="fas fa-chevron-left" />
          </button>
          <button
            v-if="currentImageIndex < filteredImages.length - 1"
            class="lightbox-nav next"
            @click="nextImage"
          >
            <i class="fas fa-chevron-right" />
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { galleryApi } from '@/api/gallery'

const selectedCategory = ref('全部')
const selectedTag = ref('全部')
const showLightbox = ref(false)
const currentImage = ref(null)
const currentImageIndex = ref(0)
const loading = ref(false)
const error = ref('')

const allImages = ref([])

const categories = computed(() => {
  return ['全部', ...new Set(allImages.value.map((img) => img.category).filter(Boolean))]
})

const availableTags = computed(() => {
  const imagePool =
    selectedCategory.value === '全部'
      ? allImages.value
      : allImages.value.filter((img) => img.category === selectedCategory.value)

  return [...new Set(imagePool.flatMap((img) => img.secondaryTags || []))]
})

const filteredImages = computed(() => {
  let images = allImages.value

  if (selectedCategory.value !== '全部') {
    images = images.filter((img) => img.category === selectedCategory.value)
  }

  if (selectedTag.value !== '全部') {
    images = images.filter((img) => img.secondaryTags && img.secondaryTags.includes(selectedTag.value))
  }

  return images
})

const loadImages = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await galleryApi.getImages({
      page: 1,
      limit: 100
    })

    if (!response?.success) {
      throw new Error(response?.message || '获取图片失败')
    }

    allImages.value = response?.data?.images || []
  } catch (err) {
    console.error('Failed to fetch images:', err)
    error.value = err?.message || '获取图片失败，请稍后重试。'
    allImages.value = []
  } finally {
    loading.value = false
  }
}

const filterByCategory = (category) => {
  selectedCategory.value = category
  selectedTag.value = '全部'
}

const filterByTag = (tag) => {
  selectedTag.value = tag
}

const openLightbox = (image, index) => {
  currentImage.value = image
  currentImageIndex.value = index
  showLightbox.value = true
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  showLightbox.value = false
  currentImage.value = null
  document.body.style.overflow = 'auto'
}

const previousImage = () => {
  if (currentImageIndex.value <= 0) return
  currentImageIndex.value -= 1
  currentImage.value = filteredImages.value[currentImageIndex.value]
}

const nextImage = () => {
  if (currentImageIndex.value >= filteredImages.value.length - 1) return
  currentImageIndex.value += 1
  currentImage.value = filteredImages.value[currentImageIndex.value]
}

const getImageUrl = (url) => {
  if (!url) return '/placeholder.jpg'
  if (url.startsWith('http')) return url

  const baseUrl = import.meta.env.VITE_APP_API_URL?.replace('/api', '')
    || (typeof window !== 'undefined' && (window.location.hostname === 'shirakawananase.top' || window.location.hostname.endsWith('.shirakawananase.top'))
      ? 'https://api.shirakawananase.top'
      : 'http://localhost:3000')

  if (url.startsWith('/')) return `${baseUrl}${url}`
  return `${baseUrl}/${url}`
}

const handleImageError = (event) => {
  event.target.src = '/placeholder.jpg'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getEmptyStateMessage = () => {
  if (selectedCategory.value !== '全部' || selectedTag.value !== '全部') {
    return '没有找到匹配的图片，请尝试其他筛选条件。'
  }
  return '还没有上传任何图片。'
}

const handleKeydown = (event) => {
  if (!showLightbox.value) return

  if (event.key === 'Escape') closeLightbox()
  if (event.key === 'ArrowLeft') previousImage()
  if (event.key === 'ArrowRight') nextImage()
}

onMounted(() => {
  loadImages()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'auto'
})
</script>

<style scoped>
.gallery-page {
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
  display: grid;
  gap: 0.7rem;
}

.filter-group h3 {
  margin: 0;
  color: #4e7898;
  font-size: 0.88rem;
}

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.45rem;
}

.filter-pill {
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

.filter-pill:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(66, 148, 206, 0.2);
}

.filter-pill.active {
  background: linear-gradient(135deg, #2f8ce2, #61c6ff);
  color: #fff;
  border-color: transparent;
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

.masonry-grid {
  column-count: 1;
  column-gap: 0.9rem;
}

@media (min-width: 650px) {
  .masonry-grid {
    column-count: 2;
  }
}

@media (min-width: 980px) {
  .masonry-grid {
    column-count: 3;
  }
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 0.9rem;
  opacity: 0;
  animation: fade-in-up 0.48s ease forwards;
}

.image-shell {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 10px 24px rgba(45, 103, 145, 0.11);
  cursor: pointer;
}

.image-shell img {
  display: block;
  width: 100%;
  height: auto;
  transition: transform 0.4s ease;
}

.image-shell:hover img {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.35rem;
  padding: 0.9rem;
  background: linear-gradient(
    180deg,
    rgba(15, 52, 84, 0.04) 0%,
    rgba(18, 68, 109, 0.18) 45%,
    rgba(15, 61, 96, 0.82) 100%
  );
  color: #f4fcff;
  opacity: 0;
  transition: opacity 0.22s ease;
}

.image-shell:hover .image-overlay {
  opacity: 1;
}

.image-overlay h4 {
  margin: 0;
  font-size: 1.03rem;
}

.image-overlay p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  opacity: 0.95;
}

.meta-line {
  margin-top: 0.1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(188, 229, 255, 0.38);
  background: rgba(225, 245, 255, 0.2);
  color: #f6fdff;
  font-size: 0.72rem;
  padding: 0.24rem 0.62rem;
}

.pill.category {
  background: rgba(129, 211, 255, 0.26);
}

.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 26, 41, 0.82);
  backdrop-filter: blur(7px);
}

.lightbox-container {
  position: relative;
  width: min(960px, 94vw);
  max-height: 92vh;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.65);
  background: rgba(248, 253, 255, 0.95);
  box-shadow: 0 30px 60px rgba(9, 30, 49, 0.35);
  display: flex;
  flex-direction: column;
}

.lightbox-close {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  z-index: 4;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: rgba(18, 78, 123, 0.42);
  color: #fff;
  cursor: pointer;
}

.lightbox-image {
  background: #eaf6ff;
  display: grid;
  place-items: center;
  min-height: 45vh;
}

.lightbox-image img {
  width: 100%;
  max-height: 68vh;
  object-fit: contain;
}

.lightbox-info {
  padding: 1rem 1rem 1.1rem;
}

.lightbox-info h3 {
  margin: 0;
  color: #2b6ea6;
}

.lightbox-info p {
  margin: 0.5rem 0 0;
  color: #5f7f95;
  line-height: 1.55;
}

.tag-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.34rem;
  margin-top: 0.6rem;
}

.tag-item {
  border-radius: 999px;
  border: 1px solid rgba(117, 194, 238, 0.5);
  background: #edf8ff;
  color: #4b7ea7;
  font-size: 0.74rem;
  padding: 0.2rem 0.56rem;
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  border: none;
  background: rgba(14, 65, 103, 0.56);
  color: #fff;
  cursor: pointer;
}

.lightbox-nav.prev {
  left: 0.6rem;
}

.lightbox-nav.next {
  right: 0.6rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .gallery-page {
    padding: 1rem 0.85rem;
  }

  .lightbox-nav {
    display: none;
  }
}
</style>

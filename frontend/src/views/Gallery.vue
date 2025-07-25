<!-- 
  Gallery页面组件 - 现代化风格图库
  功能：
  1. 现代化响应式网格布局
  2. 图片分类和标签过滤
  3. 优雅的hover效果
  4. 图片预览功能
  5. 瀑布流/Masonry布局
-->
<template>
  <div class="modern-gallery">
    <!-- 页面标题 -->
    <div class="gallery-header">
      <h1>图库展示</h1>
      <p class="subtitle">精选作品集合</p>
    </div>
    
    <!-- 分类和标签过滤器 -->
    <div class="gallery-filters">
      <!-- 分类过滤 -->
      <div class="filter-section">
        <h3>分类</h3>
        <div class="filter-pills">
          <button 
            v-for="category in categories" 
            :key="category"
            @click="filterByCategory(category)"
            :class="{ active: selectedCategory === category }"
            class="filter-pill"
          >
            {{ category }}
          </button>
        </div>
      </div>
      
      <!-- 标签过滤 -->
      <div v-if="availableTags.length > 0" class="filter-section">
        <h3>标签</h3>
        <div class="filter-pills">
          <button 
            @click="filterByTag('全部')"
            :class="{ active: selectedTag === '全部' }"
            class="filter-pill"
          >
            全部
          </button>
          <button 
            v-for="tag in availableTags" 
            :key="tag"
            @click="filterByTag(tag)"
            :class="{ active: selectedTag === tag }"
            class="filter-pill"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载图片...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">😞</div>
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button @click="loadImages" class="retry-btn">重试</button>
    </div>
    
    <!-- 图片网格 - Apple风格 -->
    <div v-else class="masonry-grid">
      <div 
        v-for="(image, index) in filteredImages" 
        :key="image._id || image.id"
        class="masonry-item"
        :style="{ animationDelay: index * 50 + 'ms' }"
        @click="openLightbox(image, index)"
      >
        <div class="image-container">
          <img 
            :src="getImageUrl(image.thumbnail)" 
            :alt="image.title"
            loading="lazy"
            @error="handleImageError"
          />
          <div class="image-overlay">
            <div class="overlay-content">
              <h4>{{ image.title }}</h4>
              <p v-if="image.description">{{ image.description }}</p>
              <div class="image-meta">
                <span class="category-badge">{{ image.category }}</span>
                <div class="tags" v-if="image.secondaryTags && image.secondaryTags.length">
                  <span 
                    v-for="tag in image.secondaryTags.slice(0, 3)" 
                    :key="tag"
                    class="tag-badge"
                  >
                    {{ tag }}
                  </span>
                  <span v-if="image.secondaryTags.length > 3" class="tag-more">
                    +{{ image.secondaryTags.length - 3 }}
                  </span>
                </div>
              </div>
            </div>
            <div class="overlay-actions">
              <button class="action-btn view-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && !error && filteredImages.length === 0" class="empty-state">
      <div class="empty-icon">🖼️</div>
      <h3>暂无图片</h3>
      <p>{{ getEmptyStateMessage() }}</p>
    </div>

    <!-- 图片灯箱预览 -->
    <Teleport to="body">
      <div v-if="showLightbox" class="lightbox-overlay" @click="closeLightbox">
        <div class="lightbox-container" @click.stop>
          <button class="lightbox-close" @click="closeLightbox">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          
          <div class="lightbox-image">
            <img :src="getImageUrl(currentImage.fullSize || currentImage.thumbnail)" :alt="currentImage.title" />
          </div>
          
          <div class="lightbox-info">
            <h3>{{ currentImage.title }}</h3>
            <p v-if="currentImage.description">{{ currentImage.description }}</p>
            <div class="lightbox-meta">
              <span class="meta-item">分类：{{ currentImage.category }}</span>
              <span class="meta-item" v-if="currentImage.date">{{ formatDate(currentImage.date) }}</span>
            </div>
            <div class="lightbox-tags" v-if="currentImage.secondaryTags && currentImage.secondaryTags.length">
              <span 
                v-for="tag in currentImage.secondaryTags" 
                :key="tag"
                class="lightbox-tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          
          <!-- 导航按钮 -->
          <button 
            v-if="currentImageIndex > 0"
            @click="previousImage"
            class="lightbox-nav prev"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <button 
            v-if="currentImageIndex < filteredImages.length - 1"
            @click="nextImage"
            class="lightbox-nav next"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { galleryApi } from '@/api/gallery'

// 响应式数据
const selectedCategory = ref('全部')
const selectedTag = ref('全部')
const showLightbox = ref(false)
const currentImage = ref(null)
const currentImageIndex = ref(0)
const loading = ref(false)
const error = ref('')

// 数据
const allImages = ref([])
const allCategories = ref([])
const allTags = ref([])

// 计算属性
const categories = computed(() => {
  const cats = ['全部', ...new Set(allImages.value.map(img => img.category).filter(Boolean))]
  return cats
})

const availableTags = computed(() => {
  if (selectedCategory.value === '全部') {
    return [...new Set(allImages.value.flatMap(img => img.secondaryTags || []))]
  }
  return [...new Set(
    allImages.value
      .filter(img => img.category === selectedCategory.value)
      .flatMap(img => img.secondaryTags || [])
  )]
})

const filteredImages = computed(() => {
  let images = allImages.value

  // 按分类过滤
  if (selectedCategory.value !== '全部') {
    images = images.filter(img => img.category === selectedCategory.value)
  }

  // 按标签过滤
  if (selectedTag.value !== '全部') {
    images = images.filter(img => 
      img.secondaryTags && img.secondaryTags.includes(selectedTag.value)
    )
  }

  return images
})

// 方法
const loadImages = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await galleryApi.getImages({
      page: 1,
      limit: 100
    })
    
    if (response.success) {
      allImages.value = response.data.images || []
    } else {
      throw new Error(response.message || '获取图片失败')
    }
  } catch (err) {
    console.error('获取图片失败:', err)
    error.value = err.message || '获取图片失败，请稍后重试'
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
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
    currentImage.value = filteredImages.value[currentImageIndex.value]
  }
}

const nextImage = () => {
  if (currentImageIndex.value < filteredImages.value.length - 1) {
    currentImageIndex.value++
    currentImage.value = filteredImages.value[currentImageIndex.value]
  }
}

const getImageUrl = (url) => {
  if (!url) return '/placeholder.jpg'
  if (url.startsWith('http')) return url
  const baseUrl = import.meta.env.VITE_APP_API_URL?.replace('/api', '') || 'http://localhost:3000'
  if (url.startsWith('/')) return `${baseUrl}${url}`
  return `${baseUrl}/${url}`
}

const handleImageError = (event) => {
  event.target.src = '/placeholder.jpg'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getEmptyStateMessage = () => {
  if (selectedCategory.value !== '全部' || selectedTag.value !== '全部') {
    return '没有找到匹配的图片，请尝试其他筛选条件'
  }
  return '还没有上传任何图片'
}

// 键盘事件
const handleKeydown = (event) => {
  if (!showLightbox.value) return
  
  switch (event.key) {
    case 'Escape':
      closeLightbox()
      break
    case 'ArrowLeft':
      previousImage()
      break
    case 'ArrowRight':
      nextImage()
      break
  }
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
.modern-gallery {
  min-height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
}

/* 页面标题 */
.gallery-header {
  text-align: center;
  margin-bottom: 3rem;
}

.gallery-header h1 {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(105deg,rgb(45, 167, 224),powderblue);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.2rem;
  color: #64748b;
  font-weight: 300;
}

/* 过滤器 */
.gallery-filters {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 3rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.filter-section {
  margin-bottom: 1.5rem;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.filter-pill {
  padding: 0.5rem 1.25rem;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid transparent;
  border-radius: 50px;
  color: #64748b;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.filter-pill:hover {
  background: rgba(102, 126, 234, 0.1);
  color: rgb(45, 167, 224);
  transform: translateY(-2px);
}

.filter-pill.active {
  background: linear-gradient(105deg,rgb(45, 167, 224),powderblue);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px);
}

/* 状态组件 */
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon, .empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 1rem;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

/* Masonry 网格布局 */
.masonry-grid {
  column-count: 1;
  column-gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .masonry-grid { column-count: 2; }
}

@media (min-width: 768px) {
  .masonry-grid { column-count: 3; }
}

@media (min-width: 1024px) {
  .masonry-grid { column-count: 4; }
}

@media (min-width: 1280px) {
  .masonry-grid { column-count: 5; }
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 1.5rem;
  opacity: 0;
  animation: fadeInUp 0.6s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.image-container {
  position: relative;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-container:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.image-container img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-container:hover img {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, 
    rgba(0, 0, 0, 0) 0%, 
    rgba(0, 0, 0, 0.1) 50%, 
    rgba(0, 0, 0, 0.8) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.5rem;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.overlay-content h4 {
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.overlay-content p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.image-meta {
  margin-top: auto;
}

.category-badge {
  background: rgba(102, 126, 234, 0.9);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: inline-block;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 15px;
  font-size: 0.75rem;
  backdrop-filter: blur(10px);
}

.tag-more {
  background: rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 15px;
  font-size: 0.75rem;
  backdrop-filter: blur(10px);
}

.overlay-actions {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.action-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #667eea;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.action-btn:hover {
  background: white;
  transform: scale(1.1);
}

/* 灯箱样式 */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.lightbox-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.lightbox-close:hover {
  background: rgba(0, 0, 0, 0.7);
}

.lightbox-image {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.lightbox-image img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.lightbox-info {
  padding: 2rem;
  background: white;
}

.lightbox-info h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.lightbox-info p {
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.lightbox-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #9ca3af;
}

.lightbox-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.lightbox-tag {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.lightbox-nav:hover {
  background: rgba(0, 0, 0, 0.7);
}

.lightbox-nav.prev {
  left: 1rem;
}

.lightbox-nav.next {
  right: 1rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modern-gallery {
    padding: 1rem;
  }
  
  .gallery-header h1 {
    font-size: 2rem;
  }
  
  .gallery-filters {
    padding: 1.5rem;
  }
  
  .filter-pills {
    justify-content: center;
  }
  
  .lightbox-info {
    padding: 1.5rem;
  }
  
  .lightbox-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>


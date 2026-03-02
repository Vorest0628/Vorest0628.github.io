<template>
  <div class="document-library">
    <h1>Document Library</h1>

    <div class="library-filters">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索文档..."
          @input="filterDocuments"
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

      <div v-if="secondaryTags.length > 0" class="secondary-tags">
        <div class="tag-label">二级标签</div>
        <div class="tag-buttons">
          <button
            class="tag-btn"
            :class="{ active: selectedSecondaryTag === '全部' }"
            @click="filterBySecondaryTag('全部')"
          >
            全部
          </button>
          <button
            v-for="tag in secondaryTags"
            :key="tag"
            class="tag-btn"
            :class="{ active: selectedSecondaryTag === tag }"
            @click="filterBySecondaryTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <p>正在加载文档...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="getDocuments">重试</button>
    </div>

    <div v-else class="document-list">
      <div
        v-for="doc in filteredDocuments"
        :key="doc.id || doc._id"
        class="document-item"
      >
        <div class="doc-icon">
          <i :class="getDocIcon(doc.type)"></i>
        </div>

        <div class="doc-info">
          <h3>{{ doc.title }}</h3>
          <p>{{ doc.description }}</p>
          <div class="doc-meta">
            <span class="doc-type">{{ doc.type }}</span>
            <span class="doc-size">{{ doc.size || doc.formattedSize }}</span>
            <span class="doc-date">{{ formatDate(doc.date || doc.createdAt) }}</span>
          </div>
          <div class="doc-tags">
            <span class="primary-tag">{{ doc.category }}</span>
            <span
              v-for="tag in doc.secondaryTags || []"
              :key="tag"
              class="secondary-tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="doc-actions">
          <button class="action-btn preview-btn" @click="previewDocument(doc)">预览</button>
          <button class="action-btn download-btn" @click="downloadDocument(doc)">下载</button>
        </div>
      </div>
    </div>

    <div v-if="!loading && !error && filteredDocuments.length === 0" class="empty-state">
      <h3>暂无文档</h3>
      <p>
        {{
          searchQuery || selectedCategory !== '全部' || selectedSecondaryTag !== '全部'
            ? '没有找到匹配的文档。'
            : '还没有上传任何文档。'
        }}
      </p>
    </div>

    <Teleport to="body">
      <div v-if="showPreview" class="document-modal-overlay" @click="closePreview">
        <div class="document-modal-content" @click.stop>
          <div class="document-modal-header">
            <div class="modal-title-section">
              <h3>{{ previewDoc?.title }}</h3>
              <div class="document-info">
                <span class="doc-type-badge">{{ previewDoc?.type }}</span>
                <span class="doc-size">{{ previewDoc?.size || previewDoc?.formattedSize }}</span>
              </div>
            </div>
            <button class="modal-close-btn" @click="closePreview">&times;</button>
          </div>

          <div class="document-modal-body">
            <div class="document-preview-container">
              <VueOfficeViewer
                v-if="documentPreview.previewType.value === 'vue-office'"
                :document="previewDoc"
                :blob="documentBlob"
                @rendered="onDocumentRendered"
                @error="onDocumentError"
                @close="closePreview"
              />

              <div v-else-if="documentPreview.loading.value" class="preview-loading">
                <div class="loading-spinner"></div>
                <p>正在加载文档预览...</p>
              </div>

              <div v-else-if="documentPreview.hasError.value" class="preview-error">
                <div class="error-icon">⚠️</div>
                <h4>预览失败</h4>
                <p>{{ documentPreview.error.value }}</p>
                <button class="download-action-btn" @click="downloadDocument(previewDoc)">
                  下载文档
                </button>
              </div>

              <div
                v-else-if="documentPreview.previewType.value === 'html'"
                class="html-preview"
                v-html="documentPreview.previewContent.value"
              ></div>

              <iframe
                v-else-if="documentPreview.previewType.value === 'iframe'"
                :src="documentPreview.previewUrl.value"
                frameborder="0"
                class="document-preview-frame"
                title="文档预览"
              ></iframe>

              <div
                v-else-if="documentPreview.previewType.value === 'unsupported'"
                class="no-preview-content"
              >
                <div class="no-preview-icon">
                  <i :class="getDocIcon(previewDoc?.type)"></i>
                </div>
                <h4>无法预览此文档</h4>
                <p>{{ previewDoc?.type }} 格式暂不支持在线预览。</p>
                <p class="preview-hint">建议下载后本地打开。</p>
                <button class="download-action-btn" @click="downloadDocument(previewDoc)">
                  立即下载
                </button>
              </div>

              <div v-else class="preview-placeholder">
                <div class="placeholder-icon">📄</div>
                <p>准备预览中...</p>
              </div>
            </div>
          </div>

          <div class="document-modal-footer">
            <div class="document-actions">
              <button class="modal-download-btn" @click="downloadDocument(previewDoc)">
                下载文档
              </button>
              <button class="modal-cancel-btn" @click="closePreview">关闭预览</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { documentApi } from '@/api/document'
import { useDocumentPreview } from '@/composables/useDocumentPreview'
import VueOfficeViewer from '@/components/document-preview/VueOfficeViewer.vue'

const route = useRoute()
const router = useRouter()
const documentPreview = useDocumentPreview()

const searchQuery = ref('')
const selectedCategory = ref('全部')
const selectedSecondaryTag = ref('全部')
const showPreview = ref(false)
const previewDoc = ref(null)
const documentBlob = ref(null)
const loading = ref(false)
const error = ref('')

const allDocuments = ref([])
const allCategories = ref(['全部'])
const allTagsByCategory = ref({})

const getDocuments = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await documentApi.getDocuments({
      page: 1,
      pageSize: 100,
      category: selectedCategory.value === '全部' ? undefined : selectedCategory.value
    })

    if (!response?.success) {
      throw new Error(response?.message || '获取文档失败')
    }

    const payload = response.data
    allDocuments.value = Array.isArray(payload) ? payload : (payload?.documents || [])
    await getCategories()
  } catch (err) {
    console.error('Failed to fetch documents:', err)
    error.value = err?.message || '获取文档失败，请稍后重试'
    allDocuments.value = []
  } finally {
    loading.value = false
  }
}

const getCategories = async () => {
  try {
    const response = await documentApi.getCategories()

    if (response?.success) {
      allCategories.value = response.data?.categories || ['全部']
      allTagsByCategory.value = response.data?.tagsByCategory || {}
      return
    }
  } catch (err) {
    console.warn('Failed to fetch categories:', err)
  }

  const fallback = new Set(['全部', 'Frontend', 'Game', 'AI', 'Music', 'Templates'])
  allDocuments.value.forEach((doc) => {
    if (doc?.category) fallback.add(doc.category)
  })
  allCategories.value = Array.from(fallback)
}

const categories = computed(() => allCategories.value)

const secondaryTags = computed(() => {
  if (selectedCategory.value === '全部') {
    const tags = new Set()
    allDocuments.value.forEach((doc) => {
      ;(doc.secondaryTags || []).forEach((tag) => tags.add(tag))
    })
    return Array.from(tags).sort()
  }

  const directTags = allTagsByCategory.value[selectedCategory.value]
  if (Array.isArray(directTags)) return directTags

  const tags = new Set()
  allDocuments.value
    .filter((doc) => doc.category === selectedCategory.value)
    .forEach((doc) => {
      ;(doc.secondaryTags || []).forEach((tag) => tags.add(tag))
    })
  return Array.from(tags).sort()
})

const filteredDocuments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return allDocuments.value.filter((doc) => {
    const matchCategory = selectedCategory.value === '全部' || doc.category === selectedCategory.value
    const matchSecondary =
      selectedSecondaryTag.value === '全部'
      || ((doc.secondaryTags || []).includes(selectedSecondaryTag.value))

    if (!query) return matchCategory && matchSecondary

    const inTitle = doc.title?.toLowerCase().includes(query)
    const inDesc = doc.description?.toLowerCase().includes(query)
    const inTags = (doc.secondaryTags || []).some((tag) => String(tag).toLowerCase().includes(query))
    return matchCategory && matchSecondary && (inTitle || inDesc || inTags)
  })
})

const filterByCategory = async (category) => {
  selectedCategory.value = category
  selectedSecondaryTag.value = '全部'
  await getDocuments()
}

const filterBySecondaryTag = (tag) => {
  selectedSecondaryTag.value = tag
}

const filterDocuments = () => {
  router.replace({
    path: '/documents',
    query: searchQuery.value ? { search: searchQuery.value } : {}
  })
}

const getDocIcon = (type) => {
  const iconMap = {
    PDF: 'fas fa-file-pdf',
    DOCX: 'fas fa-file-word',
    DOC: 'fas fa-file-word',
    PPTX: 'fas fa-file-powerpoint',
    PPT: 'fas fa-file-powerpoint',
    XLSX: 'fas fa-file-excel',
    XLS: 'fas fa-file-excel',
    TXT: 'fas fa-file-lines',
    MD: 'fab fa-markdown'
  }
  return iconMap[type] || 'fas fa-file'
}

const previewDocument = async (doc) => {
  if (!doc) return

  previewDoc.value = doc
  showPreview.value = true
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', handleEscKey)

  try {
    const blob = await documentApi.getDocumentContent(doc.id || doc._id)
    documentBlob.value = blob
    await documentPreview.previewDocument(blob, doc.type, doc.title)
  } catch (err) {
    console.error('Failed to open preview:', err)
    let message = '加载预览失败。'
    if (doc.type === 'PPTX' || doc.type === 'PPT') {
      message = 'PowerPoint 暂不支持在线预览，请下载查看。'
    } else if (doc.type === 'DOCX' || doc.type === 'DOC') {
      message = 'Word 预览失败，请尝试下载后查看。'
    } else if (doc.type === 'XLSX' || doc.type === 'XLS') {
      message = 'Excel 预览失败，请尝试下载后查看。'
    }
    documentPreview.error.value = message
  }
}

const closePreview = () => {
  showPreview.value = false
  previewDoc.value = null
  documentBlob.value = null
  documentPreview.cleanup()
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleEscKey)
}

const onDocumentRendered = () => {}
const onDocumentError = (err) => {
  console.error('Render error:', err)
}

const handleEscKey = (event) => {
  if (event.key === 'Escape' && showPreview.value) {
    closePreview()
  }
}

const downloadDocument = async (doc) => {
  if (!doc) return

  try {
    const docId = doc.id || doc._id
    if (!docId) return

    await documentApi.recordView(docId)
    const blob = await documentApi.downloadDocument(docId)
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${doc.title}.${doc.type?.toLowerCase() || 'file'}`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (err) {
    console.error('Download failed:', err)
    alert('Download failed. Please try again later.')
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '未知时间'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const handleMessage = (event) => {
  if (event.data === 'download' && previewDoc.value) {
    downloadDocument(previewDoc.value)
  }
}

onMounted(async () => {
  if (typeof route.query.search === 'string') {
    searchQuery.value = route.query.search
  }

  await getCategories()
  await getDocuments()
  window.addEventListener('message', handleMessage)
})

watch(
  () => route.query.search,
  (search) => {
    const next = typeof search === 'string' ? search : ''
    if (next !== searchQuery.value) {
      searchQuery.value = next
    }
  }
)

onUnmounted(() => {
  if (showPreview.value) closePreview()
  documentPreview.cleanup()
  window.removeEventListener('message', handleMessage)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.document-library {
  min-height: 100%;
  padding: 1.35rem;
  background: transparent;
}

h1 {
  margin: 0 0 1rem;
  font-size: clamp(2rem, 5vw, 2.8rem);
  line-height: 1;
  color: #2f85d4;
  font-family: var(--summer-font-display);
}

.library-filters {
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.74);
  background: rgba(247, 252, 255, 0.75);
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 24px rgba(40, 101, 140, 0.11);
  padding: 0.9rem;
  margin-bottom: 1rem;
  display: grid;
  gap: 0.75rem;
}

.search-box input {
  width: 100%;
  border: 1px solid rgba(117, 194, 242, 0.55);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  height: 2.55rem;
  padding: 0 0.95rem;
  color: #336a94;
}

.search-box input:focus {
  outline: none;
  border-color: #42a4f2;
  box-shadow: 0 0 0 3px rgba(115, 200, 251, 0.24);
}

.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.category-btn,
.tag-btn {
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

.category-btn:hover,
.tag-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(66, 148, 206, 0.2);
}

.category-btn.active,
.tag-btn.active {
  background: linear-gradient(135deg, #2f8ce2, #61c6ff);
  color: #fff;
  border-color: transparent;
}

.secondary-tags {
  border-radius: 14px;
  border: 1px solid rgba(157, 214, 246, 0.45);
  background: rgba(237, 248, 255, 0.9);
  padding: 0.75rem;
}

.tag-label {
  font-size: 0.78rem;
  color: #5e84a1;
  margin-bottom: 0.45rem;
  font-weight: 700;
}

.tag-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;
}

.document-list {
  display: grid;
  gap: 0.75rem;
}

.document-item {
  display: flex;
  align-items: center;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 22px rgba(45, 103, 145, 0.11);
  padding: 0.95rem;
  gap: 0.8rem;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.document-item:hover {
  transform: translateY(-2px);
  border-color: rgba(95, 182, 241, 0.82);
  box-shadow: 0 14px 28px rgba(45, 108, 156, 0.17);
}

.doc-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(140deg, #79c7ff, #4caeea);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-info h3 {
  margin: 0;
  color: #2c72ad;
  font-size: 1.08rem;
  line-height: 1.3;
}

.doc-info p {
  margin: 0.44rem 0 0;
  color: #5a7b93;
  line-height: 1.55;
}

.doc-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.6rem;
}

.doc-type,
.doc-size,
.doc-date,
.primary-tag,
.secondary-tag {
  border-radius: 999px;
  border: 1px solid rgba(121, 194, 239, 0.45);
  background: #edf8ff;
  color: #4377a4;
  font-size: 0.74rem;
  padding: 0.2rem 0.56rem;
}

.doc-type,
.primary-tag {
  background: linear-gradient(135deg, #7ecfff, #9ad5ff);
  border-color: transparent;
  color: #195c93;
  font-weight: 700;
}

.doc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.55rem;
}

.doc-actions {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
  flex-shrink: 0;
}

.action-btn {
  border: none;
  border-radius: 999px;
  height: 2rem;
  padding: 0 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.preview-btn {
  background: linear-gradient(135deg, #2f8de2, #5fc2ff);
  color: #fff;
}

.download-btn {
  background: linear-gradient(135deg, #37be98, #59d6b2);
  color: #fff;
}

.empty-state,
.loading-state,
.error-state {
  border-radius: 16px;
  border: 1px solid rgba(118, 196, 241, 0.4);
  background: rgba(255, 255, 255, 0.72);
  text-align: center;
  color: #4e7898;
  padding: 2rem 1rem;
}

.error-state h3,
.empty-state h3 {
  margin: 0 0 0.4rem;
}

.error-state p,
.empty-state p,
.loading-state p {
  margin: 0;
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

.document-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 26, 41, 0.82);
  backdrop-filter: blur(7px);
  padding: 0.8rem;
}

.document-modal-content {
  width: min(1280px, 98vw);
  height: min(92vh, 980px);
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.65);
  background: rgba(248, 253, 255, 0.95);
  box-shadow: 0 30px 60px rgba(9, 30, 49, 0.35);
  display: flex;
  flex-direction: column;
  animation: popup 0.26s ease;
}

.document-modal-header {
  padding: 0.95rem 1.15rem;
  border-bottom: 1px solid rgba(167, 221, 249, 0.45);
  background: linear-gradient(130deg, #2f8de2, #63c9ff 72%, #84e4f2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.modal-title-section h3 {
  margin: 0;
  font-size: 1.1rem;
}

.document-info {
  margin-top: 0.3rem;
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.doc-type-badge {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.24);
  font-size: 0.72rem;
  padding: 0.2rem 0.55rem;
}

.modal-close-btn {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.42);
  background: rgba(18, 78, 123, 0.42);
  color: #fff;
  cursor: pointer;
  font-size: 1.3rem;
}

.document-modal-body {
  flex: 1;
  min-height: 0;
  background: #eaf6ff;
  overflow: hidden;
}

.document-preview-container {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.document-preview-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

.html-preview {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #fff;
  padding: 1rem;
}

.preview-loading,
.preview-error,
.preview-placeholder,
.no-preview-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5rem;
  color: #4e7898;
  padding: 1rem;
}

.loading-spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid rgba(154, 214, 250, 0.5);
  border-top-color: #3a9ff0;
  animation: spin 0.95s linear infinite;
}

.error-icon,
.placeholder-icon {
  font-size: 2rem;
}

.no-preview-icon i {
  font-size: 2.2rem;
  color: #7ca9c8;
}

.preview-hint {
  font-size: 0.82rem;
  color: #6c8aa2;
}

.download-action-btn {
  margin-top: 0.4rem;
  border: none;
  border-radius: 999px;
  padding: 0.5rem 0.9rem;
  background: linear-gradient(135deg, #2f8de2, #5fc2ff);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.document-modal-footer {
  padding: 0.85rem 1rem;
  border-top: 1px solid rgba(167, 221, 249, 0.45);
  background: rgba(244, 251, 255, 0.95);
}

.document-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
}

.modal-download-btn,
.modal-cancel-btn {
  border: none;
  border-radius: 999px;
  height: 2rem;
  padding: 0 0.88rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.modal-download-btn {
  background: linear-gradient(135deg, #37be98, #59d6b2);
  color: #fff;
}

.modal-cancel-btn {
  background: #e6f4ff;
  color: #38729c;
}

:deep(.markdown-preview-container) {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 1rem;
  background: #fff;
}

:deep(.markdown-content) {
  max-width: 920px;
  margin: 0 auto;
  color: #264a66;
  line-height: 1.7;
}

:deep(.markdown-content h1),
:deep(.markdown-content h2),
:deep(.markdown-content h3),
:deep(.markdown-content h4),
:deep(.markdown-content h5),
:deep(.markdown-content h6) {
  margin-top: 1.2rem;
  margin-bottom: 0.6rem;
  color: #2b6da2;
}

:deep(.markdown-content img) {
  max-width: 100%;
  border-radius: 10px;
  display: block;
  margin: 0.65rem 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes popup {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 900px) {
  .document-library {
    padding: 1rem 0.85rem;
  }

  .document-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .doc-actions {
    width: 100%;
    flex-direction: row;
  }

  .action-btn {
    flex: 1;
  }

  .document-modal-content {
    width: 100%;
    height: 95vh;
    border-radius: 16px;
  }

  .document-modal-header,
  .document-modal-footer {
    padding-left: 0.8rem;
    padding-right: 0.8rem;
  }
}
</style>

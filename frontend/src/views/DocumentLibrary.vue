'''<!-- 
  DocumentLibrary页面组件
  功能：
  1. 展示文档列表
  2. 文档分类过滤
  3. 二级标签过滤
  4. 文档搜索
  5. 文档下载
  6. Markdown文档预览
-->
<template>
  <div class="document-library">
    <h1>文档库</h1>
    
    <!-- 搜索和筛选 -->
    <div class="library-filters">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索文档..."
          @input="filterDocuments"
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
      
      <!-- 二级标签过滤 -->
      <div v-if="secondaryTags.length > 0" class="secondary-tags">
        <div class="tag-label">二级标签:</div>
        <div class="tag-buttons">
          <button 
            @click="filterBySecondaryTag('全部')"
            :class="{ active: selectedSecondaryTag === '全部' }"
            class="tag-btn"
          >
            全部
          </button>
          <button 
            v-for="tag in secondaryTags" 
            :key="tag"
            @click="filterBySecondaryTag(tag)"
            :class="{ active: selectedSecondaryTag === tag }"
            class="tag-btn"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </div>

    <!-- 文档列表 -->
    <div v-if="loading" class="loading-state">
      <p>正在加载文档...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button @click="getDocuments" class="retry-btn">重试</button>
    </div>
    
    <div v-else class="document-list">
      <div 
        v-for="doc in filteredDocuments" 
        :key="doc._id || doc.id"
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
              v-for="tag in doc.secondaryTags" 
              :key="tag"
              class="secondary-tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
        
        <div class="doc-actions">
          <button @click="previewDocument(doc)" class="action-btn preview-btn">
            👁️ 预览
          </button>
          <button 
            @click="downloadDocument(doc)"
            class="action-btn download-btn"
          >
            📥 下载
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && !error && filteredDocuments.length === 0" class="empty-state">
      <h3>暂无文档</h3>
      <p>{{ searchQuery || selectedCategory !== '全部' || selectedSecondaryTag !== '全部' ? '没有找到匹配的文档' : '还没有上传任何文档' }}</p>
    </div>

    <!-- 文档预览模态框 - 使用 Teleport 渲染到 body -->
    <Teleport to="body">
      <div v-if="showPreview" class="document-modal-overlay" @click="closePreview">
        <div class="document-modal-content" @click.stop>
          <div class="document-modal-header">
            <div class="modal-title-section">
              <h3>{{ previewDoc.title }}</h3>
              <div class="document-info">
                <span class="doc-type-badge">{{ previewDoc.type }}</span>
                <span class="doc-size">{{ previewDoc.size || previewDoc.formattedSize }}</span>
              </div>
            </div>
            <button @click="closePreview" class="modal-close-btn">&times;</button>
          </div>
          <div class="document-modal-body">
            <div class="document-preview-container">
              <!-- Markdown 预览 -->
              <div v-if="previewDoc.type === 'MD' || previewDoc.type === 'MARKDOWN'" class="markdown-preview" v-html="previewContent"></div>
              
              <!-- 其他类型使用iframe预览 -->
              <iframe
                v-else-if="canPreview(previewDoc)"
                :src="previewUrlObject"
                frameborder="0"
                class="document-preview-frame"
                title="文档预览"
              ></iframe>
              
              <!-- 无法预览的文档 -->
              <div v-else class="no-preview-content">
                <div class="no-preview-icon">
                  <i :class="getDocIcon(previewDoc.type)"></i>
                </div>
                <h4>无法预览此文档</h4>
                <p>{{ previewDoc.type }} 格式的文档暂不支持在线预览</p>
                <p class="preview-hint">请下载文档到本地查看完整内容</p>
                <button @click="downloadDocument(previewDoc)" class="download-action-btn">
                  <i class="fas fa-download"></i>
                  立即下载
                </button>
              </div>
            </div>
          </div>
          <div class="document-modal-footer">
            <div class="document-actions">
              <button @click="downloadDocument(previewDoc)" class="modal-download-btn">
                <i class="fas fa-download"></i>
                下载文档
              </button>
              <button @click="closePreview" class="modal-cancel-btn">
                关闭预览
              </button>
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
import { marked } from 'marked'

// 获取路由信息
const route = useRoute()
const router = useRouter()

// 响应式数据
const searchQuery = ref('')
const selectedCategory = ref('全部')
const selectedSecondaryTag = ref('全部')
const showSearchTip = ref(true)
const showPreview = ref(false)
const previewDoc = ref(null)
const loading = ref(false)
const error = ref('')
const previewContent = ref('') // 用于存储Markdown渲染后的HTML
const previewUrlObject = ref('') // 用于存储Blob URL

// 真实数据
const allDocuments = ref([])
const allCategories = ref(['全部'])
const allTagsByCategory = ref({})

// 获取文档数据
const getDocuments = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await documentApi.getDocuments({
      page: 1,
      pageSize: 100,
      category: selectedCategory.value === '全部' ? undefined : selectedCategory.value,
    })
    
    if (response.success) {
      allDocuments.value = response.data || []
    } else {
      throw new Error(response.message || '获取文档失败')
    }
  } catch (err) {
    console.error('获取文档失败:', err)
    error.value = err.message || '获取文档失败，请稍后重试'
    allDocuments.value = []
  } finally {
    loading.value = false
  }
}

// 获取分类数据
const getCategories = async () => {
  try {
    const response = await documentApi.getCategories()
    
    if (response.success) {
      allCategories.value = response.data.categories || ['全部']
      allTagsByCategory.value = response.data.tagsByCategory || {}
    }
  } catch (err) {
    console.error('获取分类失败:', err)
    allCategories.value = ['全部', '前端开发', '游戏攻略', 'AI技术', '音乐制作', '模板资源']
  }
}

const categories = computed(() => allCategories.value)

const secondaryTags = computed(() => {
  if (selectedCategory.value === '全部') {
    const allTags = new Set()
    allDocuments.value.forEach(doc => {
      if (doc.secondaryTags) {
        doc.secondaryTags.forEach(tag => allTags.add(tag))
      }
    })
    return Array.from(allTags).sort()
  } else {
    const categoryTags = allTagsByCategory.value[selectedCategory.value]
    if (categoryTags) return categoryTags
    
    const tags = new Set()
    allDocuments.value
      .filter(doc => doc.category === selectedCategory.value)
      .forEach(doc => {
        if (doc.secondaryTags) {
          doc.secondaryTags.forEach(tag => tags.add(tag))
        }
      })
    return Array.from(tags).sort()
  }
})

const filteredDocuments = computed(() => {
  let docs = allDocuments.value

  if (selectedCategory.value !== '全部') {
    docs = docs.filter(doc => doc.category === selectedCategory.value)
  }

  if (selectedSecondaryTag.value !== '全部') {
    docs = docs.filter(doc => doc.secondaryTags && doc.secondaryTags.includes(selectedSecondaryTag.value))
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    docs = docs.filter(doc => 
      doc.title.toLowerCase().includes(query) ||
      doc.description.toLowerCase().includes(query) ||
      (doc.secondaryTags && doc.secondaryTags.some(tag => tag.toLowerCase().includes(query)))
    )
  }

  return docs
})

// 方法
const filterByCategory = async (category) => {
  selectedCategory.value = category
  selectedSecondaryTag.value = '全部'
  await getDocuments()
}

const filterBySecondaryTag = (tag) => {
  selectedSecondaryTag.value = tag
}

const filterDocuments = () => {
  // 搜索逻辑由 computed 属性处理
  // 如果用户开始新的搜索，隐藏搜索来源提示
  if (searchQuery.value && showSearchTip.value) {
    // 检查当前搜索词是否与URL参数不同
    if (searchQuery.value !== route.query.search) {
      showSearchTip.value = false
      // 更新URL以反映新的搜索
      router.replace({ 
        path: '/documents', 
        query: searchQuery.value ? { search: searchQuery.value } : {} 
      })
    }
  }
}

// 清除搜索来源提示
const clearSearchSource = () => {
  // 立即隐藏提示和清除搜索框
  showSearchTip.value = false
  searchQuery.value = ''
  // 使用Vue Router来清除URL参数
  router.replace({ path: '/documents' })
}

const getDocIcon = (type) => {
  const iconMap = {
    'PDF': 'fas fa-file-pdf',
    'DOCX': 'fas fa-file-word',
    'PPT': 'fas fa-file-powerpoint',
    'XLSX': 'fas fa-file-excel',
    'TXT': 'fas fa-file-alt',
    'MD': 'fab fa-markdown'
  }
  return iconMap[type] || 'fas fa-file'
}

const previewDocument = async (doc) => {
  console.log('📖 打开文档预览:', doc.title);
  previewDoc.value = doc;
  previewContent.value = '';
  if (previewUrlObject.value) {
    URL.revokeObjectURL(previewUrlObject.value);
    previewUrlObject.value = '';
  }

  if (!canPreview(doc)) {
    showPreview.value = true;
    return;
  }

  try {
    console.log('🔍 开始获取文档内容:', doc.type, doc._id || doc.id);
    const blob = await documentApi.getDocumentContent(doc._id || doc.id);
    console.log('📦 Blob信息:', {
      size: blob.size,
      type: blob.type
    });

    if (doc.type === 'MD' || doc.type === 'MARKDOWN') {
      const markdownText = await blob.text();
      previewContent.value = marked(markdownText);
      console.log('📝 Markdown转换完成, 长度:', previewContent.value.length);
    } else {
      previewUrlObject.value = URL.createObjectURL(blob);
      console.log('🔗 Blob URL创建:', previewUrlObject.value);
    }
  } catch (e) {
    console.error('获取预览内容失败:', e);
    // 根据文档类型显示不同的错误信息
    let errorMessage = '加载预览失败';
    if (doc.type === 'PPTX' || doc.type === 'PPT') {
      errorMessage = 'PowerPoint文档预览需要LibreOffice支持，请尝试下载文档查看';
    } else if (doc.type === 'DOCX') {
      errorMessage = 'Word文档预览失败，可能是LibreOffice配置问题，请尝试下载文档查看';
    } else if (doc.type === 'XLSX' || doc.type === 'XLS') {
      errorMessage = 'Excel文档预览需要LibreOffice支持，请尝试下载文档查看';
    }
    
    previewContent.value = `
      <div style="text-align: center; color: #666; padding: 40px;">
        <div style="font-size: 3em; margin-bottom: 20px;">📄</div>
        <h3 style="color: #e74c3c; margin-bottom: 15px;">预览不可用</h3>
        <p style="margin-bottom: 20px;">${errorMessage}</p>
        <button onclick="window.parent.postMessage('download', '*')" 
                style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
          📥 下载文档
        </button>
      </div>
    `;
  }

  showPreview.value = true;
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', handleEscKey);
};

const closePreview = () => {
  console.log('❌ 关闭文档预览');
  showPreview.value = false;
  previewDoc.value = null;
  previewContent.value = '';
  if (previewUrlObject.value) {
    URL.revokeObjectURL(previewUrlObject.value);
    previewUrlObject.value = '';
  }
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleEscKey);
};

const handleEscKey = (event) => {
  if (event.key === 'Escape' && showPreview.value) {
    closePreview()
  }
}

const downloadDocument = async (doc) => {
  try {
    // Record the view/download action first
    await documentApi.recordView(doc._id || doc.id)
    console.log(`下载文档: ${doc.title}`)

    // Use the authenticated API service to get the file as a Blob
    const blob = await documentApi.downloadDocument(doc._id || doc.id)
    
    // Create a local URL for the blob
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${doc.title}.${doc.type?.toLowerCase() || 'file'}`
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the local URL
    window.URL.revokeObjectURL(downloadUrl)
    
    console.log(`✅ 开始下载: ${doc.title}`)
  } catch (err) {
    console.error('下载失败:', err)
    alert('下载失败，请稍后重试。权限不足或文件可能不存在。')
  }
}

const getDownloadUrl = (doc) => {
  const docId = doc._id || doc.id
  const baseUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:3000/api'
  return docId ? `${baseUrl}/documents/${docId}/download` : '#'
}

const getPreviewUrl = (doc) => {
  const docId = doc._id || doc.id
  const baseUrl = import.meta.env.VITE_APP_API_URL || 'http://localhost:3000/api'
  return docId ? `${baseUrl}/documents/${docId}/preview` : '#'
}

const canPreview = (doc) => {
  if (!doc || !doc.filePath) return false
  const previewableTypes = ['PDF', 'TXT', 'DOCX', 'PPT', 'PPTX', 'MD', 'MARKDOWN']
  return previewableTypes.includes(doc.type)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 处理来自iframe的消息
const handleMessage = (event) => {
  if (event.data === 'download' && previewDoc.value) {
    downloadDocument(previewDoc.value)
  }
}

onMounted(async () => {
  // 检查URL搜索参数
  if (route.query.search) {
    searchQuery.value = route.query.search
    showSearchTip.value = true
  } else {
    showSearchTip.value = false
  }
  
  await getCategories()
  await getDocuments()
  window.addEventListener('message', handleMessage)
})

// 添加路由监听，在路由变化时清除搜索状态
watch(() => route.path, (newPath, oldPath) => {
  // 如果路由路径发生变化（不是查询参数变化），清除搜索状态
  if (newPath !== oldPath && newPath === '/documents') {
    // 只有当路径改变且没有搜索参数时才清除
    if (!route.query.search) {
      searchQuery.value = ''
      showSearchTip.value = false
    }
  }
})

// 监听路由查询参数变化
watch(() => route.query, (newQuery) => {
  if (newQuery.search && newQuery.search !== searchQuery.value) {
    searchQuery.value = newQuery.search
    showSearchTip.value = true
  } else if (!newQuery.search && searchQuery.value) {
    // 如果URL中没有搜索参数但本地还有搜索值，清除它
    searchQuery.value = ''
    showSearchTip.value = false
  }
}, { immediate: false })

onUnmounted(() => {
  if (showPreview.value) {
    closePreview()
  }
  window.removeEventListener('message', handleMessage)
})
</script>

<style scoped>
.document-library {
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

.search-source-tip {
  margin: 0 auto 20px auto;
  max-width: 600px;
}

.tip-content {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border: 1px solid #2196f3;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #1565c0;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
}

.tip-icon {
  font-size: 16px;
}

.clear-tip-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  margin-left: auto;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-tip-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

.library-filters {
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-box input {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.search-box input:focus {
  outline: none;
  border-color: #3498db;
}

.category-filter {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.category-btn {
  padding: 8px 16px;
  border: 2px solid #e67e22;
  background-color: white;
  color: #e67e22;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.category-btn:hover,
.category-btn.active {
  background-color: #e67e22;
  color: white;
}

.secondary-tags {
  background-color: #f8f8f8;
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #eee;
}

.tag-label {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 10px;
  font-weight: bold;
}

.tag-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-btn {
  padding: 4px 12px;
  border: 1px solid #ddd;
  background-color: white;
  color: #666;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.8rem;
}

.tag-btn:hover,
.tag-btn.active {
  background-color: #f39c12;
  color: white;
  border-color: #f39c12;
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.document-item {
  display: flex;
  align-items: center;
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 15px rgba(0,0,0,0.1);
  transition: all 0.3s;
}

.document-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.doc-icon {
  margin-right: 20px;
  font-size: 2.5rem;
  color: #e67e22;
  min-width: 60px;
  text-align: center;
}

.doc-info {
  flex: 1;
}

.doc-info h3 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 1.3rem;
}

.doc-info p {
  color: #666;
  margin-bottom: 10px;
  line-height: 1.5;
}

.doc-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: #888;
}

.doc-type {
  background-color: #e67e22;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.doc-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.primary-tag {
  background-color: #e67e22;
  color: white;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.secondary-tag {
  background-color: #f1f2f6;
  color: #2f3542;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
}

.doc-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: 20px;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  text-align: center;
  font-size: 0.9rem;
  transition: all 0.3s;
  min-width: 80px;
}

.preview-btn {
  background-color: #3498db;
  color: white;
  border: none;
  cursor: pointer;
}

.preview-btn:hover {
  background-color: #2980b9;
}

.download-btn {
  background-color: #27ae60;
  color: white;
  border: none;
}

.download-btn:hover {
  background-color: #229954;
}

.empty-state, .loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.loading-state p {
  font-size: 1.1rem;
  color: #e67e22;
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
  background-color: #e67e22;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.retry-btn:hover {
  background-color: #d35400;
}

/* 文档预览模态框样式 */
.document-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
  animation: modalFadeIn 0.3s ease-out;
}

.document-modal-content {
  background: white;
  border-radius: 16px;
  width: 95vw;
  height: 95vh;
  max-width: 1200px;
  max-height: 900px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
  overflow: hidden;
}

.document-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-shrink: 0;
}

.modal-title-section h3 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
}

.document-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.doc-type-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.doc-size {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.modal-close-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.document-modal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8f9fa;
}

.document-preview-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.document-preview-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.markdown-preview {
  padding: 20px 40px;
  overflow-y: auto;
  height: 100%;
  line-height: 1.7;
  background: #fff;
  color: #2c3e50;
}

.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3 {
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
  margin-top: 24px;
  margin-bottom: 16px;
}

.markdown-preview code {
  background-color: #f6f8fa;
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  border-radius: 3px;
}

.markdown-preview pre {
  background-color: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow: auto;
}

.markdown-preview pre code {
  padding: 0;
  margin: 0;
  font-size: 100%;
  background: transparent;
}

.markdown-preview blockquote {
  border-left: 0.25em solid #dfe2e5;
  padding: 0 1em;
  color: #6a737d;
}

.no-preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 40px;
  color: #555;
}

.no-preview-icon {
  margin-bottom: 24px;
}

.no-preview-icon i {
  font-size: 4rem;
  color: #cbd5e0;
}

.no-preview-content h4 {
  margin: 0 0 12px 0;
  font-size: 1.5rem;
  color: #2d3748;
}

.no-preview-content p {
  margin: 0 0 8px 0;
  color: #718096;
  line-height: 1.6;
}

.preview-hint {
  font-size: 0.9rem !important;
  color: #a0aec0 !important;
}

.download-action-btn {
  margin-top: 32px;
  padding: 14px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.download-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(102, 126, 234, 0.4);
}

.document-modal-footer {
  padding: 20px 28px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  flex-shrink: 0;
}

.document-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-download-btn,
.modal-cancel-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-download-btn {
  background: #48bb78;
  color: white;
}

.modal-download-btn:hover {
  background: #38a169;
  transform: translateY(-1px);
}

.modal-cancel-btn {
  background: #e2e8f0;
  color: #4a5568;
}

.modal-cancel-btn:hover {
  background: #cbd5e0;
}

/* 动画效果 */
@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .document-library { padding: 15px; }
  h1 { font-size: 2rem; }
  .document-item { flex-direction: column; text-align: center; gap: 15px; }
  .doc-icon { margin-right: 0; margin-bottom: 10px; }
  .doc-actions { flex-direction: row; justify-content: center; margin-left: 0; }
  .doc-meta { justify-content: center; flex-wrap: wrap; }
  .document-modal-content { width: 95vw; height: 90vh; }
  .document-modal-body { padding: 15px; }
}
</style>
''
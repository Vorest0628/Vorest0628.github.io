<template>
  <div class="admin-document-manager">
    <div class="manager-header">
      <h2>文档管理</h2>
      <button @click="showCreateModal = true" class="create-btn">
        📄 上传文档
      </button>
    </div>

    <!-- 筛选选项 -->
    <div class="filter-bar">
      <select v-model="categoryFilter" @change="filterDocuments">
        <option value="">全部分类</option>
        <option value="前端开发">前端开发</option>
        <option value="游戏攻略">游戏攻略</option>
        <option value="AI技术">AI技术</option>
        <option value="音乐制作">音乐制作</option>
        <option value="模板资源">模板资源</option>
      </select>
      <select v-model="typeFilter" @change="filterDocuments">
        <option value="">全部类型</option>
        <option value="PDF">PDF</option>
        <option value="DOCX">DOCX</option>
        <option value="PPT">PPT</option>
        <option value="XLSX">XLSX</option>
        <option value="TXT">TXT</option>
      </select>
      <input
        v-model="searchQuery"
        placeholder="搜索文档标题或描述..."
        @input="filterDocuments"
      />
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
      <div v-for="doc in filteredDocuments" :key="doc._id || doc.id" class="document-card">
        <div class="doc-icon">
          <i :class="getDocIcon(doc.type)"></i>
        </div>
        
        <div class="document-info">
          <h3>{{ doc.title }}</h3>
          <p>{{ doc.description }}</p>
          
          <div class="document-meta">
            <span class="doc-category">{{ doc.category }}</span>
            <span class="doc-type">{{ doc.type }}</span>
            <span class="doc-size">{{ doc.size || doc.formattedSize }}</span>
            <span class="doc-date">{{ formatDate(doc.date || doc.createdAt) }}</span>
            <span :class="['status', doc.status]">
              {{ getStatusText(doc.status) }}
            </span>
          </div>
          
          <div v-if="doc.secondaryTags && doc.secondaryTags.length" class="doc-tags">
            <span v-for="tag in doc.secondaryTags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
        
        <div class="document-actions">
          <button @click="editDocument(doc)" class="edit-btn">编辑</button>
          <button @click="deleteDocument(doc._id || doc.id)" class="delete-btn">删除</button>
          <button @click="downloadDocument(doc)" class="download-btn">下载</button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && !error && filteredDocuments.length === 0" class="empty-state">
      <h3>暂无文档</h3>
      <p>还没有上传任何文档，点击创建按钮开始添加文档</p>
    </div>

    <!-- 创建/编辑模态框 -->
    <Teleport to="body">
      <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ showCreateModal ? '上传文档' : '编辑文档' }}</h3>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveDocument">
            <!-- 文件上传 (仅创建时显示) -->
            <div v-if="showCreateModal" class="form-group">
              <label>📁 选择文档文件</label>
              <div class="file-upload-area" @click="$refs.fileInput?.click()" @dragover.prevent @drop.prevent="handleFileDrop">
                <input ref="fileInput" type="file" @change="handleFileSelect" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md" style="display: none" />
                
                <div v-if="!selectedFile" class="upload-placeholder">
                  <i class="fas fa-cloud-upload-alt upload-icon"></i>
                  <p>点击选择文件或拖拽文件到此处</p>
                  <p class="upload-hint">支持 PDF、Word、PowerPoint、Excel、TXT、Markdown 文件</p>
                  <p class="size-limit">文件大小限制：50MB</p>
                </div>
                
                <div v-else class="selected-file">
                  <i :class="getDocIcon(getFileType(selectedFile.name))" class="file-icon"></i>
                  <div class="file-details">
                    <span class="file-name">{{ selectedFile.name }}</span>
                    <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
                  </div>
                  <button type="button" @click.stop="clearSelectedFile" class="remove-file-btn">✕</button>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label>标题</label>
              <input v-model="currentDocument.title" type="text" required />
            </div>
            <div class="form-group">
              <label>描述</label>
              <textarea v-model="currentDocument.description" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>分类</label>
              <select v-model="currentDocument.category" required>
                <option value="">选择分类</option>
                <option value="前端开发">前端开发</option>
                <option value="游戏攻略">游戏攻略</option>
                <option value="AI技术">AI技术</option>
                <option value="音乐制作">音乐制作</option>
                <option value="模板资源">模板资源</option>
              </select>
            </div>
            <div class="form-group">
              <label>二级标签</label>
              <input v-model="currentDocument.secondaryTagsInput" type="text" placeholder="用逗号分隔多个标签，如：Vue3,JavaScript,Composition API" />
            </div>
            
            <!-- 仅在编辑时显示文件信息 -->
            <div v-if="showEditModal" class="form-group">
              <label>当前文件</label>
              <div class="current-file-info">
                <i :class="getDocIcon(currentDocument.type)"></i>
                <span>{{ currentDocument.title }}.{{ currentDocument.type?.toLowerCase() }}</span>
                <span class="file-size">({{ currentDocument.size }})</span>
            </div>
              <p class="file-note">💡 提示：要更换文件请重新上传</p>
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="currentDocument.status">
                <option value="draft">私人</option>
                <option value="published">公开</option>
                <option value="pinned">置顶</option>
              </select>
            </div>
            <!-- 上传进度 -->
            <div v-if="uploading" class="upload-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
              </div>
              <p class="progress-text">{{ showCreateModal ? '正在上传文档...' : '正在保存...' }} {{ uploadProgress }}%</p>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeModal" :disabled="uploading" class="cancel-btn">取消</button>
              <button type="submit" :disabled="uploading" class="save-btn">
                <span v-if="uploading">
                  <i class="fas fa-spinner fa-spin"></i>
                  {{ showCreateModal ? '上传中...' : '保存中...' }}
                </span>
                <span v-else>
                  {{ showCreateModal ? '📁 上传文档' : '💾 保存' }}
                </span>
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '../../../api/admin'
import { documentApi } from '../../../api/document'

const documents = ref([])
const filteredDocuments = ref([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedFile = ref(null)
const categoryFilter = ref('')
const typeFilter = ref('')
const searchQuery = ref('')
const loading = ref(false)
const error = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)

const currentDocument = reactive({
  id: null,
  title: '',
  description: '',
  category: '',
  secondaryTagsInput: '',
  secondaryTags: [],
  type: '',
  size: '',
  downloadUrl: '',
  previewUrl: '',
  status: 'draft'
})

// 过滤文档
const filterDocuments = () => {
  let filtered = documents.value

  // 分类过滤
  if (categoryFilter.value) {
    filtered = filtered.filter(doc => doc.category === categoryFilter.value)
  }

  // 类型过滤
  if (typeFilter.value) {
    filtered = filtered.filter(doc => doc.type === typeFilter.value)
  }

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(doc =>
      doc.title.toLowerCase().includes(query) ||
      doc.description?.toLowerCase().includes(query) ||
      doc.secondaryTags?.some(tag => tag.toLowerCase().includes(query))
    )
  }

  filteredDocuments.value = filtered
}

// 获取文件类型
const getFileType = (filename) => {
  const extension = filename.split('.').pop().toUpperCase()
  return extension
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    processSelectedFile(file)
  }
}

// 处理拖拽上传
const handleFileDrop = (event) => {
  const files = event.dataTransfer.files
  if (files.length > 0) {
    processSelectedFile(files[0])
  }
}

// 处理选中的文件
const processSelectedFile = (file) => {
  // 检查文件大小（50MB限制）
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    alert('文件大小超过50MB限制，请选择较小的文件')
    return
  }

  // 检查文件类型
  const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.md']
  const fileName = file.name.toLowerCase()
  const isValidType = allowedTypes.some(type => fileName.endsWith(type))
  
  if (!isValidType) {
    alert('不支持的文件类型，请选择 PDF、Word、PowerPoint、Excel、TXT 或 Markdown 文件')
    return
  }

    selectedFile.value = file
    currentDocument.type = getFileType(file.name)
    currentDocument.size = formatFileSize(file.size)
    if (!currentDocument.title) {
      currentDocument.title = file.name.split('.')[0]
    }
}

// 清除选中的文件
const clearSelectedFile = () => {
  selectedFile.value = null
  currentDocument.type = ''
  currentDocument.size = ''
  if (document.refs?.fileInput) {
    document.refs.fileInput.value = ''
  }
}

const getDocuments = async () => {
  loading.value = true
  error.value = ''
  
  try {
    if (import.meta.env.DEV) console.log('🔍 开始获取文档列表...')
    console.log('�� 调用 adminApi.getAllDocuments()')
    console.log('🔍 当前用户token:', localStorage.getItem('token') ? '存在' : '不存在')
    
    const response = await adminApi.getAllDocuments()
    if (import.meta.env.DEV) console.log('📥 API响应:', response)
    
    if (response.success) {
      // 修复：正确获取documents数组
      const documentsData = response.data.documents || response.data || []
      if (import.meta.env.DEV) {
        console.log('📄 文档数据:', documentsData)
        console.log('📄 文档数量:', documentsData.length)
      }
              if (import.meta.env.DEV) {
          console.log('📄 文档状态分布:', documentsData.reduce((acc, doc) => {
            acc[doc.status] = (acc[doc.status] || 0) + 1
            return acc
          }, {}))
        }
      
      documents.value = documentsData
      filteredDocuments.value = documentsData
      console.log(' filteredDocuments 设置完成:', filteredDocuments.value.length)
      console.log(' filteredDocuments 状态分布:', filteredDocuments.value.reduce((acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1
        return acc
      }, {}))
    } else {
      throw new Error(response.message || '获取文档列表失败')
    }
  } catch (err) {
    console.error('❌ 获取文档列表失败:', err)
    // ... 其余错误处理代码保持不变
  } finally {
    loading.value = false
  }
}

const editDocument = (doc) => {
  Object.assign(currentDocument, {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    secondaryTagsInput: doc.secondaryTags?.join(',') || '',
    secondaryTags: doc.secondaryTags || [],
    type: doc.type,
    size: doc.size,
    downloadUrl: doc.downloadUrl,
    previewUrl: doc.previewUrl,
    status: doc.status
  })
  showEditModal.value = true
}

const saveDocument = async () => {
  try {
    uploading.value = true
    uploadProgress.value = 0
          if (import.meta.env.DEV) console.log('🔍 开始保存文档...')
    
    const documentData = {
      title: currentDocument.title,
      description: currentDocument.description,
      category: currentDocument.category,
      secondaryTags: currentDocument.secondaryTagsInput.split(',').map(tag => tag.trim()).filter(Boolean),
      type: currentDocument.type,
      size: currentDocument.size,
      status: currentDocument.status
    }

    console.log('📝 准备发送的文档数据:', JSON.stringify(documentData, null, 2))
    
    // 检查必填字段
    if (!documentData.title) {
      alert('请填写文档标题')
      return
    }
    if (!documentData.category) {
      alert('请选择文档分类')
      return
    }
    
    // 创建新文档时必须上传文件
    if (showCreateModal.value && !selectedFile.value) {
      alert('请选择要上传的文档文件')
      return
    }

    let response
    if (showCreateModal.value) {
      console.log('🆕 创建新文档...')
      // 如果有文件，先上传文件
      if (selectedFile.value) {
        // 模拟上传进度
        const progressInterval = setInterval(() => {
          if (uploadProgress.value < 90) {
            uploadProgress.value += Math.random() * 20
          }
        }, 200)
        
        const formData = new FormData()
        formData.append('document', selectedFile.value)
        // 正确传递所有字段，包括title
        formData.append('title', documentData.title)
        formData.append('description', documentData.description)
        formData.append('category', documentData.category)
        formData.append('type', documentData.type)
        formData.append('status', documentData.status)
        
        // 处理二级标签
        if (documentData.secondaryTags.length > 0) {
          formData.append('secondaryTags', JSON.stringify(documentData.secondaryTags))
        }
        
        console.log('📤 FormData内容:')
        for (let [key, value] of formData.entries()) {
          console.log(`  ${key}:`, value)
        }
        
        try {
        response = await adminApi.uploadDocumentFile(formData)
          uploadProgress.value = 100
        } finally {
          clearInterval(progressInterval)
        }
      } else {
        response = await adminApi.createDocument(documentData)
      }
    } else {
      console.log('✏️ 更新文档...')
      uploadProgress.value = 50
      response = await adminApi.updateDocument(currentDocument.id, documentData)
      uploadProgress.value = 100
    }

    console.log('📤 API响应:', response)

    if (response.success) {
      await getDocuments()
      closeModal()
      alert(showCreateModal.value ? '文档上传成功!' : '文档更新成功!')
    } else {
      throw new Error(response.message || '保存失败')
    }
  } catch (error) {
    console.error('❌ 保存文档失败:', error)
    
    // 详细的错误信息
    let errorMessage = '保存失败'
    
    if (error.response) {
      console.error('错误响应状态:', error.response.status)
      console.error('错误响应数据:', error.response.data)
      
      const errorData = error.response.data
      if (errorData.message) {
        errorMessage += ': ' + errorData.message
      }
      
      // 特定错误处理
      switch (error.response.status) {
        case 400:
          errorMessage = '数据验证失败 - 请检查所有必填字段是否正确填写'
          if (errorData.errors) {
            console.error('验证错误详情:', errorData.errors)
            errorMessage += '\n详细错误: ' + JSON.stringify(errorData.errors)
          }
          break
        case 401:
          errorMessage = '认证失败 - 请重新登录'
          break
        case 403:
          errorMessage = '权限不足 - 您没有权限执行此操作'
          break
        case 500:
          errorMessage = '服务器内部错误 - 请稍后重试'
          break
      }
    } else if (error.request) {
      console.error('请求错误:', error.request)
      errorMessage = '网络连接失败 - 请检查网络连接'
    } else {
      console.error('其他错误:', error.message)
      errorMessage = error.message
    }
    
    alert(errorMessage)
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

const deleteDocument = async (id) => {
  if (!confirm('确定要删除这个文档吗？')) return

  try {
    const response = await adminApi.deleteDocument(id)
    if (response.success) {
      await getDocuments()
      alert('文档删除成功!')
    }
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败: ' + (error.response?.data?.message || error.message))
  }
}

const downloadDocument = async (doc) => {
  try {
    console.log(`📥 管理员下载文档: ${doc.title} (ID: ${doc._id || doc.id})`)
    console.log(`📝 文档状态: ${doc.status}`)
    
    // 使用认证的API服务获取文件Blob
    console.log('🔐 使用认证API请求文档下载...')
    const blob = await documentApi.downloadDocument(doc._id || doc.id)
    console.log('✅ 成功获取文档Blob:', blob.size, 'bytes')
    
    // 创建本地URL
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${doc.title}.${doc.type?.toLowerCase() || 'file'}`
    link.style.display = 'none'
    
    // 添加到DOM，触发下载，然后移除
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理本地URL
    window.URL.revokeObjectURL(downloadUrl)
    
    console.log(`✅ 管理员下载完成: ${doc.title}`)
  } catch (err) {
    console.error('❌ 管理员下载失败:', err)
    console.error('📊 错误详情:', {
      status: err.response?.status,
      message: err.response?.data?.message,
      error: err.message
    })
    alert('下载失败：' + (err.response?.data?.message || err.message || '请稍后重试'))
  }
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  selectedFile.value = null
  
  // 清除文件输入
  if (document.querySelector('input[type="file"]')) {
    document.querySelector('input[type="file"]').value = ''
  }
  
  Object.assign(currentDocument, {
    id: null,
    title: '',
    description: '',
    category: '',
    secondaryTagsInput: '',
    secondaryTags: [],
    type: '',
    size: '',
    status: 'draft'
  })
}

const getDocIcon = (type) => {
  const iconMap = {
    'PDF': 'fas fa-file-pdf',
    'DOCX': 'fas fa-file-word',
    'PPT': 'fas fa-file-powerpoint',
    'XLSX': 'fas fa-file-excel',
    'TXT': 'fas fa-file-alt'
  }
  return iconMap[type] || 'fas fa-file'
}

const formatDate = (dateString) => {
  if (!dateString) return '未知日期'
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return '未知日期'
  }
  
  return date.toLocaleDateString('zh-CN')
}

const getStatusText = (status) => {
  const statusMap = {
    draft: '私人',
    published: '公开',
    pinned: '置顶'
  }
  return statusMap[status] || '未知'
}

const getDocumentUrl = (url) => {
  if (!url) return '#'
  
  // 如果是完整的URL（以http开头），直接返回
  if (url.startsWith('http')) {
    return url
  }
  
  const baseUrl = import.meta.env.VITE_APP_API_URL?.replace('/api', '') || 'http://localhost:3000'
  
  // 如果是相对路径，拼接后端服务器地址
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`
  }
  
  // 其他情况，拼接前缀
  return `${baseUrl}/${url}`
}

onMounted(() => {
  getDocuments()
})
</script>

<style scoped>
.admin-document-manager {
  height: 100%;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.manager-header h2 {
  color: #333;
  margin: 0;
}

.create-btn {
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.create-btn:hover {
  background: #218838;
}

.filter-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-bar select,
.filter-bar input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.filter-bar input {
  width: 300px;
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.document-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: transform 0.3s;
}

.document-card:hover {
  transform: translateY(-2px);
}

.doc-icon {
  font-size: 2.5rem;
  color: #e67e22;
  min-width: 60px;
  text-align: center;
}

.document-info {
  flex: 1;
}

.document-info h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

.document-info p {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.document-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.doc-category {
  background: #e67e22;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 0.8rem;
}

.doc-type {
  background: #3498db;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 0.8rem;
}

.doc-size,
.doc-date {
  color: #666;
}

.status.published {
  color: #28a745;
  font-weight: bold;
}

.status.draft {
  color: #ffc107;
  font-weight: bold;
}

.status.pinned {
  color: #dc3545;
  font-weight: bold;
}

.doc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tag {
  background: #f39c12;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.75rem;
}

.document-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 80px;
}

.edit-btn,
.delete-btn,
.download-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  font-size: 0.8rem;
  transition: all 0.3s;
}

.edit-btn {
  background: #007bff;
  color: white;
}

.edit-btn:hover {
  background: #0056b3;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover {
  background: #c82333;
}

.download-btn {
  background: #28a745;
  color: white;
}

.download-btn:hover {
  background: #218838;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
}

.file-upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-upload-area:hover {
  border-color: #007bff;
  background: #f0f7ff;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  font-size: 3rem;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.upload-placeholder p {
  margin: 0;
  color: #333;
  font-weight: 500;
}

.upload-hint {
  color: #666 !important;
  font-size: 0.9rem !important;
  font-weight: normal !important;
}

.size-limit {
  color: #999 !important;
  font-size: 0.8rem !important;
  font-weight: normal !important;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  width: 100%;
  max-width: 400px;
}

.file-icon {
  font-size: 2rem;
  color: #e67e22;
  min-width: 40px;
}

.file-details {
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  font-weight: 500;
  color: #333;
  word-break: break-all;
}

.file-size {
  color: #666;
  font-size: 0.9rem;
}

.remove-file-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.3s;
}

.remove-file-btn:hover {
  background: #c82333;
}

.current-file-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.current-file-info i {
  font-size: 1.5rem;
  color: #e67e22;
}

.file-note {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.upload-progress {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #20c997);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  text-align: center;
  margin: 0;
  color: #495057;
  font-size: 0.9rem;
  font-weight: 500;
}

.cancel-btn,
.save-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  min-width: 100px;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover:not(:disabled) {
  background: #5a6268;
}

.save-btn {
  background: #28a745;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #218838;
}

.cancel-btn:disabled,
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fa-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .document-card {
    flex-direction: column;
    text-align: center;
  }

  .document-actions {
    flex-direction: row;
    min-width: auto;
  }

  .filter-bar {
    flex-direction: column;
  }

  .filter-bar input {
    width: 100%;
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.error-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.error-state h3 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.retry-btn:hover {
  background: #218838;
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.empty-state h3 {
  color: #666;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #999;
}
</style> 
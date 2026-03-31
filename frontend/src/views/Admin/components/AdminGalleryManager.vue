<template>
  <div class="admin-gallery-manager">
    <div class="manager-header">
      <h2>图库管理</h2>
      <div class="header-actions">
        <!-- 批量操作按钮 -->
        <div
          v-if="selectedImages.length > 0"
          class="batch-actions"
        >
          <span class="selection-count">已选择 {{ selectedImages.length }} 张图片</span>
          <button
            class="batch-delete-btn"
            @click="batchDelete"
          >
            🗑️ 批量删除 ({{ selectedImages.length }})
          </button>
          <button
            class="clear-selection-btn"
            @click="clearSelection"
          >
            ✕ 取消选择
          </button>
        </div>
        
        <button
          class="upload-btn"
          @click="showUploadModal = true"
        >
          📷 上传图片
        </button>
      </div>
    </div>

    <!-- 筛选和搜索栏 -->
    <div class="filter-bar">
      <div class="filter-controls">
        <select
          v-model="categoryFilter"
          @change="filterImages"
        >
          <option value="">
            全部分类
          </option>
          <option value="摄影">
            摄影
          </option>
          <option value="游戏">
            游戏
          </option>
          <option value="编程">
            编程
          </option>
          <option value="设计">
            设计
          </option>
        </select>
        <input
          v-model="searchQuery"
          placeholder="搜索图片标题..."
          @input="filterImages"
        >
      </div>
      
      <!-- 全选控制 -->
      <div class="select-controls">
        <label class="select-all-control">
          <input 
            type="checkbox" 
            :checked="isAllSelected"
            :indeterminate="isPartialSelected"
            @change="toggleSelectAll"
          >
          <span>全选 ({{ filteredImages.length }})</span>
        </label>
      </div>
    </div>

    <!-- 图片网格 -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <div class="loading-spinner" />
      <p>正在加载图片...</p>
    </div>
    
    <div
      v-else-if="error"
      class="error-state"
    >
      <div class="error-icon">
        😞
      </div>
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button
        class="retry-btn"
        @click="getImages"
      >
        重试
      </button>
    </div>
    
    <div
      v-else
      class="gallery-grid"
    >
      <div 
        v-for="image in filteredImages" 
        :key="image._id || image.id" 
        class="image-card"
        :class="{ selected: isImageSelected(image) }"
      >
        <!-- 选择框 -->
        <div class="selection-checkbox">
          <input 
            type="checkbox" 
            :checked="isImageSelected(image)"
            @change="toggleImageSelection(image)"
          >
        </div>
        
        <div class="image-preview">
          <img
            :src="getImageUrl(image.thumbnail || image.url)"
            :alt="image.title"
          >
          <div class="image-overlay">
            <button
              class="edit-btn"
              @click="editImage(image)"
            >
              编辑
            </button>
            <button
              class="delete-btn"
              @click="deleteImage(image._id || image.id)"
            >
              删除
            </button>
          </div>
        </div>
        
        <div class="image-info">
          <div class="image-title">
            {{ image.title }}
          </div>
          <div class="image-meta">
            <span class="category">{{ image.category }}</span>
            <span class="upload-date">{{ formatDate(image.date || image.createdAt) }}</span>
            <span :class="['status', image.isPublic ? 'public' : 'private']">
              {{ image.isPublic ? '公开' : '私有' }}
            </span>
            <span :class="['publish-status', image.status]">
              {{ image.status === 'published' ? '已发布' : '未发布' }}
            </span>
          </div>
          <div
            v-if="image.secondaryTags && image.secondaryTags.length"
            class="image-tags"
          >
            <span
              v-for="tag in image.secondaryTags"
              :key="tag"
              class="tag"
            >{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-if="!loading && !error && filteredImages.length === 0"
      class="empty-state"
    >
      <div class="empty-icon">
        🖼️
      </div>
      <h3>暂无图片</h3>
      <p>还没有上传任何图片，点击上传按钮开始添加图片</p>
    </div>

    <!-- 上传模态框 -->
    <Teleport to="body">
      <div
        v-if="showUploadModal"
        class="modal-overlay"
        @click="closeUploadModal"
      >
        <div
          class="modal-content"
          @click.stop
        >
          <div class="modal-header">
            <h3>上传图片</h3>
            <button
              class="close-btn"
              @click="closeUploadModal"
            >
              ✕
            </button>
          </div>
          <div class="modal-body">
            <!-- 分类选择 -->
            <div class="form-group">
              <label>分类 (一级标签)</label>
              <select
                v-model="uploadForm.category"
                required
                @change="onCategoryChange"
              >
                <option value="">
                  选择分类
                </option>
                <option
                  v-for="category in availableCategories"
                  :key="category"
                  :value="category"
                >
                  {{ category }}
                </option>
                <option value="__other__">
                  其他
                </option>
              </select>
              
              <!-- 自定义分类输入 -->
              <div
                v-if="uploadForm.category === '__other__'"
                class="mt-2"
              >
                <input 
                  v-model="uploadForm.newCategoryText" 
                  type="text" 
                  placeholder="输入新分类名称" 
                  required
                  class="form-control"
                >
              </div>
            </div>
            
            <!-- 二级标签选择 -->
            <div
              v-if="uploadForm.category"
              class="form-group"
            >
              <label>二级标签 (可多选)</label>
              <div class="tags-selection">
                <div
                  v-for="tag in availableTagsForUpload"
                  :key="tag"
                  class="tag-item"
                >
                  <input
                    :id="`upload-tag-${tag}`"
                    v-model="uploadForm.tags"
                    type="checkbox"
                    :value="tag"
                  >
                  <label :for="`upload-tag-${tag}`">{{ tag }}</label>
                </div>
                <div class="tag-item">
                  <input
                    id="upload-other-tag"
                    v-model="uploadForm.otherTagEnabled"
                    type="checkbox"
                  >
                  <label for="upload-other-tag">其他</label>
                  <input
                    v-if="uploadForm.otherTagEnabled"
                    v-model="uploadForm.newTagText"
                    placeholder="新标签,逗号分隔"
                  >
                </div>
              </div>
              <p class="helper-text">
                请先选择分类，然后选择相应的二级标签
              </p>
            </div>
            
            <!-- 状态选择 -->
            <div class="form-group">
              <label>状态</label>
              <div class="status-selection">
                <input
                  id="upload-public"
                  v-model="uploadForm.isPublic"
                  type="radio"
                  value="true"
                >
                <label for="upload-public">公开</label>
                <input
                  id="upload-private"
                  v-model="uploadForm.isPublic"
                  type="radio"
                  value="false"
                >
                <label for="upload-private">私有</label>
              </div>
            </div>

            <div 
              class="upload-area"
              :class="{ 'drag-over': isDragging }"
              @click="triggerFileInput"
              @drop="handleDrop"
              @dragover="handleDragOver"
              @dragenter="handleDragEnter"
              @dragleave="handleDragLeave"
            >
              <input
                ref="fileInput"
                type="file"
                multiple
                accept="image/*"
                class="file-input"
                @change="handleFileSelect"
              >
              <div class="upload-text">
                <p>拖拽图片到此处或点击选择文件</p>
                <p class="upload-hint">
                  支持多文件选择，格式：JPG、PNG、GIF等
                </p>
              </div>
            </div>

            <!-- 已选文件列表 -->
            <div
              v-if="selectedFiles.length > 0"
              class="selected-files"
            >
              <h4>待上传文件 ({{ selectedFiles.length }})</h4>
              <div class="file-list">
                <div
                  v-for="(file, index) in selectedFiles"
                  :key="index"
                  class="file-item"
                >
                  <img
                    :src="file.preview"
                    :alt="file.name"
                    class="file-preview"
                  >
                  <div class="file-info">
                    <div class="file-name">
                      {{ file.name }}
                    </div>
                    <div class="file-size">
                      {{ formatFileSize(file.size) }}
                    </div>
                  </div>
                  <button
                    class="remove-file"
                    @click="removeFile(index)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="cancel-btn"
              @click="closeUploadModal"
            >
              取消
            </button>
            <button 
              :disabled="selectedFiles.length === 0 || uploading" 
              class="upload-confirm-btn"
              @click="uploadImages"
            >
              {{ uploading ? '上传中...' : `上传 ${selectedFiles.length} 张图片` }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 编辑模态框 -->
    <Teleport to="body">
      <div
        v-if="showEditModal"
        class="modal-overlay"
        @click="closeEditModal"
      >
        <div
          class="modal-content"
          @click.stop
        >
          <div class="modal-header">
            <h3>编辑图片</h3>
            <button
              class="close-btn"
              @click="closeEditModal"
            >
              ✕
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveImage">
              <div class="form-group">
                <label>标题</label>
                <input
                  v-model="currentImage.title"
                  type="text"
                  required
                >
              </div>
              <div class="form-group">
                <label>分类</label>
                <select
                  v-model="currentImage.category"
                  required
                >
                  <option value="">
                    选择分类
                  </option>
                  <option
                    v-for="category in availableCategories"
                    :key="category"
                    :value="category"
                  >
                    {{ category }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>二级标签</label>
                <input
                  v-model="currentImage.secondaryTagsInput"
                  type="text"
                  placeholder="用逗号分隔多个标签，如：夜景,城市,建筑"
                >
              </div>
              <div class="form-group">
                <label>可见性</label>
                <div class="visibility-options">
                  <label>
                    <input
                      v-model="currentImage.isPublic"
                      type="radio"
                      :value="true"
                    >
                    公开
                  </label>
                  <label>
                    <input
                      v-model="currentImage.isPublic"
                      type="radio"
                      :value="false"
                    >
                    私有
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label>发布状态</label>
                <select v-model="currentImage.status">
                  <option value="draft">
                    未发布
                  </option>
                  <option value="published">
                    已发布
                  </option>
                </select>
              </div>
              <div class="form-actions">
                <button
                  type="button"
                  class="cancel-btn"
                  @click="closeEditModal"
                >
                  取消
                </button>
                <button
                  type="submit"
                  class="save-btn"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 批量删除确认对话框 -->
    <Teleport to="body">
      <div
        v-if="showBatchDeleteModal"
        class="modal-overlay"
      >
        <div class="modal-content batch-delete-modal">
          <div class="modal-header">
            <h3>⚠️ 确认批量删除</h3>
          </div>
          <div class="modal-body">
            <p>您即将删除 <strong>{{ selectedImages.length }}</strong> 张图片</p>
            <p class="warning-text">
              此操作不可撤销，确定要继续吗？
            </p>
            <div class="preview-images">
              <img 
                v-for="image in selectedImages.slice(0, 6)" 
                :key="image._id || image.id"
                :src="getImageUrl(image.thumbnail)"
                :alt="image.title"
                class="preview-thumb"
              >
              <div
                v-if="selectedImages.length > 6"
                class="more-count"
              >
                +{{ selectedImages.length - 6 }}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="cancel-btn"
              @click="cancelBatchDelete"
            >
              取消
            </button>
            <button
              :disabled="batchDeleting"
              class="danger-btn"
              @click="confirmBatchDelete"
            >
              {{ batchDeleting ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { galleryApi } from '../../../api/gallery'
import { resolveStoredAssetUrl } from '@/utils/assetUrl'

const images = ref([])
const filteredImages = ref([])
const selectedImages = ref([]) // 批量选择的图片
const showUploadModal = ref(false)
const showEditModal = ref(false)
const showBatchDeleteModal = ref(false)
const selectedFiles = ref([])
const uploading = ref(false)
const batchDeleting = ref(false)
const categoryFilter = ref('')
const searchQuery = ref('')
const loading = ref(false)
const error = ref('')
const existingTags = ref([])
const fileInput = ref(null)
const isDragging = ref(false)
const availableCategories = ref(['摄影', '游戏', '编程', '设计'])

// 上传表单数据
const uploadForm = reactive({
  category: '',
  tags: [],
  otherTagEnabled: false,
  newTagText: '',
  isPublic: 'true',
  otherCategoryEnabled: false,
  newCategoryText: ''
})

const currentImage = reactive({
  id: null,
  title: '',
  category: '',
  secondaryTagsInput: '',
  secondaryTags: [],
  isPublic: true,
  status: 'draft'
})

// 批量选择相关计算属性
const isAllSelected = computed(() => {
  return filteredImages.value.length > 0 && selectedImages.value.length === filteredImages.value.length
})

const isPartialSelected = computed(() => {
  return selectedImages.value.length > 0 && selectedImages.value.length < filteredImages.value.length
})

// 根据选择的分类动态显示标签
const availableTagsForUpload = computed(() => {
  return getTagsByCategory(uploadForm.category)
})

// 初始化数据
const initialize = async () => {
  await Promise.all([
    getImages(),
    getTags()
  ])
  // 在获取图片后更新分类列表
  getCategories()
}

// 获取现有标签
const getTags = async () => {
  try {
    const response = await galleryApi.getTags()
    if (response.success) {
      existingTags.value = response.data || []
    }
  } catch (error) {
    console.error('获取标签失败:', error)
  }
}

// 获取所有已使用的分类
const getCategories = () => {
  const categories = new Set(['摄影', '游戏', '编程', '设计']) // 默认分类
  
  // 从现有图片中提取分类
  images.value.forEach(image => {
    if (image.category) {
      categories.add(image.category)
    }
  })
  
  availableCategories.value = Array.from(categories).sort()
}

// 根据选择的分类筛选标签
const getTagsByCategory = (category) => {
  if (!category) return existingTags.value
  
  // 从现有图片中获取该分类下的标签
  const categoryImages = images.value.filter(img => img.category === category)
  const categoryTags = new Set()
  
  categoryImages.forEach(img => {
    if (img.secondaryTags && img.secondaryTags.length > 0) {
      img.secondaryTags.forEach(tag => categoryTags.add(tag))
    }
  })
  
  return Array.from(categoryTags)
}

// 批量选择方法
const isImageSelected = (image) => {
  return selectedImages.value.some(selected => 
    (selected._id || selected.id) === (image._id || image.id)
  )
}

const toggleImageSelection = (image) => {
  const imageId = image._id || image.id
  const index = selectedImages.value.findIndex(selected => 
    (selected._id || selected.id) === imageId
  )
  
  if (index === -1) {
    selectedImages.value.push(image)
  } else {
    selectedImages.value.splice(index, 1)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedImages.value = []
  } else {
    selectedImages.value = [...filteredImages.value]
  }
}

const clearSelection = () => {
  selectedImages.value = []
}

// 分类改变时重置标签选择
const onCategoryChange = () => {
  // 当分类改变时，清空已选择的标签
  uploadForm.tags = []
  uploadForm.otherTagEnabled = false
  uploadForm.newTagText = ''
  
  // 如果不是"其他"，清空自定义分类文本
  if (uploadForm.category !== '__other__') {
    uploadForm.newCategoryText = ''
  }
}

// 批量删除方法
const batchDelete = () => {
  if (selectedImages.value.length === 0) return
  showBatchDeleteModal.value = true
}

const confirmBatchDelete = async () => {
  batchDeleting.value = true
  try {
    const deletePromises = selectedImages.value.map(image =>
      galleryApi.deleteImage(image._id || image.id)
    )
    
    await Promise.all(deletePromises)
    
    alert(`成功删除 ${selectedImages.value.length} 张图片！`)
    selectedImages.value = []
    showBatchDeleteModal.value = false
    await getImages()
    // 删除后更新分类列表，自动清理空分类
    getCategories()
  } catch (error) {
    console.error('批量删除失败:', error)
    alert('批量删除失败: ' + (error.response?.data?.message || error.message))
  } finally {
    batchDeleting.value = false
  }
}

const cancelBatchDelete = () => {
  showBatchDeleteModal.value = false
}

// 图片上传方法
const uploadImages = async () => {
  if (selectedFiles.value.length === 0) return
  
  // 验证必填字段
  if (!uploadForm.category) {
    alert('请选择分类')
    return
  }
  
  // 验证自定义分类
  if (uploadForm.category === '__other__' && !uploadForm.newCategoryText.trim()) {
    alert('请输入新分类名称')
    return
  }
  
  uploading.value = true
  try {
    // 确定最终的分类名称
    const finalCategory = uploadForm.category === '__other__' 
      ? uploadForm.newCategoryText.trim() 
      : uploadForm.category
    
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const file = selectedFiles.value[i]
      const formData = new FormData()
      
      formData.append('image', file.file)
      formData.append('title', file.name.split('.')[0])
      formData.append('category', finalCategory) // 使用最终的分类名称
      formData.append('isPublic', uploadForm.isPublic)
      formData.append('status', 'published')
      
      // 处理标签
      let finalTags = [...uploadForm.tags]
      if (uploadForm.otherTagEnabled && uploadForm.newTagText) {
        const newTags = uploadForm.newTagText.split(',').map(tag => tag.trim()).filter(Boolean)
        finalTags = [...finalTags, ...newTags]
      }
      formData.append('secondaryTags', JSON.stringify(finalTags))
      
      await galleryApi.uploadImage(formData)
    }

    alert('图片上传成功!')
    await initialize() // Re-fetch all data
    closeUploadModal()
  } catch (error) {
    console.error('上传失败:', error)
    alert('上传失败: ' + (error.response?.data?.message || error.message))
  } finally {
    uploading.value = false
  }
}

// 过滤图片
const filterImages = () => {
  let filtered = images.value

  // 分类过滤
  if (categoryFilter.value) {
    filtered = filtered.filter(image => image.category === categoryFilter.value)
  }

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(image =>
      image.title.toLowerCase().includes(query) ||
      image.description?.toLowerCase().includes(query)
    )
  }

  filteredImages.value = filtered
  
  // 清除不在筛选结果中的选择项
  selectedImages.value = selectedImages.value.filter(selected =>
    filtered.some(image => (image._id || image.id) === (selected._id || selected.id))
  )
}

// 获取图片列表
const getImages = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await galleryApi.getAllImages()
    if (response.success) {
      images.value = response.data || []
      filteredImages.value = response.data || []
    } else {
      throw new Error(response.message || '获取图片列表失败')
    }
  } catch (err) {
    console.error('❌ 获取图片列表失败:', err)
    error.value = err.message || '获取图片列表失败，请稍后重试'
    images.value = []
    filteredImages.value = []
  } finally {
    loading.value = false
  }
}

// 文件处理
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  processFiles(files)
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  const files = Array.from(event.dataTransfer.files)
  processFiles(files)
}

const handleDragEnter = (event) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (event) => {
  event.preventDefault()
  // 只有当拖拽完全离开上传区域时才设置为false
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragging.value = false
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
}

const processFiles = (files) => {
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        selectedFiles.value.push({
          file,
          name: file.name,
          size: file.size,
          preview: e.target.result
        })
      }
      reader.readAsDataURL(file)
    }
  })
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

// 编辑图片
const editImage = (image) => {
  Object.assign(currentImage, {
    id: image._id || image.id,
    title: image.title,
    category: image.category,
    secondaryTagsInput: (image.secondaryTags || []).join(', '),
    secondaryTags: image.secondaryTags || [],
    isPublic: image.isPublic,
    status: image.status
  })
  showEditModal.value = true
}

const saveImage = async () => {
  try {
    const imageData = {
      title: currentImage.title,
      category: currentImage.category,
      secondaryTags: currentImage.secondaryTagsInput.split(',').map(tag => tag.trim()).filter(Boolean),
      isPublic: currentImage.isPublic,
      status: currentImage.status
    }
    
    await galleryApi.updateImage(currentImage.id, imageData)
    alert('图片信息更新成功!')
    closeEditModal()
    await getImages()
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败: ' + (error.response?.data?.message || error.message))
  }
}

// 删除单个图片
const deleteImage = async (id) => {
  if (!confirm('确定要删除这张图片吗？')) return

  try {
    await galleryApi.deleteImage(id)
    alert('图片删除成功!')
    await getImages()
    // 删除后更新分类列表，自动清理空分类
    getCategories()
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败: ' + (error.response?.data?.message || error.message))
  }
}

// 关闭模态框
const closeUploadModal = () => {
  showUploadModal.value = false
  selectedFiles.value = []
  isDragging.value = false
  Object.assign(uploadForm, {
    category: '',
    tags: [],
    otherTagEnabled: false,
    newTagText: '',
    isPublic: 'true',
    otherCategoryEnabled: false,
    newCategoryText: ''
  })
}

const closeEditModal = () => {
  showEditModal.value = false
  Object.assign(currentImage, {
    id: null,
    title: '',
    category: '',
    secondaryTagsInput: '',
    secondaryTags: [],
    isPublic: true,
    status: 'draft'
  })
}

// 工具函数
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getImageUrl = (url) => {
  return resolveStoredAssetUrl(url) || '/placeholder.jpg'
}

onMounted(() => {
  initialize()
})
</script>

<style scoped>
.admin-gallery-manager {
  height: 100%;
  padding: 1.5rem;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.manager-header h2 {
  color: #333;
  margin: 0;
  font-size: 1.75rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* 批量操作样式 */
.batch-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.selection-count {
  font-weight: 600;
  font-size: 0.9rem;
}

.batch-delete-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.batch-delete-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.clear-selection-btn {
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.clear-selection-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.upload-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

/* 筛选栏样式 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.filter-controls {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.filter-controls select,
.filter-controls input {
  padding: 0.75rem;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.filter-controls input {
  min-width: 280px;
}

.filter-controls select:focus,
.filter-controls input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 全选控制 */
.select-controls {
  display: flex;
  align-items: center;
}

.select-all-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #495057;
}

.select-all-control input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* 图片网格样式 */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.image-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 2px solid transparent;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.image-card.selected {
  border-color: #667eea;
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.3);
}

/* 选择框样式 */
.selection-checkbox {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 2;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 0.25rem;
  backdrop-filter: blur(10px);
}

.selection-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 220px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}

.image-card:hover .image-preview img {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.image-overlay button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
}

.edit-btn {
  background: #28a745;
  color: white;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.image-overlay button:hover {
  transform: scale(1.05);
}

/* 图片信息样式 */
.image-info {
  padding: 1.25rem;
}

.image-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
}

.category {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 500;
}

.upload-date {
  color: #6c757d;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.status.public {
  color: #28a745;
  background: #d4edda;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 500;
}

.status.private {
  color: #dc3545;
  background: #f8d7da;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 500;
}

.publish-status.published {
  color: #17a2b8;
  background: #d1ecf1;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 500;
}

.publish-status.draft {
  color: #ffc107;
  background: #fff3cd;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 500;
}

.image-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tag {
  background: #f1f3f5;
  color: #495057;
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  font-size: 0.75rem;
}

/* 状态样式 */
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
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
}

/* 表单样式 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 标签选择样式 */
.tags-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tag-item input[type="checkbox"] {
  width: auto;
}

.tag-item input[type="text"] {
  margin-left: 0.5rem;
  width: 150px;
}

/* 状态选择样式 */
.status-selection,
.visibility-options {
  display: flex;
  gap: 1.5rem;
}

.status-selection label,
.visibility-options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

/* 上传区域样式 */
.upload-area {
  border: 2px dashed #ced4da;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  background: #f8f9fa;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  user-select: none;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f0f4ff;
  transform: translateY(-2px);
}

.upload-area:active {
  transform: translateY(0);
}

.upload-area.drag-over {
  border-color: #28a745;
  background: #f0fff4;
  border-style: solid;
}

.file-input {
  display: none;
}

.upload-text p {
  margin: 0.5rem 0;
  color: #6c757d;
}

.upload-hint {
  font-size: 0.85rem;
  color: #9ca3af;
}

.helper-text {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.5rem;
  font-style: italic;
}

.mt-2 {
  margin-top: 0.5rem;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* 文件列表样式 */
.selected-files {
  margin-top: 1.5rem;
}

.selected-files h4 {
  margin-bottom: 1rem;
  color: #495057;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.file-preview {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.25rem;
}

.file-size {
  font-size: 0.8rem;
  color: #6c757d;
}

.remove-file {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

/* 按钮样式 */
.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #ced4da;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.cancel-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.save-btn,
.upload-confirm-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.save-btn:hover,
.upload-confirm-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.save-btn:disabled,
.upload-confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.danger-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.danger-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(220, 53, 69, 0.4);
}

.danger-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 批量删除模态框样式 */
.batch-delete-modal {
  max-width: 500px;
}

.warning-text {
  color: #dc3545;
  font-weight: 500;
  margin: 1rem 0;
}

.preview-images {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.preview-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 2px solid #e9ecef;
}

.more-count {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 600;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-gallery-manager {
    padding: 1rem;
  }
  
  .manager-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .filter-bar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .filter-controls {
    flex-direction: column;
  }
  
  .filter-controls input {
    min-width: auto;
  }
  
  .gallery-grid {
    grid-template-columns: 1fr;
  }
  
  .batch-actions {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }
  
  .batch-actions button {
    text-align: center;
  }
}
</style> 

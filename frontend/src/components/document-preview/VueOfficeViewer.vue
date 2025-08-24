<template>
  <div class="vue-office-viewer">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>{{ loadingText }}</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>预览失败</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button @click="retry" class="retry-btn">重试</button>
        <button @click="download" class="download-btn">下载文档</button>
      </div>
    </div>
    
    <!-- 预览内容 -->
    <div v-else class="preview-container">
      <!-- Word文档预览 -->
      <vue-office-docx
        v-if="fileType === 'docx'"
        :src="documentSrc"
        :style="viewerStyle"
        @rendered="onRendered"
        @error="onError"
      />
      
      <!-- Excel文档预览 -->
      <vue-office-excel
        v-else-if="fileType === 'xlsx' || fileType === 'xls'"
        :src="documentSrc"
        :style="viewerStyle"
        @rendered="onRendered"
        @error="onError"
      />
      
      <!-- PowerPoint预览 -->
      <PptxViewer
        v-else-if="fileType === 'pptx' || fileType === 'ppt'"
        :document="document"
        :blob="blob"
        @rendered="onRendered"
        @error="onError"
      />
      
      <!-- PDF文档预览 - 使用现有的PdfViewer组件 -->
      <PdfViewer
        v-else-if="fileType === 'pdf'"
        :url="documentSrc"
        @rendered="onRendered"
        @error="onError"
      />
      
      <!-- 不支持的文件类型 -->
      <div v-else class="unsupported-container">
        <div class="unsupported-icon">📄</div>
        <h3>不支持的文件类型</h3>
        <p>当前文件类型 ({{ fileType }}) 暂不支持在线预览</p>
        <button @click="download" class="download-btn">下载文档</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import VueOfficeDocx from '@vue-office/docx'
import VueOfficeExcel from '@vue-office/excel'
import PptxViewer from './PptxViewer.vue'
import PdfViewer from '../PdfViewer.vue'

// 引入样式
import '@vue-office/docx/lib/index.css'
import '@vue-office/excel/lib/index.css'
// 注意：Vue-Office PPTX组件可能不需要额外的CSS文件

// Props
const props = defineProps({
  document: {
    type: Object,
    required: true
  },
  blob: {
    type: [Blob, ArrayBuffer],
    default: null
  }
})

// Emits
const emit = defineEmits(['rendered', 'error', 'close'])

// 响应式数据
const loading = ref(true)
const error = ref('')
const documentSrc = ref(null)

// 计算属性
const fileType = computed(() => {
  return props.document.type?.toLowerCase() || 'unknown'
})

const loadingText = computed(() => {
  const texts = {
    docx: '正在加载Word文档...',
    xlsx: '正在加载Excel文档...',
    xls: '正在加载Excel文档...',
    pdf: '正在加载PDF文档...',
    pptx: '正在加载PowerPoint文档...',
    ppt: '正在加载PowerPoint文档...',
    md: '正在加载Markdown文档...',
    txt: '正在加载文本文档...'
  }
  return texts[fileType.value] || '正在加载文档...'
})

const viewerStyle = computed(() => ({
  height: '100%',
  width: '100%',
  border: 'none'
}))

// 方法
const initializeDocument = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // 检查文件类型，决定使用哪种预览方式
    if (['md', 'txt', 'pptx', 'ppt'].includes(fileType.value)) {
      // Markdown、文本和PPTX文件使用专门的处理方案
      loading.value = false
      return
    }
    
    if (props.blob) {
      // 将Blob转换为ArrayBuffer，这是Vue-Office期望的格式
      console.log('🔍 处理Blob数据:', {
        size: props.blob.size,
        type: props.blob.type
      })
      
      try {
        const arrayBuffer = await props.blob.arrayBuffer()
        documentSrc.value = arrayBuffer
        console.log('✅ Blob转换为ArrayBuffer成功')
      } catch (err) {
        console.error('Blob转换失败:', err)
        // 如果转换失败，尝试使用URL
        documentSrc.value = URL.createObjectURL(props.blob)
        console.log('🔄 使用Blob URL作为备选方案')
      }
    } else if (props.document.filePath && props.document.filePath.startsWith('https://')) {
      // 如果是Vercel Blob URL，直接使用URL
      documentSrc.value = props.document.filePath
      console.log('🌐 使用Vercel Blob URL:', props.document.filePath)
    } else {
      // 从API获取文档内容
      const response = await fetch(`/api/documents/${props.document.id || props.document._id}/content`)
      if (!response.ok) {
        throw new Error('获取文档内容失败')
      }
      documentSrc.value = await response.arrayBuffer()
    }
    
    loading.value = false
  } catch (err) {
    console.error('文档初始化失败:', err)
    error.value = err.message || '文档加载失败'
    loading.value = false
  }
}

const onRendered = () => {
  console.log('✅ 文档渲染完成:', props.document.title)
  emit('rendered', props.document)
}

const onError = (err) => {
  console.error('❌ 文档渲染失败:', err)
  console.error('错误详情:', {
    fileType: fileType.value,
    documentSrc: documentSrc.value,
    document: props.document
  })
  error.value = '文档预览失败，请尝试下载查看'
  emit('error', err)
}

const retry = () => {
  initializeDocument()
}

const download = () => {
  window.open(`/api/documents/${props.document.id || props.document._id}/download`, '_blank')
}

// 生命周期
onMounted(() => {
  initializeDocument()
})

onUnmounted(() => {
  // 清理资源
  if (documentSrc.value && typeof documentSrc.value === 'string') {
    URL.revokeObjectURL(documentSrc.value)
  }
})
</script>

<style scoped>
.vue-office-viewer {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.loading-container,
.error-container,
.unsupported-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.unsupported-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.retry-btn,
.download-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.retry-btn {
  background: #667eea;
  color: white;
}

.download-btn {
  background: #28a745;
  color: white;
}

.retry-btn:hover,
.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.preview-container {
  flex: 1;
  overflow: hidden;
}
</style> 
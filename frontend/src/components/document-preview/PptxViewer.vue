<template>
  <div class="pptx-viewer">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载PowerPoint文档...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>PowerPoint预览失败</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button @click="retry" class="retry-btn">重试</button>
        <button @click="download" class="download-btn">下载文档</button>
      </div>
    </div>
    
    <!-- PPTX预览内容 -->
    <div v-else class="pptx-container">
      <VueOfficePptx
        v-if="documentSrc"
        :src="documentSrc"
        :style="viewerStyle"
        @rendered="onRendered"
        @error="onError"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import VueOfficePptx from '@vue-office/pptx'

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
    
    console.log('🔍 开始初始化PPTX预览:', props.document.title)
    
    if (props.blob) {
      // 处理Blob数据
      console.log('📦 处理Blob数据:', {
        size: props.blob.size,
        type: props.blob.type
      })
      
      try {
        // 尝试转换为ArrayBuffer
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
      // 使用Vercel Blob URL
      documentSrc.value = props.document.filePath
      console.log('🌐 使用Vercel Blob URL:', props.document.filePath)
    } else {
      // 从API获取文档内容
      const response = await fetch(`/api/documents/${props.document._id}/content`)
      if (!response.ok) {
        throw new Error('获取文档内容失败')
      }
      documentSrc.value = await response.arrayBuffer()
      console.log('📡 从API获取文档内容成功')
    }
    
    loading.value = false
  } catch (err) {
    console.error('PPTX初始化失败:', err)
    error.value = err.message || 'PPTX文档加载失败'
    loading.value = false
  }
}

const onRendered = () => {
  console.log('✅ PPTX渲染完成:', props.document.title)
  emit('rendered', props.document)
}

const onError = (err) => {
  console.error('❌ PPTX渲染失败:', err)
  console.error('错误详情:', {
    documentSrc: documentSrc.value,
    document: props.document
  })
  error.value = 'PowerPoint文档预览失败，请尝试下载查看'
  emit('error', err)
}

const retry = () => {
  initializeDocument()
}

const download = () => {
  window.open(`/api/documents/${props.document._id}/download`, '_blank')
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
.pptx-viewer {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.loading-container,
.error-container {
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

.error-icon {
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

.pptx-container {
  flex: 1;
  overflow: hidden;
}
</style> 
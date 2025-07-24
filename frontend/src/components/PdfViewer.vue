<template>
  <div class="pdf-viewer">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载PDF...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button @click="retry" class="retry-btn">重试</button>
    </div>
    
    <div v-else class="pdf-container">
      <!-- PDF工具栏 -->
      <div class="pdf-toolbar">
        <div class="toolbar-left">
          <button @click="previousPage" :disabled="currentPage <= 1" class="nav-btn">
            ⬅️ 上一页
          </button>
          <span class="page-info">
            第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
          </span>
          <button @click="nextPage" :disabled="currentPage >= totalPages" class="nav-btn">
            下一页 ➡️
          </button>
        </div>
        
        <div class="toolbar-right">
          <button @click="zoomOut" :disabled="scale <= 0.5" class="zoom-btn">🔍-</button>
          <span class="zoom-info">{{ Math.round(scale * 100) }}%</span>
          <button @click="zoomIn" :disabled="scale >= 3" class="zoom-btn">🔍+</button>
          <button @click="resetZoom" class="zoom-btn">重置</button>
        </div>
      </div>
      
      <!-- PDF内容区域 -->
      <div class="pdf-content" ref="pdfContainer">
        <canvas 
          ref="pdfCanvas" 
          class="pdf-canvas"
          @wheel="handleWheel"
        ></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

// 设置PDF.js worker - 使用本地worker文件
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

// Props
const props = defineProps({
  url: {
    type: String,
    required: true
  }
})

// 响应式数据
const loading = ref(true)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1.0)
const pdfDocument = ref(null)
const pdfCanvas = ref(null)
const pdfContainer = ref(null)

// 加载PDF文档
const loadPdf = async () => {
  try {
    loading.value = true
    error.value = ''
    
    console.log('开始加载PDF:', props.url)
    
    const loadingTask = pdfjsLib.getDocument(props.url)
    pdfDocument.value = await loadingTask.promise
    totalPages.value = pdfDocument.value.numPages
    
    console.log('PDF加载成功，总页数:', totalPages.value)
    
    // 渲染第一页
    await renderPage(1)
    
    loading.value = false
  } catch (err) {
    console.error('PDF加载失败:', err)
    error.value = err.message || 'PDF加载失败'
    loading.value = false
  }
}

// 渲染指定页面
const renderPage = async (pageNum) => {
  if (!pdfDocument.value || !pdfCanvas.value) return
  
  try {
    const page = await pdfDocument.value.getPage(pageNum)
    const canvas = pdfCanvas.value
    const context = canvas.getContext('2d')
    
    // 计算视口
    const viewport = page.getViewport({ scale: scale.value })
    
    // 设置canvas尺寸
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    // 渲染页面
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }
    
    await page.render(renderContext).promise
    currentPage.value = pageNum
    
    console.log(`页面 ${pageNum} 渲染完成`)
  } catch (err) {
    console.error('页面渲染失败:', err)
    error.value = '页面渲染失败'
  }
}

// 导航方法
const previousPage = () => {
  if (currentPage.value > 1) {
    renderPage(currentPage.value - 1)
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    renderPage(currentPage.value + 1)
  }
}

// 缩放方法
const zoomIn = () => {
  if (scale.value < 3) {
    scale.value += 0.25
    renderPage(currentPage.value)
  }
}

const zoomOut = () => {
  if (scale.value > 0.5) {
    scale.value -= 0.25
    renderPage(currentPage.value)
  }
}

const resetZoom = () => {
  scale.value = 1.0
  renderPage(currentPage.value)
}

// 鼠标滚轮缩放
const handleWheel = (event) => {
  if (event.ctrlKey) {
    event.preventDefault()
    if (event.deltaY < 0) {
      zoomIn()
    } else {
      zoomOut()
    }
  }
}

// 重试加载
const retry = () => {
  loadPdf()
}

// 键盘导航
const handleKeydown = (event) => {
  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault()
      previousPage()
      break
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault()
      nextPage()
      break
    case 'Home':
      event.preventDefault()
      renderPage(1)
      break
    case 'End':
      event.preventDefault()
      renderPage(totalPages.value)
      break
  }
}

// 生命周期
onMounted(async () => {
  await nextTick()
  loadPdf()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.pdf-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.error-container h3 {
  color: #e74c3c;
  margin-bottom: 10px;
}

.retry-btn {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 20px;
}

.retry-btn:hover {
  background: #2980b9;
}

.pdf-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pdf-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: white;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-btn,
.zoom-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled),
.zoom-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #3498db;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info,
.zoom-info {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.pdf-content {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
}

.pdf-canvas {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  background: white;
  max-width: 100%;
  height: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pdf-toolbar {
    flex-direction: column;
    gap: 10px;
    padding: 15px;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }
  
  .pdf-content {
    padding: 10px;
  }
  
  .nav-btn,
  .zoom-btn {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
}
</style>
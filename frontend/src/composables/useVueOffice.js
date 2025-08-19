import { ref, computed } from 'vue'

/*
useVueOffice输出函数一览：
loading 加载状态
error 错误信息
rendered 渲染状态
isSupported 检查文件类型是否支持
getFileIcon 获取文件类型图标
getFileTypeName 获取文件类型名称
previewDocument 预览文档
cleanup 清理资源
*/

export function useVueOffice() {
  const loading = ref(false)
  const error = ref(null)
  const rendered = ref(false)
  
  // 支持的文件类型（仅Office文档格式）
  const supportedTypes = ['docx', 'xlsx', 'xls', 'pptx', 'ppt']
  
  // 检查文件类型是否支持
  const isSupported = (fileType) => {
    return supportedTypes.includes(fileType?.toLowerCase())
  }
  
  // 获取文件类型图标
  const getFileIcon = (fileType) => {
    const iconMap = {
      docx: '📝',
      xlsx: '📊',
      xls: '📊',
      pdf: '📄',
      pptx: '📽️',
      ppt: '📽️',
      md: '📝',
      txt: '📄'
    }
    return iconMap[fileType?.toLowerCase()] || '📄'
  }
  
  // 获取文件类型名称
  const getFileTypeName = (fileType) => {
    const nameMap = {
      docx: 'Word文档',
      xlsx: 'Excel文档',
      xls: 'Excel文档',
      pdf: 'PDF文档',
      pptx: 'PowerPoint文档',
      ppt: 'PowerPoint文档',
      md: 'Markdown文档',
      txt: '文本文档'
    }
    return nameMap[fileType?.toLowerCase()] || '未知类型'
  }
  
  // 处理文档预览
  const previewDocument = async (document, blob = null) => {
    if (!isSupported(document.type)) {
      error.value = `不支持的文件类型: ${document.type}`
      return false
    }
    
    loading.value = true
    error.value = null
    rendered.value = false
    
    try {
      // 这里可以添加额外的预处理逻辑
      return true
    } catch (err) {
      error.value = err.message || '文档预览失败'
      return false
    } finally {
      loading.value = false
    }
  }
  
  // 清理资源
  const cleanup = () => {
    loading.value = false
    error.value = null
    rendered.value = false
  }
  
  return {
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    rendered: computed(() => rendered.value),
    isSupported,
    getFileIcon,
    getFileTypeName,
    previewDocument,
    cleanup
  }
} 
import { ref, computed } from 'vue'
import mammoth from 'mammoth'
import { marked } from 'marked'

export function useDocumentPreview() {
  const loading = ref(false)
  const error = ref(null)
  const previewContent = ref('')
  const previewType = ref('') // 'html', 'iframe', 'error', 'unsupported'
  const previewUrl = ref('')

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const hasContent = computed(() => !!previewContent.value)

  /**
   * 预览文档
   * @param {Blob} blob - 文档文件的Blob对象
   * @param {string} fileType - 文件类型
   * @param {string} fileName - 文件名
   */
  const previewDocument = async (blob, fileType, fileName) => {
    if (!blob) {
      error.value = '无效的文档文件'
      return
    }

    loading.value = true
    error.value = null
    previewContent.value = ''
    previewType.value = ''
    previewUrl.value = ''

    try {
      const normalizedType = fileType.toLowerCase()
      
      switch (normalizedType) {
        case 'docx':
          await previewDocx(blob)
          break
        case 'md':
        case 'markdown':
          await previewMarkdown(blob)
          break
        case 'txt':
          await previewText(blob)
          break
        case 'pdf':
          await previewPdf(blob)
          break
        case 'pptx':
        case 'ppt':
          await previewPowerPoint(blob, fileName)
          break
        default:
          handleUnsupportedFormat(normalizedType)
      }
    } catch (err) {
      console.error('文档预览失败:', err)
      error.value = `预览失败: ${err.message}`
      previewType.value = 'error'
    } finally {
      loading.value = false
    }
  }

  /**
   * 使用mammoth.js预览DOCX文件
   */
  const previewDocx = async (blob) => {
    try {
      console.log('🔍 开始DOCX预览处理...')
      const arrayBuffer = await blob.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      
      if (result.value) {
        previewContent.value = `
          <div class="docx-preview-container">
            <div class="docx-content">
              ${result.value}
            </div>
          </div>
        `
        previewType.value = 'html'
        console.log('✅ DOCX预览成功, 内容长度:', result.value.length)
        
        // 处理警告信息
        if (result.messages && result.messages.length > 0) {
          console.warn('DOCX转换警告:', result.messages)
        }
      } else {
        throw new Error('无法提取文档内容')
      }
    } catch (err) {
      console.error('DOCX预览失败:', err)
      throw new Error('DOCX文档预览失败，文档格式可能不受支持')
    }
  }

  /**
   * 预览Markdown文件
   */
  const previewMarkdown = async (blob) => {
    try {
      const text = await blob.text()
      const htmlContent = marked(text)
      previewContent.value = `
        <div class="markdown-preview-container">
          <div class="markdown-content">
            ${htmlContent}
          </div>
        </div>
      `
      previewType.value = 'html'
      console.log('✅ Markdown预览成功')
    } catch (err) {
      console.error('Markdown预览失败:', err)
      throw new Error('Markdown文档预览失败')
    }
  }

  /**
   * 预览文本文件
   */
  const previewText = async (blob) => {
    try {
      const text = await blob.text()
      previewContent.value = `
        <div class="text-preview-container">
          <pre class="text-content">${text}</pre>
        </div>
      `
      previewType.value = 'html'
      console.log('✅ 文本预览成功')
    } catch (err) {
      console.error('文本预览失败:', err)
      throw new Error('文本文档预览失败')
    }
  }

  /**
   * 预览PDF文件
   */
  const previewPdf = async (blob) => {
    try {
      const url = URL.createObjectURL(blob)
      previewUrl.value = url
      previewType.value = 'iframe'
      console.log('✅ PDF预览URL创建成功')
    } catch (err) {
      console.error('PDF预览失败:', err)
      throw new Error('PDF文档预览失败')
    }
  }

  /**
   * 预览PowerPoint文件
   */
  const previewPowerPoint = async (blob, fileName) => {
    try {
      console.log('🔍 开始PPTX预览处理...')
      
      // 创建临时URL用于在线预览服务
      const tempUrl = URL.createObjectURL(blob)
      
      // 创建预览选项页面
      previewContent.value = `
        <div class="pptx-preview-container">
          <div class="preview-notice">
            <div class="notice-icon">📄</div>
            <div class="notice-content">
              <h3>PowerPoint 文档预览</h3>
              <p>由于PowerPoint文档的复杂性，我们提供多种预览方式供您选择：</p>
            </div>
          </div>
          
          <div class="preview-options">
            <div class="option-card" onclick="window.previewWithOfficeOnline('${tempUrl}')">
              <div class="option-icon">🌐</div>
              <div class="option-content">
                <h4>Microsoft Office Online</h4>
                <p>使用微软官方服务预览，支持完整格式和动画</p>
                <span class="option-badge">推荐</span>
              </div>
            </div>
            
            <div class="option-card" onclick="window.previewWithGoogleDocs('${tempUrl}')">
              <div class="option-icon">📱</div>
              <div class="option-content">
                <h4>Google Docs 查看器</h4>
                <p>快速预览文档内容，适合简单查看</p>
              </div>
            </div>
            
            <div class="option-card download-option" onclick="window.downloadCurrentFile()">
              <div class="option-icon">📥</div>
              <div class="option-content">
                <h4>下载到本地</h4>
                <p>下载文档使用本地软件查看，获得最佳体验</p>
              </div>
            </div>
          </div>
          
          <div class="preview-frame-container" id="pptxPreviewFrame" style="display: none;">
            <div class="frame-header">
              <span class="frame-title">文档预览</span>
              <button class="close-frame-btn" onclick="window.closePptxPreview()">✕</button>
            </div>
            <iframe id="pptxIframe" frameborder="0"></iframe>
          </div>
        </div>
      `
      
      previewType.value = 'html'
      
      // 添加全局函数供HTML调用
      window.previewWithOfficeOnline = (fileUrl) => {
        const encodedUrl = encodeURIComponent(fileUrl)
        const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`
        showPptxPreview(viewerUrl)
      }
      
      window.previewWithGoogleDocs = (fileUrl) => {
        const encodedUrl = encodeURIComponent(fileUrl)
        const viewerUrl = `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`
        showPptxPreview(viewerUrl)
      }
      
      window.downloadCurrentFile = () => {
        const link = document.createElement('a')
        link.href = tempUrl
        link.download = fileName || 'document.pptx'
        link.click()
      }
      
      window.showPptxPreview = showPptxPreview
      window.closePptxPreview = closePptxPreview
      
      console.log('✅ PPTX预览选项创建成功')
      
      // 清理函数
      setTimeout(() => {
        URL.revokeObjectURL(tempUrl)
      }, 5 * 60 * 1000) // 5分钟后清理
      
    } catch (err) {
      console.error('PPTX预览失败:', err)
      throw new Error('PowerPoint文档预览失败')
    }
  }

  /**
   * 显示PPTX预览框架
   */
  const showPptxPreview = (url) => {
    const container = document.getElementById('pptxPreviewFrame')
    const iframe = document.getElementById('pptxIframe')
    
    if (container && iframe) {
      iframe.src = url
      container.style.display = 'block'
      container.scrollIntoView({ behavior: 'smooth' })
    }
  }

  /**
   * 关闭PPTX预览框架
   */
  const closePptxPreview = () => {
    const container = document.getElementById('pptxPreviewFrame')
    const iframe = document.getElementById('pptxIframe')
    
    if (container && iframe) {
      iframe.src = ''
      container.style.display = 'none'
    }
  }

  /**
   * 处理不支持的文件格式
   */
  const handleUnsupportedFormat = (fileType) => {
    previewContent.value = `
      <div class="unsupported-preview">
        <div class="unsupported-icon">📄</div>
        <h3>暂不支持预览</h3>
        <p>${fileType.toUpperCase()} 格式的文档暂不支持在线预览</p>
        <p class="suggestion">建议下载文档到本地查看完整内容</p>
      </div>
    `
    previewType.value = 'unsupported'
    console.warn('不支持的文件格式:', fileType)
  }

  /**
   * 清理预览资源
   */
  const cleanup = () => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = ''
    }
    
    // 清理全局函数
    if (window.previewWithOfficeOnline) {
      delete window.previewWithOfficeOnline
      delete window.previewWithGoogleDocs
      delete window.downloadCurrentFile
      delete window.showPptxPreview
      delete window.closePptxPreview
    }
    
    loading.value = false
    error.value = null
    previewContent.value = ''
    previewType.value = ''
  }

  return {
    // 状态
    loading: isLoading,
    error,
    hasError,
    hasContent,
    previewContent,
    previewType,
    previewUrl,
    
    // 方法
    previewDocument,
    cleanup
  }
} 
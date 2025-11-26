<template>
  <div class="admin-blog-manager">
    <div class="manager-header">
      <h2>博客管理</h2>
      <button @click="showCreateModal = true" class="create-btn">
        ➕ 创建博客
      </button>
    </div>

    <!-- 博客列表 -->
    <div class="blog-list">
      <div class="list-header">
        <div class="search-bar">
          <input
            v-model="searchQuery"
            placeholder="搜索博客标题或内容..."
            @input="filterBlogs"
          />
        </div>
        <div class="filter-bar">
          <select v-model="statusFilter" @change="filterBlogs">
            <option value="">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="pinned">置顶</option>
          </select>
        </div>
      </div>

      <div class="blog-table">
        <table>
          <thead>
            <tr>
              <th>标题</th>
              <th>分类</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="blog in filteredBlogs" :key="blog._id || blog.id">
              <td>
                <div class="blog-title">
                  {{ blog.title }}
                  <span v-if="blog.status === 'pinned'" class="pinned-indicator">📌</span>
                  <span class="blog-summary">{{ blog.excerpt }}</span>
                </div>
              </td>
              <td>
                <span class="category-badge">
                  {{ blog.category }}
                </span>
              </td>
              <td>
                <span :class="['status-badge', blog.status]">
                  {{ getStatusText(blog.status) }}
                </span>
              </td>
              <td>{{ formatDate(blog.createdAt) }}</td>
              <td>{{ formatDate(blog.updatedAt) }}</td>
              <td>
                <div class="action-buttons">
                  <button @click="editBlog(blog)" class="edit-btn">编辑</button>
                  <button @click="deleteBlog(blog._id || blog.id)" class="delete-btn">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 创建/编辑博客模态框 -->
    <Teleport to="body">
      <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ showCreateModal ? '创建博客' : '编辑博客' }}</h3>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveBlog">
            <div class="form-group">
              <label>标题</label>
              <input v-model="currentBlog.title" type="text" required />
            </div>
            <div class="form-group">
              <label>摘要</label>
              <div class="excerpt-wrapper">
                <textarea v-model="currentBlog.excerpt" rows="3" placeholder="请输入博客摘要，或点击AI生成按钮自动生成..."></textarea>
                <button type="button" class="ai-summary-btn" @click="generateAiExcerpt" :disabled="aiGenerating || !currentBlog.content">
                  <span v-if="!aiGenerating">
                    <span class="ai-icon">✨</span> AI生成摘要
                  </span>
                  <span v-else class="loading-text">
                    <span class="spinner"></span> AI思考中...
                  </span>
                </button>
              </div>
              <div v-if="!currentBlog.content" class="hint-text">
                💡 提示：请先填写博客内容后再使用AI生成摘要
              </div>
              <div v-if="aiError" class="error-text">
                ❌ {{ aiError }}
              </div>
              <div v-if="aiSuccess" class="success-text">
                ✅ AI摘要生成成功！
              </div>
            </div>
            <div class="form-group">
              <div class="content-header">
                <label>内容 (Markdown)</label>
                <button type="button" @click="triggerFileUpload" class="upload-md-btn">从文件上传</button>
                <input type="file" ref="markdownFileInput" @change="handleMarkdownUpload" accept=".md" style="display: none;">
                <button type="button" @click="triggerAssetsSelect" class="upload-md-btn">添加资源</button>
                <input type="file" ref="assetsInput" @change="handleAssetsSelect" multiple style="display: none;" accept="image/*,.zip">
                <span v-if="selectedAssetsFiles.length" class="assets-counter">已添加 {{ selectedAssetsFiles.length }} 个资源</span>

              </div>
              <div class="markdown-editor">
                <textarea 
                  v-model="currentBlog.content" 
                  ref="markdownTextarea"
                  rows="15" 
                  required 
                  class="markdown-input"
                  @paste="handlePasteImage"
                  @drop="handleDropImage"
                  @dragover.prevent
                ></textarea>
                <div v-html="markdownPreview" class="markdown-preview"></div>
              </div>
            </div>
            <!-- 上传封面：位于内容下方、标签上方 -->
            <div class="form-group">
              <label>封面图（可选）</label>
              <div class="cover-row">
                <input v-model="currentBlog.coverImage" type="text" placeholder="封面图 URL 或相对路径" />
                <input type="file" ref="coverInput" accept="image/*" style="display:none" @change="handleCoverUpload">
                <button type="button" class="upload-md-btn" @click="triggerCoverSelect">上传封面</button>
              </div>
              <div v-if="currentBlog.coverImage" class="cover-preview">
                <img :src="resolveCover(currentBlog.coverImage)" alt="封面预览" @error="onCoverPreviewError" />
              </div>
            </div>
            <div class="form-group">
              <label>标签</label>
              <input v-model="currentBlog.tags" type="text" placeholder="用逗号分隔多个标签" />
            </div>
            <div class="form-group">
              <label>分类</label>
              <select v-model="currentBlog.category" @change="onCategoryChange" required>
                <option value="">请选择分类</option>
                <option v-for="category in availableCategories" :key="category" :value="category">
                  {{ category }}
                </option>
                <option value="__other__">其他</option>
              </select>
              
              <!-- 自定义分类输入 -->
              <div v-if="currentBlog.category === '__other__'" class="mt-2">
                <input 
                  v-model="currentBlog.newCategoryText" 
                  type="text" 
                  placeholder="输入新分类名称" 
                  required
                  class="form-control"
                />
              </div>
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="currentBlog.status">
                <option value="draft">草稿</option>
                <option value="published">发布</option>
                <option value="pinned">置顶</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeModal" class="cancel-btn">取消</button>
              <button type="submit" class="save-btn">{{ showCreateModal ? '创建' : '保存' }}</button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { adminApi } from '../../../api/admin'
import { uploadImage } from '../../../api/upload'
import { useAuthStore } from '../../../store/modules/auth'
import { authApi } from '../../../api/auth'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { OpenAI } from 'openai'

const authStore = useAuthStore()
const blogs = ref([])
const filteredBlogs = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const loading = ref(false)
const error = ref('')
const aiGenerating = ref(false)
const aiError = ref('')
const aiSuccess = ref(false)
const markdownFileInput = ref(null)
const markdownTextarea = ref(null)
const assetsInput = ref(null)
const selectedAssetsFiles = ref([])
const coverInput = ref(null)
// 预览时用于从相对路径映射到本地对象URL
const assetsUrlMap = ref(new Map())
const availableCategories = ref(['前端开发', 'AI技术', '游戏', '音乐'])

const currentBlog = reactive({
  id: null,
  title: '',
  excerpt: '',
  content: '',
  category: '',
  newCategoryText: '',
  tags: '',
  status: 'draft',
  coverImage: ''
})

// 与博客详情页一致的图片渲染与安全清理
const ASSET_BASE = import.meta.env.PROD ? (import.meta.env.VITE_ASSET_BASE_URL || '') : '/uploads/'
const API_ORIGIN = import.meta.env.PROD ? (import.meta.env.VITE_APP_API_ORIGIN || 'https://api.shirakawananase.top') : ''
const renderer = new marked.Renderer()
renderer.image = (href = '', title, text) => {
  // 修复 marked 新版本参数传递问题
  if (typeof href === 'object' && href !== null) {
    const token = href
    href = token.href || ''
    title = token.title
    text = token.text || token.alt || ''
  }
  
  const isAbs = /^(https?:|data:)/i.test(href)
  const isApiRoute = /^\/api\/blog\//i.test(href)
  let src = href
  
  if (!isAbs && !isApiRoute) {
    // 处理相对路径：优先使用本地映射，再使用服务器路径
    const key = String(href).replace(/^\.\//, '').replace(/\\/g, '/').replace(/^\//, '')
    const localUrl = assetsUrlMap.value.get(key)
    if (localUrl) {
      src = localUrl
    } else {
      src = ASSET_BASE ? `${ASSET_BASE.replace(/\/$/, '')}/${key}` : href
    }
  } else if (isApiRoute) {
    // 对于 /api/blog/ 路径，生产环境强制走 API 子域（后端会重定向到 Blob）
    src = API_ORIGIN ? `${API_ORIGIN}${href}` : href
  }
  
  const t = title ? ` title=\"${title}\"` : ''
  return `<img src=\"${src}\" alt=\"${text || ''}\"${t} loading=\"lazy\" decoding=\"async\">`
}
marked.setOptions({ renderer })

const markdownPreview = computed(() => {
  const html = marked(currentBlog.content || '')
  const sanitized = DOMPurify.sanitize(html)
  return sanitized
});

// 获取状态显示文本
const getStatusText = (status) => {
  const statusMap = {
    'draft': '草稿',
    'published': '已发布',
    'pinned': '置顶'
  }
  return statusMap[status] || status
}

// 获取所有已使用的分类
const getCategories = () => {
  const categories = new Set(['前端开发', 'AI技术', '游戏', '音乐']) // 默认分类
  
  // 从现有博客中提取分类
  blogs.value.forEach(blog => {
    if (blog.category) {
      categories.add(blog.category)
    }
  })
  
  availableCategories.value = Array.from(categories).sort()
}

// 分类改变时重置自定义分类文本
const onCategoryChange = () => {
  // 如果不是"其他"，清空自定义分类文本
  if (currentBlog.category !== '__other__') {
    currentBlog.newCategoryText = ''
  }
}

const triggerFileUpload = () => {
  markdownFileInput.value?.click();
};

const triggerAssetsSelect = () => {
  assetsInput.value?.click()
}

const handleMarkdownUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type && file.type !== 'text/markdown') {
     if (!file.name.endsWith('.md')) {
        alert('请选择一个 Markdown (.md) 文件。');
        return;
    }
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    currentBlog.content = e.target.result;
  };
  reader.onerror = (e) => {
    console.error("文件读取失败", e);
    alert("文件读取失败");
  };
  reader.readAsText(file);
};

const generateAiExcerpt = async () => {
  // 清除之前的状态
  aiError.value = '';
  aiSuccess.value = false;
  
  // 验证内容是否存在
  if (!currentBlog.content || currentBlog.content.trim() === '') {
    aiError.value = '请先填写博客内容';
    return;
  }
  
  aiGenerating.value = true;
  
  try {
    // 从后端获取 AI 配置
    console.log('🔑 正在从后端获取 AI 配置...');
    const response = await authApi.getAiConfig();
    console.log('📦 后端返回的完整响应:', response);
    
    // 提取实际数据（后端返回格式：{ success: true, data: { available, apiKey, baseURL } }）
    const configResponse = response.data || response;
    console.log('📦 提取的配置数据:', configResponse);
    
    if (!configResponse.available) {
      aiError.value = configResponse.message || '服务端未配置 AI API Key，AI 摘要功能不可用';
      console.warn('⚠️ AI 配置不可用:', configResponse.message);
      return;
    }
    
    console.log('✅ AI 配置获取成功');
    console.log('🔑 API Key 前缀:', configResponse.apiKey ? configResponse.apiKey.substring(0, 10) + '...' : '无');
    
    // 使用后端返回的 API Key 和 baseURL
    const openai = new OpenAI({
      baseURL: configResponse.baseURL || 'https://api.deepseek.com',
      apiKey: configResponse.apiKey,
      dangerouslyAllowBrowser: true
    });
    
    const summaryInput = "你是一名爱好写博客的技术人，现在需要概括一下文章，进而生成一下博客概要，不超过150字：\n 以下是源文章：" + currentBlog.content;
    
    console.log('🤖 正在调用 AI 生成摘要...');
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: summaryInput }],
      model: "deepseek-chat",
    });
    
    currentBlog.excerpt = completion.choices[0].message.content;
    aiSuccess.value = true;
    console.log('✨ AI 摘要生成成功');
    
    // 3秒后自动隐藏成功提示
    setTimeout(() => {
      aiSuccess.value = false;
    }, 3000);
    
  } catch (error) {
    console.error("❌ AI生成摘要失败:", error);
    
    // 根据错误类型显示不同的错误信息
    if (error.response?.status === 403) {
      aiError.value = '没有权限使用 AI 功能，请确认您是管理员';
    } else if (error.response?.status === 401) {
      aiError.value = '登录已过期，请重新登录后再试';
    } else if (error.message?.includes('network')) {
      aiError.value = '网络连接失败，请检查网络后重试';
    } else if (error.message?.includes('API key')) {
      aiError.value = 'API密钥无效，请联系管理员检查后端配置';
    } else if (error.message?.includes('quota')) {
      aiError.value = 'API调用额度不足，请稍后重试';
    } else {
      aiError.value = 'AI生成失败：' + (error.message || '请稍后重试');
    }
    
    // 5秒后自动隐藏错误提示
    setTimeout(() => {
      aiError.value = '';
    }, 5000);
  } finally {
    aiGenerating.value = false;
  }
};

const handleAssetsSelect = async (event) => {
  const files = Array.from(event.target.files || [])
  selectedAssetsFiles.value = files
  assetsUrlMap.value = new Map()
  for (const file of files) {
    if (/\.zip$/i.test(file.name)) {
      // 预览阶段不解压 zip；仅在导入接口时处理
      continue
    }
    const url = URL.createObjectURL(file)
    assetsUrlMap.value.set(file.name.replace(/\\/g, '/'), url)
  }
}

// 获取博客列表
const getBlogs = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await adminApi.getAllBlogs()
    if (response.success) {
      blogs.value = response.data.blogs || []
      filteredBlogs.value = response.data.blogs || []
      // 在获取博客后更新分类列表
      getCategories()
    } else {
      throw new Error(response.message || '获取博客列表失败')
    }
  } catch (err) {
    console.error('获取博客列表失败:', err)
    error.value = err.message || '获取博客列表失败，请稍后重试'
    blogs.value = []
    filteredBlogs.value = []
  } finally {
    loading.value = false
  }
}

// 过滤博客
const filterBlogs = () => {
  let filtered = blogs.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(blog => 
      blog.title.toLowerCase().includes(query) || 
      blog.excerpt.toLowerCase().includes(query) ||
      blog.content.toLowerCase().includes(query) ||
      (blog.tags && blog.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }

  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(blog => blog.status === statusFilter.value)
  }

  filteredBlogs.value = filtered
}

// 编辑博客
const editBlog = (blog) => {
  Object.assign(currentBlog, {
    id: blog._id || blog.id,
    title: blog.title,
    excerpt: blog.excerpt,
    content: blog.content,
    category: blog.category,
    newCategoryText: '',
    tags: blog.tags?.join(',') || '',
    status: blog.status || 'draft',
    coverImage: blog.coverImage || ''
  })
  showEditModal.value = true
}

// 保存博客
const saveBlog = async () => {
  try {
    console.log('🔍 开始保存博客...')
    console.log('当前用户认证状态:', authStore.isAuthenticated)
    console.log('当前用户信息:', JSON.parse(JSON.stringify(authStore.user)))
    
    // 确定最终的分类名称
    const finalCategory = currentBlog.category === '__other__' 
      ? currentBlog.newCategoryText.trim() 
      : currentBlog.category
    
    const blogData = {
      title: currentBlog.title,
      excerpt: currentBlog.excerpt,
      content: currentBlog.content,
      category: finalCategory,
      tags: currentBlog.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      status: currentBlog.status,
      coverImage: currentBlog.coverImage || ''
    }
    
    console.log('📝 准备发送的博客数据:', JSON.stringify(blogData, null, 2))
    
    // 检查必填字段
    if (!blogData.title) {
      alert('请填写博客标题')
      return
    }
    if (!blogData.excerpt) {
      alert('请填写博客摘要')
      return
    }
    if (!blogData.content) {
      alert('请填写博客内容')
      return
    }
    if (!blogData.category) {
      alert('请选择博客分类')
      return
    }
    
    // 验证自定义分类
    if (currentBlog.category === '__other__' && !currentBlog.newCategoryText.trim()) {
      alert('请输入新分类名称')
      return
    }

    let response
    // 如果内容中含有相对图片路径，且选择了本地资源，则使用导入接口以便后端统一上传并重写链接
    const hasRelativeImages = /!\[[^\]]*\]\((?!https?:|data:|\/api\/blog\/)[^\)]+\)/i.test(blogData.content)
    if (hasRelativeImages && (selectedAssetsFiles.value?.length || 0) > 0) {
      const form = new FormData()
      const mdBlob = new Blob([blogData.content], { type: 'text/markdown' })
      form.append('markdown', mdBlob, `${Date.now()}.md`)
      form.append('title', blogData.title)
      form.append('excerpt', blogData.excerpt)
      form.append('category', blogData.category)
      for (const tag of blogData.tags) form.append('tags', tag)
      form.append('status', blogData.status)
      // 如果是编辑模式，传递现有博客ID避免重复创建
      if (!showCreateModal.value && currentBlog.id) {
        form.append('blogId', currentBlog.id)
      }
      for (const f of selectedAssetsFiles.value) form.append('assets', f)
      console.log(showCreateModal.value ? '🆕 通过导入接口创建博客（含资源）...' : '✏️ 通过导入接口更新博客（含资源）...')
      response = await adminApi.importMarkdown(form)
    } else {
      if (showCreateModal.value) {
        console.log('🆕 创建新博客...')
        response = await adminApi.createBlog(blogData)
      } else {
        console.log('✏️ 更新博客...')
        response = await adminApi.updateBlog(currentBlog.id, blogData)
      }
    }

    console.log('📤 API响应:', response)

    if (response.success) {
      await getBlogs()
      closeModal()
      alert(showCreateModal.value ? '博客创建成功!' : '博客更新成功!')
    } else {
      throw new Error(response.message || '保存失败')
    }
  } catch (err) {
    console.error('❌ 保存博客失败:', err)
    
    // 详细的错误信息
    let errorMessage = '保存失败'
    
    if (err.response) {
      console.error('错误响应状态:', err.response.status)
      console.error('错误响应数据:', err.response.data)
      console.error('错误响应头:', err.response.headers)
      
      const errorData = err.response.data
      if (errorData.message) {
        errorMessage += ': ' + errorData.message
      }
      
      // 特定错误处理
      switch (err.response.status) {
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
    } else if (err.request) {
      console.error('请求错误:', err.request)
      errorMessage = '网络连接失败 - 请检查网络连接'
    } else {
      console.error('其他错误:', err.message)
      errorMessage = err.message
    }
    
    alert(errorMessage)
  }
}

// 删除博客
const deleteBlog = async (id) => {
  if (!confirm('确定要删除这篇博客吗？')) return

  try {
    const response = await adminApi.deleteBlog(id)
    if (response.success || response.message === '博客已删除') {
      await getBlogs()
      alert('博客删除成功!')
    } else {
      throw new Error(response.message || '删除失败')
    }
  } catch (err) {
    console.error('删除博客失败:', err)
    alert('删除失败: ' + err.message)
  }
}

// 关闭模态框
const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  // 重置表单
  Object.assign(currentBlog, {
    id: null,
    title: '',
    excerpt: '',
    content: '',
    category: '',
    newCategoryText: '',
    tags: '',
    status: 'draft',
    coverImage: ''
  })
  // 清除选中的资源文件
  selectedAssetsFiles.value = []
  assetsUrlMap.value = new Map()
  if (assetsInput.value) {
    assetsInput.value.value = ''
  }
  if (coverInput.value) {
    coverInput.value.value = ''
  }
}

// 插入文本到光标位置的工具函数
function insertAtCursor(textareaEl, text) {
  const start = textareaEl.selectionStart
  const end = textareaEl.selectionEnd
  const old = textareaEl.value
  textareaEl.value = old.slice(0, start) + text + old.slice(end)
  const pos = start + text.length
  textareaEl.selectionStart = textareaEl.selectionEnd = pos
  textareaEl.dispatchEvent(new Event('input')) // 触发 v-model 更新
}

// 处理粘贴图片
const handlePasteImage = async (event) => {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file' && item.type.indexOf('image') !== -1) {
      event.preventDefault()
      const file = item.getAsFile()
      await uploadAndInsertImage(file)
      break
    }
  }
}

// 处理拖拽图片
const handleDropImage = async (event) => {
  event.preventDefault()
  const files = event.dataTransfer.files
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file.type.indexOf('image') !== -1) {
      await uploadAndInsertImage(file)
      break
    }
  }
}

// 上传图片并插入
const uploadAndInsertImage = async (file) => {
  try {
    console.log('🔍 开始上传图片:', file.name)
    const result = await uploadImage(file)
    const markdownText = `![${file.name}](${result.url})`
    insertAtCursor(markdownTextarea.value, markdownText)
    console.log('✅ 图片上传并插入成功')
  } catch (error) {
    console.error('❌ 图片上传失败:', error)
    alert('图片上传失败: ' + error.message)
  }
}

// 触发选择封面
const triggerCoverSelect = () => {
  coverInput.value?.click()
}

// 处理封面上传
const handleCoverUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const result = await uploadImage(file)
    currentBlog.coverImage = result.url
  } catch (e) {
    console.error('封面上传失败:', e)
    alert('封面上传失败: ' + e.message)
  }
}

// 管理端预览解析与错误日志
const resolveCover = (href) => {
  const ASSET_BASE = import.meta.env.PROD ? (import.meta.env.VITE_ASSET_BASE_URL || '') : '/uploads/'
  const API_ORIGIN = import.meta.env.PROD ? (import.meta.env.VITE_APP_API_ORIGIN || 'https://api.shirakawananase.top') : ''
  if (!href) return ''
  const isAbs = /^(https?:|data:)/i.test(href)
  const isApiRoute = /^\/api\/blog\//i.test(href)
  if (isAbs) return href
  if (isApiRoute) return API_ORIGIN ? `${API_ORIGIN}${href}` : href
  return ASSET_BASE ? `${ASSET_BASE.replace(/\/$/, '')}/${String(href).replace(/^\//, '')}` : href
}
const onCoverPreviewError = () => {
  console.error('封面预览加载失败:', currentBlog.coverImage)
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Date'
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  getBlogs()
})
</script>

<style scoped>
.admin-blog-manager {
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

.list-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-bar input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 300px;
}

.filter-bar select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.blog-table {
  overflow-x: auto;
}

.blog-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.blog-table th,
.blog-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.blog-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.blog-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pinned-indicator {
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.blog-summary {
  font-size: 0.8rem;
  color: #666;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  background: #e67e22;
  color: white;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.published {
  background: #d4edda;
  color: #155724;
}

.status-badge.draft {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.pinned {
  background: #fff3cd;
  color: #856404;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.edit-btn,
.delete-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.3s;
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
  max-width: 800px;
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
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.cover-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.cover-preview img {
  width: 240px;
  height: auto;
  border-radius: 6px;
  margin-top: 0.5rem;
  display: block;
}

.mt-2 {
  margin-top: 0.5rem;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.cancel-btn,
.save-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #545b62;
}

.save-btn {
  background: #28a745;
  color: white;
}

.save-btn:hover {
  background: #218838;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.upload-md-btn {
  padding: 0.25rem 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.upload-md-btn:hover {
  background-color: #0056b3;
}

.markdown-editor {
  display: flex;
  gap: 1rem;
  height: 400px;
}

.markdown-input,
.markdown-preview {
  width: 50%;
  height: 100%;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  box-sizing: border-box;
  overflow-y: auto;
  font-size: 0.9rem;
  line-height: 1.6;
}

.markdown-input {
  resize: none;
  font-family: 'Courier New', Courier, monospace;
}

.markdown-preview {
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.markdown-preview > :first-child {
  margin-top: 0;
}

.markdown-preview > :last-child {
  margin-bottom: 0;
}

/* AI生成摘要相关样式 */
.excerpt-wrapper {
  position: relative;
}

.excerpt-wrapper textarea {
  padding-right: 0;
  margin-bottom: 0.75rem;
}

.ai-summary-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.ai-summary-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.ai-summary-btn:active:not(:disabled) {
  transform: translateY(0);
}

.ai-summary-btn:disabled {
  background: linear-gradient(135deg, #ccc 0%, #999 100%);
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.ai-icon {
  font-size: 1.1rem;
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.hint-text {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #e3f2fd;
  border-left: 3px solid #2196f3;
  color: #1976d2;
  font-size: 0.85rem;
  border-radius: 4px;
  line-height: 1.5;
}

.error-text {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #ffebee;
  border-left: 3px solid #f44336;
  color: #c62828;
  font-size: 0.85rem;
  border-radius: 4px;
  line-height: 1.5;
  animation: slideIn 0.3s ease-out;
}

.success-text {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #e8f5e9;
  border-left: 3px solid #4caf50;
  color: #2e7d32;
  font-size: 0.85rem;
  border-radius: 4px;
  line-height: 1.5;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

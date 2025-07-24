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
              <textarea v-model="currentBlog.excerpt" rows="3"></textarea>
            </div>
            <div class="form-group">
              <div class="content-header">
                <label>内容 (Markdown)</label>
                <button type="button" @click="triggerFileUpload" class="upload-md-btn">从文件上传</button>
                <input type="file" ref="markdownFileInput" @change="handleMarkdownUpload" accept=".md" style="display: none;">
              </div>
              <div class="markdown-editor">
                <textarea v-model="currentBlog.content" rows="15" required class="markdown-input"></textarea>
                <div v-html="markdownPreview" class="markdown-preview"></div>
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
import { useAuthStore } from '../../../store/modules/auth'
import { marked } from 'marked'

const authStore = useAuthStore()
const blogs = ref([])
const filteredBlogs = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const loading = ref(false)
const error = ref('')
const markdownFileInput = ref(null)
const availableCategories = ref(['前端开发', 'AI技术', '游戏', '音乐'])

const currentBlog = reactive({
  id: null,
  title: '',
  excerpt: '',
  content: '',
  category: '',
  newCategoryText: '',
  tags: '',
  status: 'draft'
})

const markdownPreview = computed(() => {
  return marked(currentBlog.content || '');
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
    status: blog.status || 'draft'
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
      status: currentBlog.status
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
    if (showCreateModal.value) {
      console.log('🆕 创建新博客...')
      response = await adminApi.createBlog(blogData)
    } else {
      console.log('✏️ 更新博客...')
      response = await adminApi.updateBlog(currentBlog.id, blogData)
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
    status: 'draft'
  })
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
</style>

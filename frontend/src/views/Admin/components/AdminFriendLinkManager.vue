<template>
  <div class="admin-friend-link-manager">
    <div class="manager-header">
      <h2>友情链接管理</h2>
      <button
        class="create-btn"
        @click="showCreateModal = true"
      >
        ➕ 添加友情链接
      </button>
    </div>

    <!-- 筛选选项 -->
    <div class="filter-bar">
      <select
        v-model="statusFilter"
        @change="filterFriendLinks"
      >
        <option value="">
          全部状态
        </option>
        <option value="approved">
          已通过
        </option>
        <option value="pending">
          待审核
        </option>
        <option value="rejected">
          已拒绝
        </option>
      </select>
      <select
        v-model="categoryFilter"
        @change="filterFriendLinks"
      >
        <option value="">
          全部分类
        </option>
        <option value="个人博客">
          个人博客
        </option>
        <option value="技术社区">
          技术社区
        </option>
        <option value="学习资源">
          学习资源
        </option>
        <option value="工具网站">
          工具网站
        </option>
        <option value="其他">
          其他
        </option>
      </select>
      <input
        v-model="searchQuery"
        placeholder="搜索网站名称或描述..."
        @input="filterFriendLinks"
      >
    </div>

    <!-- 友情链接列表 -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <p>正在加载友情链接...</p>
    </div>
    
    <div
      v-else-if="error"
      class="error-state"
    >
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button
        class="retry-btn"
        @click="getFriendLinks"
      >
        重试
      </button>
    </div>
    
    <div
      v-else
      class="friend-links-grid"
    >
      <div
        v-for="link in filteredFriendLinks"
        :key="link._id || link.id"
        class="link-card"
      >
        <div class="link-header">
          <img
            :src="getLinkAvatar(link.avatar)"
            :alt="link.name"
            class="link-logo"
          >
          <div class="link-info">
            <div class="link-name">
              {{ link.name }}
            </div>
            <div class="link-url">
              <a
                :href="link.url"
                target="_blank"
              >{{ link.url }}</a>
            </div>
          </div>
        </div>
        <div class="link-content">
          <div class="link-description">
            {{ link.description || '暂无描述' }}
          </div>
          <div class="link-meta">
            <span class="category">{{ link.category }}</span>
            <span :class="['status', getStatusClass(link.isActive)]">
              {{ getStatusText(link.isActive) }}
            </span>
            <span class="date">{{ formatDate(link.createdAt) }}</span>
          </div>
        </div>
        <div class="link-actions">
          <button
            class="edit-btn"
            @click="editFriendLink(link)"
          >
            编辑
          </button>
          <button 
            v-if="!link.isActive" 
            class="approve-btn" 
            @click="toggleLinkStatus(link._id || link.id, true)"
          >
            通过
          </button>
          <button 
            v-if="link.isActive" 
            class="reject-btn" 
            @click="toggleLinkStatus(link._id || link.id, false)"
          >
            禁用
          </button>
          <button
            class="delete-btn"
            @click="deleteFriendLink(link._id || link.id)"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-if="!loading && !error && filteredFriendLinks.length === 0"
      class="empty-state"
    >
      <h3>暂无友情链接</h3>
      <p>还没有任何友情链接，点击添加按钮开始创建</p>
    </div>

    <!-- 创建/编辑模态框 -->
    <Teleport to="body">
      <div
        v-if="showCreateModal || showEditModal"
        class="modal-overlay"
        @click="closeModal"
      >
        <div
          class="modal-content"
          @click.stop
        >
          <div class="modal-header">
            <h3>{{ isEditing ? '编辑友情链接' : '添加友情链接' }}</h3>
            <button
              class="close-btn"
              @click="closeModal"
            >
              ✕
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveFriendLink">
              <div class="form-group">
                <label>网站名称</label>
                <input
                  v-model="currentFriendLink.name"
                  type="text"
                  required
                >
              </div>
              <div class="form-group">
                <label>网站地址</label>
                <div class="url-input-group">
                  <input 
                    v-model="currentFriendLink.url" 
                    type="text" 
                    required 
                    placeholder="例如：www.example.com 或 https://www.example.com"
                    @blur="handleUrlBlur"
                  >
                  <button 
                    type="button" 
                    class="fetch-favicon-btn" 
                    :disabled="fetchingFavicon || !currentFriendLink.url"
                    @click="fetchFavicon"
                  >
                    {{ fetchingFavicon ? '获取中...' : '🔄 获取图标' }}
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>网站描述</label>
                <textarea
                  v-model="currentFriendLink.description"
                  rows="3"
                />
              </div>
              <div class="form-group">
                <label>分类</label>
                <select
                  v-model="currentFriendLink.category"
                  required
                >
                  <option value="">
                    选择分类
                  </option>
                  <option value="个人博客">
                    个人博客
                  </option>
                  <option value="技术社区">
                    技术社区
                  </option>
                  <option value="学习资源">
                    学习资源
                  </option>
                  <option value="工具网站">
                    工具网站
                  </option>
                  <option value="其他">
                    其他
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>网站Logo</label>
                <div class="logo-input-group">
                  <input 
                    v-model="currentFriendLink.avatar" 
                    type="url" 
                    placeholder="自动获取或手动输入Logo地址" 
                  >
                  <div
                    v-if="currentFriendLink.avatar"
                    class="logo-preview"
                  >
                    <img 
                      :src="currentFriendLink.avatar" 
                      alt="Logo预览" 
                      @error="handleLogoError"
                    >
                  </div>
                </div>
                <small class="form-hint">留空将自动获取网站favicon作为Logo</small>
              </div>
              <div class="form-group">
                <label>联系邮箱</label>
                <input
                  v-model="currentFriendLink.email"
                  type="email"
                >
              </div>
              <div class="form-group">
                <label>联系信息</label>
                <input
                  v-model="currentFriendLink.contactInfo"
                  type="text"
                  placeholder="QQ、微信等联系方式"
                >
              </div>
              <div class="form-group">
                <label>状态</label>
                <select v-model="currentFriendLink.isActive">
                  <option value="false">
                    待审核
                  </option>
                  <option value="true">
                    已通过
                  </option>
                </select>
              </div>
              <div class="form-actions">
                <button
                  type="button"
                  class="cancel-btn"
                  @click="closeModal"
                >
                  取消
                </button>
                <button
                  type="submit"
                  class="save-btn"
                >
                  {{ isEditing ? '更新' : '创建' }}
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
import { ref, reactive, onMounted, computed } from 'vue'
import { friendLinkApi } from '../../../api/friendLink'

const friendLinks = ref([])
const filteredFriendLinks = ref([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const loading = ref(false)
const error = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const searchQuery = ref('')
const fetchingFavicon = ref(false)

const currentFriendLink = reactive({
  id: null,
  name: '',
  url: '',
  description: '',
  category: '',
  avatar: '',
  email: '',
  contactInfo: '',
  isActive: 'false'
})

const isEditing = computed(() => !!currentFriendLink.id)

// 获取友情链接列表
const getFriendLinks = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await friendLinkApi.getFriendLinks()
    if (response.success) {
      friendLinks.value = response.data.friendLinks || response.data
      filteredFriendLinks.value = response.data.friendLinks || response.data
    } else {
      throw new Error(response.message || '获取友情链接失败')
    }
  } catch (err) {
    console.error('❌ 获取友情链接失败:', err)
    error.value = err.message || '获取友情链接失败，请稍后重试'
    
    // 设置模拟数据
    const mockData = [
      {
        id: 1,
        name: 'Vue.js 官网',
        url: 'https://vuejs.org',
        description: 'The Progressive JavaScript Framework',
        category: '技术社区',
        avatar: 'https://vuejs.org/logo.svg',
        isActive: true,
        email: 'admin@vuejs.org',
        contactInfo: '',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'GitHub',
        url: 'https://github.com',
        description: 'Where the world builds software',
        category: '工具网站',
        avatar: 'https://github.com/fluidicon.png',
        isActive: true,
        email: 'support@github.com',
        contactInfo: '',
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        name: '测试博客',
        url: 'https://example.com',
        description: '这是一个待审核的测试博客',
        category: '个人博客',
        avatar: '',
        isActive: false,
        email: 'test@example.com',
        contactInfo: 'QQ: 123456789',
        createdAt: new Date().toISOString()
      }
    ]
    
    friendLinks.value = mockData
    filteredFriendLinks.value = mockData
  } finally {
    loading.value = false
  }
}

// 过滤友情链接
const filterFriendLinks = () => {
  let filtered = friendLinks.value

  // 状态过滤
  if (statusFilter.value) {
    if (statusFilter.value === 'approved') {
      filtered = filtered.filter(link => link.isActive === true)
    } else if (statusFilter.value === 'pending') {
      filtered = filtered.filter(link => link.isActive === false)
    }
  }

  // 分类过滤
  if (categoryFilter.value) {
    filtered = filtered.filter(link => link.category === categoryFilter.value)
  }

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(link =>
      link.name.toLowerCase().includes(query) ||
      link.description?.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query)
    )
  }

  filteredFriendLinks.value = filtered
}

// 编辑友情链接
const editFriendLink = (link) => {
  Object.assign(currentFriendLink, {
    id: link._id || link.id,
    name: link.name,
    url: link.url,
    description: link.description || '',
    category: link.category,
    avatar: link.avatar,
    email: link.email,
    contactInfo: link.contactInfo,
    isActive: link.isActive ? 'true' : 'false'
  })
  showEditModal.value = true
}

// 保存友情链接
const saveFriendLink = async () => {
  try {
    const linkData = {
      name: currentFriendLink.name,
      url: currentFriendLink.url,
      description: currentFriendLink.description,
      category: currentFriendLink.category,
      avatar: currentFriendLink.avatar,
      email: currentFriendLink.email,
      contactInfo: currentFriendLink.contactInfo,
      isActive: currentFriendLink.isActive === 'true'
    }

    if (isEditing.value) {
      await friendLinkApi.updateFriendLink(currentFriendLink.id, linkData)
      alert('友情链接更新成功!')
    } else {
      await friendLinkApi.createFriendLink(linkData)
      alert('友情链接创建成功!')
    }
    
    await getFriendLinks()
    closeModal()
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败: ' + (error.response?.data?.message || error.message))
  }
}

// 切换友情链接状态
const toggleLinkStatus = async (id, isActive) => {
  const statusText = isActive ? '通过' : '禁用'
  if (!confirm(`确定要${statusText}此友情链接吗？`)) return

  try {
    await friendLinkApi.updateFriendLink(id, { isActive })
    await getFriendLinks()
    alert(`友情链接${statusText}成功!`)
  } catch (error) {
    console.error('状态切换失败:', error)
    alert('状态切换失败: ' + (error.response?.data?.message || error.message))
  }
}

// 删除友情链接
const deleteFriendLink = async (id) => {
  if (!confirm('确定要删除这个友情链接吗？')) return

  try {
    await friendLinkApi.deleteFriendLink(id)
    await getFriendLinks()
    alert('友情链接删除成功!')
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败: ' + (error.response?.data?.message || error.message))
  }
}

// 关闭模态框
const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  Object.assign(currentFriendLink, {
    id: null,
    name: '',
    url: '',
    description: '',
    category: '',
    avatar: '',
    email: '',
    contactInfo: '',
    isActive: 'false'
  })
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 获取状态类名
const getStatusClass = (isActive) => {
  return isActive ? 'approved' : 'pending'
}

// 获取状态文本
const getStatusText = (isActive) => {
  return isActive ? '已通过' : '待审核'
}

// 获取网站favicon
const fetchFavicon = async () => {
  if (!currentFriendLink.url) {
    alert('请先输入网站地址')
    return
  }

  fetchingFavicon.value = true
  try {
    console.log('🔍 获取网站favicon:', currentFriendLink.url)
    const response = await friendLinkApi.previewFavicon(currentFriendLink.url)
    
    if (response.success && response.data.success) {
      currentFriendLink.avatar = response.data.faviconUrl
      console.log('✅ Favicon获取成功:', response.data.faviconUrl)
      alert(`Favicon获取成功！\n方法: ${response.data.method}\n域名: ${response.data.domain}`)
    } else {
      console.warn('⚠️ Favicon获取失败:', response.data)
      alert('无法获取网站图标，请手动输入Logo地址')
    }
  } catch (error) {
    console.error('❌ 获取favicon失败:', error)
    alert('获取网站图标失败: ' + (error.response?.data?.message || error.message))
  } finally {
    fetchingFavicon.value = false
  }
}

// 处理URL失焦事件，自动获取favicon
const handleUrlBlur = async () => {
  // 如果没有设置头像，且URL有效，自动获取favicon
  if (currentFriendLink.url && !currentFriendLink.avatar) {
    await fetchFavicon()
  }
}

// 处理Logo加载错误
const handleLogoError = (event) => {
  console.warn('Logo加载失败:', event.target.src)
  event.target.src = '/image/default-logo.png'
}

// 获取Logo URL
const getLinkAvatar = (avatar) => {
  if (!avatar) return '/image/default-logo.png'
  if (avatar.startsWith('http')) return avatar
  const baseUrl = (import.meta.env.VITE_APP_API_URL?.replace('/api', ''))
    || (typeof window !== 'undefined' && (window.location.hostname === 'shirakawananase.top' || window.location.hostname.endsWith('.shirakawananase.top'))
      ? 'https://api.shirakawananase.top'
      : 'http://localhost:3000')
  return `${baseUrl}${avatar}`
}

onMounted(() => {
  getFriendLinks()
})
</script>

<style scoped>
.admin-friend-link-manager {
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

.friend-links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.link-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.link-card:hover {
  transform: translateY(-5px);
}

.link-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.link-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.link-info {
  flex: 1;
}

.link-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.link-url a {
  color: #007bff;
  text-decoration: none;
  font-size: 0.9rem;
}

.link-url a:hover {
  text-decoration: underline;
}

.link-content {
  padding: 1rem;
}

.link-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.link-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.category {
  background: #e9ecef;
  color: #495057;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status.approved {
  background: #d4edda;
  color: #155724;
}

.status.pending {
  background: #fff3cd;
  color: #856404;
}

.date {
  color: #999;
  font-size: 0.8rem;
}

.link-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #eee;
}

.link-actions button {
  padding: 4px 8px;
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

.approve-btn {
  background: #28a745;
  color: white;
}

.reject-btn {
  background: #ffc107;
  color: #212529;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.link-actions button:hover {
  opacity: 0.8;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.error-state h3 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
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

.save-btn {
  background: #28a745;
  color: white;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
  }

  .filter-bar input {
    width: 100%;
  }

  .friend-links-grid {
    grid-template-columns: 1fr;
  }

  .link-actions {
    flex-wrap: wrap;
  }
}

.url-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.url-input-group input {
  flex: 1;
}

.fetch-favicon-btn {
  padding: 0.5rem 1rem;
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
  transition: background 0.3s;
}

.fetch-favicon-btn:hover:not(:disabled) {
  background: #138496;
}

.fetch-favicon-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.logo-input-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-input-group input {
  flex: 1;
}

.logo-preview {
  flex-shrink: 0;
}

.logo-preview img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #ddd;
}

.form-hint {
  color: #666;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}
</style> 
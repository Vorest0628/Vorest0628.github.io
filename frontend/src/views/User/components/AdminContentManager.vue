<!--
  AdminContentManager - 管理员内容管理
  功能：
  1. 管理所有内容的公开状态
  2. 批量操作
  3. 搜索和筛选
-->
<template>
  <div class="admin-content-manager">
    <div class="manager-header">
      <h2>内容管理</h2>
      <p class="subtitle">管理所有用户内容的显示状态</p>
    </div>

    <!-- 内容类型选择 -->
    <div class="content-type-tabs">
      <button 
        v-for="type in contentTypes" 
        :key="type.key"
        @click="activeContentType = type.key"
        class="type-tab"
        :class="{ active: activeContentType === type.key }"
      >
        {{ type.label }}
        <span class="count">({{ type.count }})</span>
      </button>
    </div>

    <!-- 搜索和筛选工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery"
          :placeholder="`搜索${currentTypeLabel}...`"
          class="search-input"
        />
        <button class="search-btn">🔍</button>
      </div>
      
      <div class="filter-controls">
        <select v-model="statusFilter" class="filter-select">
          <option value="">全部状态</option>
          <option value="public">公开</option>
          <option value="private">私有</option>
          <option value="pending">待审核</option>
        </select>
        
        <select v-model="userFilter" class="filter-select">
          <option value="">全部用户</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.username }}
          </option>
        </select>
      </div>

      <div class="batch-actions">
        <button 
          @click="selectAll"
          class="batch-btn secondary"
          :disabled="filteredItems.length === 0"
        >
          全选
        </button>
        <button 
          @click="batchToggleStatus('public')"
          class="batch-btn success"
          :disabled="selectedItems.length === 0"
        >
          批量公开
        </button>
        <button 
          @click="batchToggleStatus('private')"
          class="batch-btn warning"
          :disabled="selectedItems.length === 0"
        >
          批量隐藏
        </button>
      </div>
    </div>

    <!-- 内容列表 -->
    <div class="content-list">
      <div v-if="loading" class="loading">
        <p>加载中...</p>
      </div>
      
      <div v-else-if="filteredItems.length === 0" class="empty-state">
        <p>没有找到相关内容</p>
      </div>
      
      <div v-else class="content-items">
        <!-- 评论管理 -->
        <div v-if="activeContentType === 'comments'" class="comment-items">
          <div 
            v-for="item in filteredItems" 
            :key="item.id"
            class="content-item"
            :class="{ selected: selectedItems.includes(item.id) }"
          >
            <div class="item-checkbox">
              <input 
                type="checkbox" 
                :value="item.id"
                v-model="selectedItems"
              />
            </div>
            
            <div class="item-content">
              <div class="item-header">
                <h4>{{ item.author }}</h4>
                <span class="item-time">{{ formatTime(item.createdAt) }}</span>
                <span class="status-badge" :class="item.status">
                  {{ statusLabels[item.status] }}
                </span>
              </div>
              
              <div class="item-text">{{ item.content }}</div>
              
              <div class="item-meta">
                <span class="meta-info">页面: {{ item.page }}</span>
                <span class="meta-info">IP: {{ item.ip }}</span>
              </div>
            </div>
            
            <div class="item-actions">
              <button 
                @click="toggleItemStatus(item)"
                class="action-btn"
                :class="item.status === 'public' ? 'hide' : 'show'"
              >
                {{ item.status === 'public' ? '隐藏' : '显示' }}
              </button>
              <button 
                @click="deleteItem(item)"
                class="action-btn delete"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <!-- 推荐歌曲管理 -->
        <div v-if="activeContentType === 'recommendations'" class="recommendation-items">
          <div 
            v-for="item in filteredItems" 
            :key="item.id"
            class="content-item"
            :class="{ selected: selectedItems.includes(item.id) }"
          >
            <div class="item-checkbox">
              <input 
                type="checkbox" 
                :value="item.id"
                v-model="selectedItems"
              />
            </div>
            
            <div class="item-content">
              <div class="item-header">
                <h4>{{ item.title }} - {{ item.artist }}</h4>
                <span class="item-time">{{ formatTime(item.createdAt) }}</span>
                <span class="status-badge" :class="item.status">
                  {{ statusLabels[item.status] }}
                </span>
              </div>
              
              <div class="item-text">{{ item.reason }}</div>
              
              <div class="item-meta">
                <span class="meta-info">推荐人: {{ item.recommender }}</span>
                <span class="meta-info">类型: {{ item.genre }}</span>
                <a v-if="item.link" :href="item.link" target="_blank" class="meta-link">试听链接</a>
              </div>
            </div>
            
            <div class="item-actions">
              <button 
                @click="toggleItemStatus(item)"
                class="action-btn"
                :class="item.status === 'public' ? 'hide' : 'show'"
              >
                {{ item.status === 'public' ? '隐藏' : '显示' }}
              </button>
              <button 
                @click="deleteItem(item)"
                class="action-btn delete"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <!-- 图库管理 -->
        <div v-if="activeContentType === 'gallery'" class="gallery-items">
          <div 
            v-for="item in filteredItems" 
            :key="item.id"
            class="gallery-item"
            :class="{ selected: selectedItems.includes(item.id) }"
          >
            <div class="item-checkbox">
              <input 
                type="checkbox" 
                :value="item.id"
                v-model="selectedItems"
              />
            </div>
            
            <div class="item-image">
              <img :src="item.url" :alt="item.title" />
            </div>
            
            <div class="item-info">
              <h4>{{ item.title }}</h4>
              <p>{{ item.description }}</p>
              <div class="item-meta">
                <span class="meta-info">上传者: {{ item.uploader }}</span>
                <span class="meta-info">{{ formatTime(item.createdAt) }}</span>
                <span class="status-badge" :class="item.status">
                  {{ statusLabels[item.status] }}
                </span>
              </div>
            </div>
            
            <div class="item-actions">
              <button 
                @click="toggleItemStatus(item)"
                class="action-btn"
                :class="item.status === 'public' ? 'hide' : 'show'"
              >
                {{ item.status === 'public' ? '隐藏' : '显示' }}
              </button>
              <button 
                @click="deleteItem(item)"
                class="action-btn delete"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <!-- 文档管理 -->
        <div v-if="activeContentType === 'documents'" class="document-items">
          <div 
            v-for="item in filteredItems" 
            :key="item.id"
            class="content-item"
            :class="{ selected: selectedItems.includes(item.id) }"
          >
            <div class="item-checkbox">
              <input 
                type="checkbox" 
                :value="item.id"
                v-model="selectedItems"
              />
            </div>
            
            <div class="item-content">
              <div class="item-header">
                <h4>{{ item.title }}</h4>
                <span class="item-time">{{ formatTime(item.createdAt) }}</span>
                <span class="status-badge" :class="item.status">
                  {{ statusLabels[item.status] }}
                </span>
              </div>
              
              <div class="item-text">{{ item.description }}</div>
              
              <div class="item-meta">
                <span class="meta-info">类型: {{ item.type }}</span>
                <span class="meta-info">大小: {{ formatFileSize(item.size) }}</span>
                <span class="meta-info">创建者: {{ item.creator }}</span>
              </div>
            </div>
            
            <div class="item-actions">
              <button 
                @click="toggleItemStatus(item)"
                class="action-btn"
                :class="item.status === 'public' ? 'hide' : 'show'"
              >
                {{ item.status === 'public' ? '隐藏' : '显示' }}
              </button>
              <button 
                @click="deleteItem(item)"
                class="action-btn delete"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="currentPage = Math.max(1, currentPage - 1)"
        :disabled="currentPage === 1"
        class="page-btn"
      >
        上一页
      </button>
      
      <span class="page-info">
        第 {{ currentPage }} 页，共 {{ totalPages }} 页
      </span>
      
      <button 
        @click="currentPage = Math.min(totalPages, currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

// 响应式数据
const activeContentType = ref('comments')
const searchQuery = ref('')
const statusFilter = ref('')
const userFilter = ref('')
const selectedItems = ref([])
const currentPage = ref(1)
const itemsPerPage = ref(10)
const loading = ref(false)

// 模拟数据
const allContent = ref({
  comments: [],
  recommendations: [],
  gallery: [],
  documents: []
})

const users = ref([])

// 内容类型配置
const contentTypes = computed(() => [
  { key: 'comments', label: '评论', count: allContent.value.comments.length },
  { key: 'recommendations', label: '推荐歌曲', count: allContent.value.recommendations.length },
  { key: 'gallery', label: '图库', count: allContent.value.gallery.length },
  { key: 'documents', label: '文档', count: allContent.value.documents.length }
])

const currentTypeLabel = computed(() => {
  const type = contentTypes.value.find(t => t.key === activeContentType.value)
  return type ? type.label : ''
})

// 状态标签
const statusLabels = {
  public: '公开',
  private: '私有',
  pending: '待审核'
}

// 筛选后的内容
const filteredItems = computed(() => {
  let items = allContent.value[activeContentType.value] || []
  
  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => {
      switch (activeContentType.value) {
        case 'comments':
          return item.content.toLowerCase().includes(query) || 
                 item.author.toLowerCase().includes(query)
        case 'recommendations':
          return item.title.toLowerCase().includes(query) || 
                 item.artist.toLowerCase().includes(query) ||
                 item.recommender.toLowerCase().includes(query)
        case 'gallery':
          return item.title.toLowerCase().includes(query) ||
                 item.description.toLowerCase().includes(query)
        case 'documents':
          return item.title.toLowerCase().includes(query) ||
                 item.description.toLowerCase().includes(query)
        default:
          return true
      }
    })
  }
  
  // 状态筛选
  if (statusFilter.value) {
    items = items.filter(item => item.status === statusFilter.value)
  }
  
  // 用户筛选
  if (userFilter.value) {
    items = items.filter(item => {
      switch (activeContentType.value) {
        case 'comments':
          return item.authorId === parseInt(userFilter.value)
        case 'recommendations':
          return item.recommenderId === parseInt(userFilter.value)
        case 'gallery':
          return item.uploaderId === parseInt(userFilter.value)
        case 'documents':
          return item.creatorId === parseInt(userFilter.value)
        default:
          return true
      }
    })
  }
  
  // 分页
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return items.slice(start, end)
})

// 总页数
const totalPages = computed(() => {
  let items = allContent.value[activeContentType.value] || []
  return Math.ceil(items.length / itemsPerPage.value)
})

// 方法
const loadContent = async () => {
  loading.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据
    allContent.value = {
      comments: [
        {
          id: 1,
          author: 'Alice',
          authorId: 2,
          content: '这个网站很不错！',
          status: 'public',
          page: '首页',
          ip: '192.168.1.100',
          createdAt: new Date('2024-01-15T10:30:00')
        },
        {
          id: 2,
          author: 'Bob',
          authorId: 3,
          content: '希望能添加更多功能',
          status: 'pending',
          page: '关于',
          ip: '192.168.1.101',
          createdAt: new Date('2024-01-16T14:20:00')
        }
      ],
      recommendations: [
        {
          id: 1,
          title: 'New Song',
          artist: 'Artist Name',
          recommender: 'Alice',
          recommenderId: 2,
          reason: '非常好听的歌曲',
          genre: 'Pop',
          link: 'https://example.com/song',
          status: 'pending',
          createdAt: new Date('2024-01-15T16:00:00')
        }
      ],
      gallery: [
        {
          id: 1,
          title: '美丽风景',
          description: '在山顶拍摄的日出',
          url: '/images/sample.jpg',
          uploader: 'Alice',
          uploaderId: 2,
          status: 'public',
          createdAt: new Date('2024-01-14T09:00:00')
        }
      ],
      documents: [
        {
          id: 1,
          title: '用户手册',
          description: '网站使用说明',
          type: 'PDF',
          size: 1024000,
          creator: 'Admin',
          creatorId: 1,
          status: 'public',
          createdAt: new Date('2024-01-10T12:00:00')
        }
      ]
    }
    
    // 模拟用户列表
    users.value = [
      { id: 1, username: 'admin' },
      { id: 2, username: 'Alice' },
      { id: 3, username: 'Bob' }
    ]
    
  } catch (error) {
    console.error('加载内容失败:', error)
  } finally {
    loading.value = false
  }
}

const selectAll = () => {
  const allIds = filteredItems.value.map(item => item.id)
  selectedItems.value = [...allIds]
}

const toggleItemStatus = async (item) => {
  const newStatus = item.status === 'public' ? 'private' : 'public'
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    item.status = newStatus
    
    console.log(`${currentTypeLabel.value} ${item.id} 状态已更改为 ${statusLabels[newStatus]}`)
    
  } catch (error) {
    console.error('更新状态失败:', error)
  }
}

const batchToggleStatus = async (newStatus) => {
  if (selectedItems.value.length === 0) return
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const items = allContent.value[activeContentType.value]
    selectedItems.value.forEach(id => {
      const item = items.find(item => item.id === id)
      if (item) {
        item.status = newStatus
      }
    })
    
    console.log(`已批量将 ${selectedItems.value.length} 个项目设置为${statusLabels[newStatus]}`)
    selectedItems.value = []
    
  } catch (error) {
    console.error('批量操作失败:', error)
  }
}

const deleteItem = async (item) => {
  if (!confirm(`确定要删除这个${currentTypeLabel.value}吗？`)) return
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const items = allContent.value[activeContentType.value]
    const index = items.findIndex(i => i.id === item.id)
    if (index > -1) {
      items.splice(index, 1)
    }
    
    console.log(`${currentTypeLabel.value} ${item.id} 已删除`)
    
  } catch (error) {
    console.error('删除失败:', error)
  }
}

const formatTime = (date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatFileSize = (bytes) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
}

// 监听内容类型变化，重置选择和分页
watch(activeContentType, () => {
  selectedItems.value = []
  currentPage.value = 1
})

// 组件挂载
onMounted(() => {
  loadContent()
})
</script>

<style scoped>
.admin-content-manager {
  max-width: 100%;
}

.manager-header {
  margin-bottom: 30px;
}

.manager-header h2 {
  margin-bottom: 8px;
  color: #333;
  font-size: 1.8rem;
}

.subtitle {
  color: #666;
  margin: 0;
}

.content-type-tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 25px;
  background: #f8f9fa;
  padding: 5px;
  border-radius: 10px;
}

.type-tab {
  flex: 1;
  padding: 10px 15px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.3s ease;
}

.type-tab:hover {
  background: rgba(103, 126, 234, 0.1);
  color: #495057;
}

.type-tab.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 2px 8px rgba(103, 126, 234, 0.3);
}

.count {
  font-size: 0.9rem;
  opacity: 0.8;
}

.toolbar {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  flex: 1;
  min-width: 250px;
}

.search-input {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #e9ecef;
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.search-btn {
  padding: 10px 15px;
  border: 2px solid #e9ecef;
  border-left: none;
  border-radius: 0 8px 8px 0;
  background: white;
  cursor: pointer;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 10px 15px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  font-size: 1rem;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.batch-actions {
  display: flex;
  gap: 10px;
}

.batch-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.batch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-btn.secondary {
  background: #6c757d;
  color: white;
}

.batch-btn.success {
  background: #28a745;
  color: white;
}

.batch-btn.warning {
  background: #ffc107;
  color: #212529;
}

.batch-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.content-list {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.content-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.content-item:hover {
  background: #f8f9fa;
}

.content-item.selected {
  background: #e3f2fd;
  border-color: #667eea;
}

.item-checkbox {
  margin-top: 5px;
}

.item-content {
  flex: 1;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.item-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.item-time {
  color: #6c757d;
  font-size: 0.9rem;
}

.status-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.public {
  background: #d4edda;
  color: #155724;
}

.status-badge.private {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.item-text {
  color: #495057;
  margin-bottom: 10px;
  line-height: 1.5;
}

.item-meta {
  display: flex;
  gap: 15px;
  font-size: 0.9rem;
  color: #6c757d;
}

.meta-info {
  display: inline-block;
}

.meta-link {
  color: #667eea;
  text-decoration: none;
}

.meta-link:hover {
  text-decoration: underline;
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.action-btn.show {
  background: #28a745;
  color: white;
}

.action-btn.hide {
  background: #ffc107;
  color: #212529;
}

.action-btn.delete {
  background: #dc3545;
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.gallery-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.gallery-item:hover {
  background: #f8f9fa;
}

.gallery-item.selected {
  background: #e3f2fd;
  border-color: #667eea;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
}

.item-info h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1.1rem;
}

.item-info p {
  margin: 0 0 10px 0;
  color: #495057;
  line-height: 1.5;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 30px;
  padding: 20px;
}

.page-btn {
  padding: 10px 20px;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #6c757d;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 10px;
  }
  
  .search-box {
    min-width: auto;
  }
  
  .filter-controls,
  .batch-actions {
    flex-wrap: wrap;
  }
  
  .content-item,
  .gallery-item {
    flex-direction: column;
    gap: 10px;
  }
  
  .item-actions {
    flex-direction: row;
    justify-content: flex-start;
  }
  
  .content-type-tabs {
    flex-wrap: wrap;
  }
}
</style> 
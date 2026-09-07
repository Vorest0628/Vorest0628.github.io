<template>
  <div class="admin-comment-manager">
    <div class="manager-header">
      <h2>评论管理</h2>
      <div class="stats">
        <span class="total-count">总评论: {{ totalCount }}</span>
      </div>
    </div>

    <!-- 筛选选项 -->
    <div class="filter-bar">
      <select
        v-model="sourceFilter"
        @change="getComments"
      >
        <option value="">
          全部来源
        </option>
        <option value="blog">
          博客
        </option>
        <option value="comment">
          评论区
        </option>
        <option value="General">
          留言板
        </option>
      </select>
      <input 
        v-model="searchQuery" 
        placeholder="搜索评论内容或用户..." 
        @input="getComments"
      >
    </div>

    <!-- 评论列表 -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <p>正在加载评论...</p>
    </div>
    
    <div
      v-else-if="error"
      class="error-state"
    >
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button
        class="retry-btn"
        @click="getComments"
      >
        重试
      </button>
    </div>
    
    <div
      v-else
      class="comment-list"
    >
      <div
        v-for="comment in comments"
        :key="comment.id || comment._id"
        class="comment-card"
      >
        <div class="comment-info">
          <div class="comment-header">
            <div class="user-info">
              <span class="commenter">{{ comment.author?.username || comment.author || '匿名用户' }}</span>
            </div>
            <div class="comment-source">
              <span class="source-label">来源:</span>
              <button 
                class="source-link" 
                :title="`点击跳转到${getFullSourceText(comment)}`"
                @click="jumpToSource(comment)"
              >
                {{ getFullSourceText(comment) }}
              </button>
            </div>
          </div>
          
          <div class="comment-meta">
            <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
            <span
              v-if="comment.parentComment"
              class="reply-indicator"
            >回复评论</span>
          </div>
          
          <div class="comment-content">
            {{ comment.content }}
          </div>
          
          <!-- 如果是回复，显示原评论 -->
          <div
            v-if="comment.parentComment"
            class="parent-comment"
          >
            <span class="parent-label">回复:</span>
            <span class="parent-content">{{ comment.parentComment.content }}</span>
          </div>
        </div>

        <div class="comment-actions">
          <!-- 点赞显示 -->
          <span class="like-count">{{ comment.likeCount || 0 }} ❤️</span>
          <!-- 公开/私有切换按钮 -->
          <button 
            class="visibility-btn"
            :class="{ private: !comment.isPublic }"
            @click="toggleVisibility(comment)"
          >
            {{ comment.isPublic ? '🔒 设为私有' : '🔓 设为公开' }}
          </button>
          <button 
            class="jump-btn" 
            @click="jumpToSource(comment)"
          >
            🔗 跳转
          </button>
          <button 
            class="delete-btn" 
            @click="deleteComment(comment.id || comment._id)"
          >
            🗑️ 删除
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-if="!loading && !error && comments.length === 0"
      class="empty-state"
    >
      <h3>暂无评论</h3>
      <p>还没有任何评论数据</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi } from '../../../api/admin'

const router = useRouter()


const comments = ref([])
const statusFilter = ref('')
const sourceFilter = ref('')
const searchQuery = ref('')
const loading = ref(false)
const error = ref('')

// 计算统计数据
const totalCount = computed(() => comments.value.length)

// 获取评论列表
const getComments = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const params = {}
    if (statusFilter.value) params.status = statusFilter.value
    if (sourceFilter.value) params.targetType = sourceFilter.value
    if (searchQuery.value) params.search = searchQuery.value
    
    const response = await adminApi.getAllComments(params)
    
    if (response.success) {
      comments.value = response.data.comments || response.data || []
    } else {
      throw new Error(response.message || '获取评论列表失败')
    }
  } catch (err) {
    console.error('获取评论列表失败:', err)
    error.value = err.message || '获取评论列表失败，请稍后重试'
    comments.value = []
  } finally {
    loading.value = false
  }
}

// 删除评论
const deleteComment = async (id) => {
  if (!confirm('确定要删除这条评论吗？此操作不可恢复。')) return
  
  try {
    const response = await adminApi.deleteComment(id)
    if (response.success) {
      await getComments()
      alert('评论已删除!')
    }
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败: ' + (error.response?.data?.message || error.message))
  }
}

// 切换评论可见性
const toggleVisibility = async (comment) => {
  try {
    const newVisibility = !comment.isPublic
    const response = await adminApi.updateCommentVisibility((comment.id || comment._id), newVisibility)
    if (response.success) {
      comment.isPublic = newVisibility
      alert(`评论已${newVisibility ? '设为公开' : '设为私有'}`)
    }
  } catch (error) {
    console.error('更新可见性失败:', error)
    alert('操作失败: ' + (error.response?.data?.message || error.message))
  }
}

// 跳转到评论来源
const jumpToSource = (comment) => {
  console.log('跳转评论来源:', comment) // 调试信息
  
  if (comment.targetType === 'blog' || comment.targetType === 'Blog') {
    if (comment.targetId) {
      // 跳转到博客详情页
      const blogId = typeof comment.targetId === 'object' ? (comment.targetId.id || comment.targetId._id) : comment.targetId
      router.push(`/blog/${blogId}`)
    } else {
      alert('博客ID缺失，无法跳转')
    }
  } else if (comment.targetType === 'comment') {
    // 跳转到评论区
    router.push('/comments')
  } else if (comment.targetType === 'document' || comment.targetType === 'Document') {
    // 跳转到文档库，并设置搜索关键词
    if (comment.targetTitle) {
      router.push({
        path: '/documents',
        query: { search: comment.targetTitle }
      })
    } else {
      router.push('/documents')
    }
  } else if (comment.targetType === 'General') {
    // 跳转到留言板
    router.push('/comments')
  } else if (comment.targetType === 'gallery' || comment.targetType === 'Gallery') {
    // 跳转到图库
    router.push('/gallery')
  } else {
    console.warn('未知的目标类型:', comment.targetType, comment)
    alert('无法确定跳转目标，可能是数据不完整')
  }
}

// 获取来源文本
const getSourceText = (targetType) => {
  const typeMap = {
    blog: '博客',
    Blog: '博客', 
    comment: '评论区',
    General: '留言板'
  }
  return typeMap[targetType] || '其他'
}

// 获取完整的来源显示文本
const getFullSourceText = (comment) => {
  const sourceType = getSourceText(comment.targetType)
  const title = comment.targetTitle || ''
  
  if (comment.targetType === 'blog' || comment.targetType === 'Blog') {
    return title ? `博客：${title}` : '博客'
  } else if (comment.targetType === 'General') {
    return '留言板'
  } else if (title) {
    return `${sourceType}：${title}`
  } else {
    return sourceType
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '未知时间'
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  getComments()
})
</script>

<style scoped>
.admin-comment-manager {
  height: 100%;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.manager-header h2 {
  color: var(--summer-text-main);
  font-family: var(--summer-font-display);
  margin: 0;
}

.stats {
  display: flex;
  gap: 1rem;
}

.total-count, .pending-count {
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 500;
}

.total-count {
  background: var(--color-tag-bg);
  color: var(--color-tag-text);
}

.pending-count {
  background: rgba(255, 170, 51, 0.18);
  color: #b26a00;
}

.filter-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-bar select,
.filter-bar input {
  padding: 0.5rem;
  border: 1px solid rgba(45, 180, 255, 0.35);
  background: rgba(255, 255, 255, 0.65);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--summer-text-main);
}

.filter-bar select:focus,
.filter-bar input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(45, 180, 255, 0.18);
  outline: none;
}

.filter-bar input::placeholder {
  color: var(--summer-text-muted);
}

.filter-bar input {
  min-width: 200px;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--summer-text-subtle);
}

.retry-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s;
}

.retry-btn:hover {
  box-shadow: 0 6px 16px rgba(45, 180, 255, 0.35);
  transform: translateY(-1px);
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-card {
  background: var(--color-surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: 0 10px 24px rgba(40, 101, 140, 0.11);
  transition: transform 0.2s;
}

.comment-card:hover {
  transform: translateY(-2px);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.commenter {
  font-weight: 600;
  color: var(--summer-text-main);
}

.comment-source {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.source-label {
  font-size: 0.9rem;
  color: var(--summer-text-subtle);
}

.source-link {
  background: none;
  border: none;
  color: var(--color-primary-dark);
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
}

.source-link:hover {
  color: var(--color-primary);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.pending {
  background: rgba(255, 170, 51, 0.18);
  color: #b26a00;
}

.status-badge.approved {
  background: rgba(0, 200, 83, 0.15);
  color: #00913f;
}

.status-badge.rejected {
  background: rgba(230, 57, 70, 0.15);
  color: #c1121f;
}

.comment-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  color: var(--summer-text-subtle);
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.reply-indicator {
  background: var(--color-tag-bg);
  color: var(--color-tag-text);
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
  font-size: 0.8rem;
}

.comment-content {
  color: var(--summer-text-main);
  line-height: 1.5;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(45, 180, 255, 0.08);
  border-radius: 8px;
  border-left: 3px solid var(--color-primary);
}

.parent-comment {
  background: rgba(255, 170, 51, 0.15);
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border-left: 3px solid var(--color-secondary);
}

.parent-label {
  font-weight: 600;
  color: #b26a00;
  margin-right: 0.5rem;
}

.parent-content {
  color: #b26a00;
  font-style: italic;
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(45, 180, 255, 0.15);
  flex-wrap: wrap;
  align-items: center;
}

.like-count {
  color: #e63946;
  font-weight: 500;
  font-size: 0.9rem;
  margin-right: 0.5rem;
}

.approve-btn, .reject-btn, .jump-btn, .delete-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.8rem;
  transition: all 0.3s;
}

.approve-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
}

.approve-btn:hover {
  box-shadow: 0 6px 16px rgba(45, 180, 255, 0.35);
  transform: translateY(-1px);
}

.reject-btn {
  background: linear-gradient(135deg, #ff6b6b, #e63946);
  color: #fff;
}

.reject-btn:hover {
  box-shadow: 0 6px 16px rgba(230, 57, 70, 0.35);
  transform: translateY(-1px);
}

.jump-btn {
  background: rgba(255, 255, 255, 0.65);
  color: var(--summer-text-subtle);
  border: 1px solid rgba(45, 180, 255, 0.3);
}

.jump-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
  transform: translateY(-1px);
}

.delete-btn {
  background: linear-gradient(135deg, #ff6b6b, #e63946);
  color: #fff;
}

.delete-btn:hover {
  box-shadow: 0 6px 16px rgba(230, 57, 70, 0.35);
  transform: translateY(-1px);
}

.visibility-btn {
  background: rgba(255, 255, 255, 0.65);
  color: var(--summer-text-subtle);
  border: 1px solid rgba(45, 180, 255, 0.3);
}

.visibility-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
  transform: translateY(-1px);
}

.visibility-btn.private {
  background: linear-gradient(135deg, #ff6b6b, #e63946);
  color: #fff;
  border: none;
}

.visibility-btn.private:hover {
  box-shadow: 0 6px 16px rgba(230, 57, 70, 0.35);
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .manager-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .filter-bar {
    flex-direction: column;
  }
  
  .filter-bar input {
    min-width: auto;
  }
  
  .comment-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .comment-actions {
    justify-content: center;
  }
}
</style> 
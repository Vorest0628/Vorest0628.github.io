<template>
  <div class="user-comment-manager">
    <div class="manager-header">
      <h2>我的评论</h2>
      <p>管理您发表的评论</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadComments" class="retry-btn">重试</button>
    </div>

    <!-- 评论列表 -->
    <div v-else class="comments-list">
      <div v-for="comment in comments" :key="comment.id || comment._id" class="comment-card">
        <div class="comment-header">
          <div class="comment-meta">
            <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
            <span :class="['status-badge', comment.isPublic ? 'public' : 'private']">
              {{ comment.isPublic ? '公开' : '私有' }}
            </span>
            <div class="comment-source">
              <span class="source-label">来源:</span>
              <button 
                @click="jumpToSource(comment)" 
                class="source-link"
                :title="`点击跳转到${getFullSourceText(comment)}`"
              >
                {{ getFullSourceText(comment) }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="comment-content">
          {{ comment.content }}
        </div>
        
        <!-- 如果是回复，显示原评论 -->
        <div v-if="comment.parentComment" class="parent-comment">
          <span class="parent-label">回复:</span>
          <span class="parent-content">{{ comment.parentComment.content }}</span>
        </div>
        
        <div class="comment-actions">
          <!-- 点赞显示 -->
          <span class="like-count">{{ comment.likeCount || 0 }} ❤️</span>
          <button @click="editComment(comment)" class="edit-btn">编辑</button>
          <button @click="togglePublic(comment)" class="toggle-btn">
            {{ comment.isPublic ? '设为私有' : '设为公开' }}
          </button>
          <button @click="jumpToSource(comment)" class="jump-btn">跳转到来源</button>
          <button @click="deleteComment(comment.id || comment._id)" class="delete-btn">删除</button>
        </div>
      </div>
      
      <div v-if="comments.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>还没有评论</h3>
        <p>去发表您的第一条评论吧！</p>
        <button @click="goToComments" class="comment-btn">立即评论</button>
      </div>
    </div>

    <!-- 编辑模态框 -->
    <div v-if="editingComment" class="modal-overlay" @click="closeEdit">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑评论</h3>
          <button @click="closeEdit" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveEdit">
            <div class="form-group">
              <label>评论内容</label>
              <textarea v-model="editForm.content" rows="4" required></textarea>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="editForm.isPublic" type="checkbox" />
                公开评论
              </label>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeEdit" class="cancel-btn">取消</button>
              <button type="submit" class="save-btn" :disabled="saving">
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/user'

const router = useRouter()
const comments = ref([])
const editingComment = ref(null)
const editForm = ref({})
const loading = ref(false)
const error = ref('')
const saving = ref(false)

// 加载用户评论
const loadComments = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await userApi.getMyComments()
    if (response.success) {
      comments.value = response.data.comments || []
    } else {
      throw new Error(response.message || '获取评论失败')
    }
  } catch (err) {
    console.error('加载评论失败:', err)
    error.value = err.message || '加载评论失败，请稍后重试'
    
    // 尝试调用真实API失败时，根据具体错误决定是否显示数据
    if (err.response && err.response.status === 404) {
      // 如果是404错误，可能是API端点不存在，显示空数据
      comments.value = []
    } else {
      // 其他错误，显示模拟数据用于开发测试
      comments.value = [
        {
          _id: '1',
          content: '这是一条博客评论测试',
          isPublic: true,
          targetType: 'Blog',
          targetId: 'blog123',
          targetTitle: '前端开发技巧分享',
          createdAt: new Date().toISOString(),
          parentComment: null
        },
        {
          _id: '2',
          content: '这是对另一条评论的回复',
          isPublic: true,
          targetType: 'Blog',
          targetId: 'blog456',
          targetTitle: 'Vue3 开发实战',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          parentComment: {
            content: '原始评论内容'
          }
        },
        {
          _id: '3',
          content: '文档评论测试',
          isPublic: true,
          targetType: 'Document',
          targetId: 'doc789',
          targetTitle: '开发文档说明',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          parentComment: null
        }
      ]
    }
  } finally {
    loading.value = false
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
    document: '文档',
    Document: '文档',
    gallery: '图库',
    Gallery: '图库',
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

// 编辑评论
const editComment = (comment) => {
  editingComment.value = comment
  editForm.value = { 
    content: comment.content,
    isPublic: comment.isPublic
  }
}

// 关闭编辑
const closeEdit = () => {
  editingComment.value = null
  editForm.value = {}
}

// 保存编辑
const saveEdit = async () => {
  if (!editingComment.value) return
  
  saving.value = true
  try {
    const response = await userApi.updateMyComment((editingComment.value.id || editingComment.value._id), editForm.value)
    if (response.success) {
      // 更新本地数据
      const index = comments.value.findIndex(c => (c.id || c._id) === (editingComment.value.id || editingComment.value._id))
      if (index !== -1) {
        comments.value[index] = { ...comments.value[index], ...editForm.value }
      }
      closeEdit()
      alert('评论更新成功！')
    } else {
      throw new Error(response.message || '更新失败')
    }
  } catch (err) {
    console.error('保存失败:', err)
    alert('保存失败：' + err.message)
  } finally {
    saving.value = false
  }
}

// 切换公开状态
const togglePublic = async (comment) => {
  try {
    const response = await userApi.updateMyComment((comment.id || comment._id), { isPublic: !comment.isPublic })
    if (response.success) {
      comment.isPublic = !comment.isPublic
      alert(`评论已${comment.isPublic ? '公开' : '设为私有'}`)
    } else {
      throw new Error(response.message || '更新失败')
    }
  } catch (err) {
    console.error('切换状态失败:', err)
    alert('操作失败：' + err.message)
  }
}

// 删除评论
const deleteComment = async (commentId) => {
  if (!confirm('确定要删除这条评论吗？此操作无法撤销。')) return
  
  try {
    const response = await userApi.deleteMyComment(commentId)
    if (response.success) {
      comments.value = comments.value.filter(c => (c.id || c._id) !== commentId)
      alert('评论删除成功！')
    } else {
      throw new Error(response.message || '删除失败')
    }
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败：' + err.message)
  }
}

// 跳转到评论页面
const goToComments = () => {
  router.push('/comments')
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '未知时间'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadComments()
})
</script>

<style scoped>
.user-comment-manager {
  padding: 20px;
}

.manager-header {
  margin-bottom: 30px;
  text-align: center;
}

.manager-header h2 {
  color: #333;
  margin-bottom: 10px;
  font-size: 1.8rem;
}

.manager-header p {
  color: #666;
  font-size: 1rem;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px;
}

.retry-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: #36d1dc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #2bb8c4;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.3s ease;
}

.comment-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.comment-header {
  margin-bottom: 15px;
}

.comment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.comment-time {
  color: #666;
  font-size: 0.9rem;
}

.status-badge {
  padding: 2px 8px;
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

.comment-source {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.source-label {
  font-size: 0.9rem;
  color: #666;
}

.source-link {
  background: none;
  border: none;
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
}

.source-link:hover {
  color: #0056b3;
}

.comment-content {
  margin-bottom: 15px;
  line-height: 1.6;
  color: #333;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #007bff;
}

.parent-comment {
  background: #fff3cd;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border-left: 3px solid #ffc107;
}

.parent-label {
  font-weight: 600;
  color: #856404;
  margin-right: 0.5rem;
}

.parent-content {
  color: #856404;
  font-style: italic;
}

.comment-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.like-count {
  color: #e74c3c;
  font-weight: 500;
  font-size: 0.9rem;
}

.comment-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.edit-btn {
  background: #ffc107;
  color: #212529;
}

.edit-btn:hover {
  background: #e0a800;
}

.toggle-btn {
  background: #17a2b8;
  color: white;
}

.toggle-btn:hover {
  background: #138496;
}

.jump-btn {
  background: #28a745;
  color: white;
}

.jump-btn:hover {
  background: #218838;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover {
  background: #c82333;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.comment-btn {
  margin-top: 20px;
  padding: 12px 24px;
  background: #36d1dc;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

.comment-btn:hover {
  background: #2bb8c4;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  box-sizing: border-box;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  margin-bottom: 0 !important;
}

.checkbox-label input {
  width: auto;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #5a6268;
}

.save-btn {
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn:hover {
  background: #218838;
}

.save-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-comment-manager {
    padding: 15px;
  }
  
  .comment-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .comment-actions {
    flex-direction: column;
  }
  
  .comment-actions button {
    width: 100%;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
}
</style> 
<!-- 
  Comments页面组件
  功能：
  1. 展示评论列表 (支持嵌套回复)
  2. 发表新评论
  3. 回复评论
  4. 评论管理 (删除)
-->
<template>
  <div class="comments">
    <h1>留言板</h1>
    <p class="page-description">欢迎在这里留下您的足迹，分享想法和建议～</p>
    
    <!-- 留言统计 -->
    <div class="comment-stats">
      <div class="stat-item">
        <span class="stat-number">{{ topLevelCommentCount }}</span>
        <span class="stat-label">条留言</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ totalReplies }}</span>
        <span class="stat-label">条回复</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ uniqueUsers }}</span>
        <span class="stat-label">位访客</span>
      </div>
    </div>

    <!-- 发表留言表单 -->
    <div class="comment-form">
      <h3>发表留言</h3>
      <div v-if="!authStore.isAuthenticated" class="login-prompt">
        <p>请先<router-link to="/auth">登录</router-link>后再发表留言</p>
      </div>
      <form v-else @submit.prevent="submitComment">
        <div class="user-info">
          <span class="current-user">当前用户: {{ authStore.user.username }}</span>
        </div>
        <div class="form-row">
          <textarea 
            v-model="newComment.content" 
            placeholder="写下你的想法和建议..." 
            required 
            rows="4"
            class="form-textarea"
          ></textarea>
        </div>
        <div class="comment-options">
          <label class="checkbox-label">
            <input 
              v-model="newComment.isPublic" 
              type="checkbox" 
              class="checkbox-input"
            />
            <span class="checkbox-text">公开留言</span>
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            {{ isSubmitting ? '发布中...' : '发布留言' }}
          </button>
        </div>
      </form>
    </div>

    <!-- 评论列表 -->
    <div v-if="loading" class="loading-state">
      <p>正在加载评论...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button @click="getComments" class="retry-btn">重试</button>
    </div>
    
    <div v-else class="comment-list">
      <CommentNode
        v-for="comment in comments"
        :key="comment.id || comment._id"
        :comment="comment"
        @comment-deleted="handleCommentDeleted"
        @comment-added="handleCommentAdded"
      />
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && comments.length === 0" class="empty-state">
      <h3>还没有留言</h3>
      <p>成为第一个发表留言的人吧！</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { commentApi } from '@/api/comment'
import CommentNode from '@/components/CommentNode.vue'

const authStore = useAuthStore()

// 响应式数据
const comments = ref([])
const loading = ref(false)
const error = ref('')
const newComment = ref({ 
  content: '',
  isPublic: true // 默认公开
})
const isSubmitting = ref(false)

// 计算属性
const topLevelCommentCount = computed(() => comments.value.length);

const totalReplies = computed(() => {
  let count = 0;
  const countReplies = (comment) => {
    if (comment.replies && comment.replies.length > 0) {
      count += comment.replies.length;
      comment.replies.forEach(countReplies);
    }
  };
  comments.value.forEach(countReplies);
  return count;
});

const uniqueUsers = computed(() => {
  const users = new Set();
  const addUser = (comment) => {
    if (comment.author && comment.author.username) {
      users.add(comment.author.username);
    }
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(addUser);
    }
  };
  comments.value.forEach(addUser);
  return users.size;
});

// 方法
const getComments = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await commentApi.getTargetComments('General', '000000000000000000000001', {
      page: 1,
      limit: 100, // 获取所有顶级评论
      sortBy: 'createdAt',
      order: 'desc'
    })
    if (response.success) {
      comments.value = response.data
    } else {
      throw new Error(response.message || '获取留言失败')
    }
  } catch (err) {
    console.error('获取留言失败:', err)
    error.value = err.message || '获取留言失败，请稍后重试'
    comments.value = []
  } finally {
    loading.value = false
  }
}

const submitComment = async () => {
  if (!authStore.isAuthenticated) {
    alert('请先登录后再发表留言');
    return;
  }
  if (!newComment.value.content.trim()) {
    alert('请输入留言内容');
    return;
  }

  isSubmitting.value = true
  try {
    const commentData = {
      content: newComment.value.content.trim(),
      targetType: 'General',
      targetId: '000000000000000000000001', // 固定的留言板ID
      parentComment: null,
      isPublic: newComment.value.isPublic
    }
    const response = await commentApi.createComment(commentData)
    if (response.success) {
      handleCommentAdded(response.data);
      newComment.value.content = '';
      newComment.value.isPublic = true; // 重置为默认公开
      alert('留言发布成功！');
    } else {
      throw new Error(response.message || '发布留言失败')
    }
  } catch (error) {
    console.error('提交留言失败:', error)
    alert('发布留言失败: ' + (error.message || '请稍后重试'))
  } finally {
    isSubmitting.value = false
  }
}

const handleCommentAdded = (newComment) => {
  if (!newComment.parentComment) {
    comments.value.unshift(newComment);
  } else {
    const addReply = (comments, reply) => {
      for (const comment of comments) {
        if ((comment.id || comment._id) === reply.parentComment) {
          if (!comment.replies) comment.replies = [];
          comment.replies.push(reply);
          return true;
        }
        if (comment.replies && addReply(comment.replies, reply)) {
          return true;
        }
      }
      return false;
    };
    addReply(comments.value, newComment);
  }
};

const handleCommentDeleted = (commentId) => {
  const removeComment = (comments, id) => {
    for (let i = comments.length - 1; i >= 0; i--) {
      if ((comments[i].id || comments[i]._id) === id) {
        comments.splice(i, 1);
        return true;
      }
      if (comments[i].replies && removeComment(comments[i].replies, id)) {
        return true;
      }
    }
    return false;
  };
  removeComment(comments.value, commentId);
};

// 组件挂载时初始化
onMounted(async () => {
  await authStore.initAuth()
  await getComments()
})
</script>

<style scoped>
.comments {
  padding: 30px;
  min-height: 600px;
}

.page-description {
  color: #666;
  font-size: 1rem;
  margin-bottom: 2rem;
  text-align: center;
  font-style: italic;
  width: 100%;
  background-color: transparent;
  line-height: 1.6;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem;
}

.comment-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 5px;
  border: 1px solid #eee;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: skyblue;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.comment-form {
  background-color: #f8f8f8;
  padding: 20px;
  border-radius: 5px;
  margin-bottom: 30px;
  border: 1px solid #eee;
}

.comment-form h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1.3rem;
}

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.form-input {
  flex: 1;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input.full-width {
  width: 100%;
}

.form-input:focus {
  outline: none;
  border-color: skyblue;
}

.form-textarea {
  width: 100%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-textarea:focus {
  outline: none;
  border-color: skyblue;
}

.form-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.submit-btn {
  background-color: skyblue;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background-color: powderblue;
}

.submit-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.comment-options {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #555;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-text {
  user-select: none;
}

.submit-btn.small {
  padding: 6px 12px;
}

.login-prompt {
  text-align: center;
  padding: 20px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 5px;
  margin-bottom: 15px;
}

.login-prompt p {
  color: #856404;
  margin-bottom: 15px;
  font-size: 1rem;
}

.login-btn {
  background-color: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
  margin-right: 10px;
}

.login-btn:hover {
  background-color: #5a6fd8;
}

.user-info {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #e8f5e8;
  border: 1px solid #c3e6c3;
  border-radius: 5px;
}

.current-user {
  color: #2d5a2d;
  font-weight: 500;
  font-size: 0.9rem;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.cancel-btn:hover {
  background-color: #545b62;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.comment-item {
  background-color: #f8f8f8;
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid #eee;
}

.comment-main {
  padding: 15px;
}

.comment-content {
  width: 100%;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  margin: 0;
  font-size: 1rem;
  color: #333;
}

.comment-author a {
  color: skyblue;
  text-decoration: none;
}

.comment-author a:hover {
  text-decoration: underline;
}

.comment-time {
  color: #666;
  font-size: 0.8rem;
}

.comment-text {
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
}

.comment-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 10px;
  transition: all 0.3s;
}

.action-btn:hover {
  background-color: #eee;
  color: #333;
}

.action-btn.liked {
  color: #e74c3c;
}

.action-btn.delete-btn {
  color: #e74c3c;
}

.action-btn.delete-btn:hover {
  background-color: #fee;
}

.reply-form {
  background-color: #eee;
  padding: 15px;
  border-top: 1px solid #ddd;
}

.replies {
  background-color: #eee;
  padding: 0 15px 15px;
}

.reply-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #ddd;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-item .comment-author {
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  background-color: #f8f8f8;
  border-radius: 5px;
  border: 1px solid #eee;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 10px;
}

.empty-state p {
  color: #666;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
  margin-bottom: 30px;
}

.loading-state p {
  font-size: 1.1rem;
  color: skyblue;
}

.error-state h3 {
  color: #e74c3c;
  margin-bottom: 10px;
}

.error-state p {
  margin-bottom: 20px;
  color: #666;
}

.retry-btn {
  padding: 10px 20px;
  background-color: skyblue;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.retry-btn:hover {
  background-color: powderblue;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comments {
    padding: 20px;
  }
  
  h1 {
    font-size: 1.8rem;
  }
  
  .comment-stats {
    flex-direction: column;
    gap: 15px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .comment-main, .reply-item {
    gap: 8px;
  }
  
  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .comment-actions {
    flex-wrap: wrap;
  }
}
</style>
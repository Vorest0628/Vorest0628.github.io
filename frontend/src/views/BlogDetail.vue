<!-- 
  BlogDetail页面组件
  功能：
  1. 展示博客文章详情
  2. 文章内容渲染
  3. 评论系统 (支持嵌套回复和删除)
-->
<template>
  <div class="blog-detail">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="not-found">
      <h2>加载文章失败</h2>
      <p>{{ error }}</p>
      <router-link to="/blog" class="back-btn">返回博客列表</router-link>
    </div>

    <!-- 文章不存在 -->
    <div v-else-if="!article" class="not-found">
      <h2>文章不存在</h2>
      <p>抱歉，找不到您要查看的文章。</p>
      <router-link to="/blog" class="back-btn">返回博客列表</router-link>
    </div>

    <!-- 文章内容 -->
    <article v-else class="article">
      <!-- 文章头部 -->
      <div v-if="coverSrc" class="article-cover">
          <img :src="coverSrc" alt="封面图" loading="lazy" decoding="async" @error="onDetailCoverError" />
        </div> 
      <header class="article-header">
        
        <div class="article-info">
          <h1>{{ article.title }}</h1>
          <div class="article-meta">
            <div class="meta-info">
              <span class="date">发布时间：{{ formatDate(article.date) }}</span>
              <span class="category">分类：{{ article.category }}</span>
              <span class="views">阅读：{{ article.viewCount }} 次</span>
            </div>
            <div class="article-tags">
              <span 
                v-for="tag in article.tags" 
                :key="tag"
                class="tag"
              >
                # {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </header>

      <!-- 文章内容 -->
      <div class="article-content" v-html="renderedContent"></div>

      <!-- 文章底部 -->
      <footer class="article-footer">
        <div class="article-actions">
          <button @click="toggleLike" class="action-btn like-btn" :class="{ liked: isLiked }">
            {{ isLiked ? '❤️' : '🤍' }} {{ article.likeCount }}
          </button>
          <button @click="shareArticle" class="action-btn share-btn">
            📤 分享
          </button>
          <button @click="scrollToComments" class="action-btn comment-btn">
            💬 评论 ({{ commentCount }})
          </button>
        </div>
      </footer>
    </article>

    <!-- 评论区域 -->
    <section v-if="article" class="comments-section" ref="commentsSection">
      <h3>评论 ({{ commentCount }})</h3>
      
      <!-- 发表评论 -->
      <div class="comment-form">
        <h4>发表评论</h4>
        <div v-if="!authStore.isAuthenticated" class="login-prompt">
          <p>请先<router-link to="/auth">登录</router-link>后再发表评论</p>
        </div>
        <form v-else @submit.prevent="submitComment">
          <div class="form-row">
            <textarea 
              v-model="newComment.content" 
              placeholder="写下你的评论..." 
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
              <span class="checkbox-text">公开评论</span>
            </label>
          </div>
          <div class="form-actions">
            <button type="submit" class="submit-btn" :disabled="isSubmittingComment">
              {{ isSubmittingComment ? '发布中...' : '发布评论' }}
            </button>
          </div>
        </form>
      </div>

      <!-- 评论列表 -->
      <div class="comments-list">
        <div v-if="commentsLoading" class="loading-state">
          <p>正在加载评论...</p>
        </div>
        <CommentNode
          v-else
          v-for="comment in comments"
          :key="comment.id || comment._id"
          :comment="comment"
          @comment-deleted="handleCommentDeleted"
          @comment-added="handleCommentAdded"
        />
      </div>

      <!-- 评论空状态 -->
      <div v-if="!commentsLoading && comments.length === 0" class="comments-empty">
        <p>还没有评论，快来抢沙发吧！</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { blogApi } from '@/api/blog'
import { commentApi } from '@/api/comment'
import { format } from 'date-fns'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useAuthStore } from '@/store/modules/auth'
import CommentNode from '@/components/CommentNode.vue'

const route = useRoute()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(true)
const article = ref(null)
const error = ref(null)
const isLiked = ref(false)
const comments = ref([])
const commentsLoading = ref(false)
const commentsSection = ref(null)

// 评论相关
const newComment = ref({
  content: '',
  isPublic: true // 默认公开
})
const isSubmittingComment = ref(false)

const formatDate = (dateString) => {
  if (!dateString) return ''
  return format(new Date(dateString), 'yyyy年MM月dd日')
}

// 配置marked renderer
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
    // 处理相对路径
    src = ASSET_BASE ? `${ASSET_BASE.replace(/\/$/, '')}/${String(href).replace(/^\//, '')}` : href
  }
  // 对于 /api/blog/ 路径，生产环境强制走 API 子域，避免主站路由兼容性问题
  if (isApiRoute && API_ORIGIN) {
    src = `${API_ORIGIN}${href}`
  }
  // 绝对 URL 直接使用
  
  const t = title ? ` title="${title}"` : ''
  return `<img src="${src}" alt="${text || ''}"${t} loading="lazy" decoding="async">`
}
marked.setOptions({ renderer })

const renderedContent = computed(() => {
  if (!article.value?.content) return ''
  const html = marked(article.value.content)
  return DOMPurify.sanitize(html)
});

// 详情封面地址解析与错误日志
const coverSrc = computed(() => {
  const href = article.value?.coverImage
  if (!href) return ''
  const isAbs = /^(https?:|data:)/i.test(href)
  const isApiRoute = /^\/api\/blog\//i.test(href)
  if (isAbs) return href
  if (isApiRoute && API_ORIGIN) return `${API_ORIGIN}${href}`
  return ASSET_BASE ? `${ASSET_BASE.replace(/\/$/, '')}/${String(href).replace(/^\//, '')}` : href
})
const onDetailCoverError = () => {
  console.error('文章封面图加载失败或未设置:', article.value?.id, article.value?.coverImage)
}

// 计算总评论数 (包括回复)
const commentCount = computed(() => {
  let count = 0;
  const countReplies = (comment) => {
    count++;
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(countReplies);
    }
  };
  comments.value.forEach(countReplies);
  return count;
});


// 更新页面 meta description
const updateMetaDescription = (description) => {
  // 查找或创建 meta description 标签
  let metaDesc = document.querySelector('meta[name="description"]')
  if (!metaDesc) {
    metaDesc = document.createElement('meta')
    metaDesc.setAttribute('name', 'description')
    document.head.appendChild(metaDesc)
  }
  // 设置内容，限制长度为 160 字符以符合 SEO 最佳实践
  const content = description ? description.substring(0, 160) : '个人网站博客文章'
  metaDesc.setAttribute('content', content)
}

// 加载文章数据
const loadArticle = async (articleId) => {
  loading.value = true
  error.value = null
  article.value = null
  comments.value = []

  try {
    const res = await blogApi.getBlogById(articleId)
    
    if (res.success) {
      article.value = res.data
      // 更新页面的 meta description
      if (article.value.excerpt) {
        updateMetaDescription(article.value.excerpt)
      }
      await loadComments(articleId)
      await checkLikeStatus() // 检查点赞状态
    } else {
      throw new Error(res.message || '文章加载失败')
    }
  } catch (err) {
    console.error('加载文章详情失败:', err)
    error.value = err.message || '无法找到指定的文章，它可能已被删除或不存在。'
  } finally {
    loading.value = false
  }
}

// 加载评论
const loadComments = async (articleId) => {
  commentsLoading.value = true
  try {
    // 后端返回的数据结构是 { success, data, pagination }, data是数组
    const res = await commentApi.getTargetComments('Blog', articleId)
    if (res.success) {
      comments.value = res.data
    }
  } catch (err) {
    console.error('加载评论失败:', err)
  } finally {
    commentsLoading.value = false
  }
}

// 提交顶级评论
const submitComment = async () => {
  if (isSubmittingComment.value || !article.value) return
  isSubmittingComment.value = true

  try {
    const commentData = {
      content: newComment.value.content,
      targetType: 'Blog',
      targetId: article.value.id, // 修复：使用id而不是_id
      parentComment: null,
      isPublic: newComment.value.isPublic
    }
    
    const res = await commentApi.createComment(commentData)
    
    if (res.success) {
      handleCommentAdded(res.data)
      newComment.value.content = ''
      newComment.value.isPublic = true // 重置为默认公开
      alert('评论发表成功！')
    } else {
      throw new Error(res.message || '评论发布失败')
    }
  } catch (err) {
    console.error('发布评论失败:', err)
    alert(`评论发布失败: ${err.message}`)
  } finally {
    isSubmittingComment.value = false
  }
}

// 处理评论添加（顶级或回复）
const handleCommentAdded = (newComment) => {
  if (!newComment.parentComment) {
    // Add as a new top-level comment
    comments.value.unshift(newComment);
  } else {
    // Add as a reply
    const addReply = (comments, reply) => {
      for (const comment of comments) {
        if ((comment.id || comment._id) === reply.parentComment) {
          if (!comment.replies) {
            comment.replies = [];
          }
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

// 处理评论删除
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


// 滚动到评论区
const scrollToComments = () => {
  commentsSection.value?.scrollIntoView({ behavior: 'smooth' })
}

// 检查点赞状态
const checkLikeStatus = async () => {
  if (!article.value) return
  
  try {
    const res = await blogApi.checkBlogLikeStatus(article.value.id)
    if (res.success) {
      isLiked.value = res.data.isLiked
    }
  } catch (err) {
    console.error('检查点赞状态失败:', err)
    // 如果检查失败，默认设置为未点赞状态
    isLiked.value = false
  }
}

// 点赞/取消点赞文章
const toggleLike = async () => {
  if (!authStore.isAuthenticated) {
    alert('请先登录后再点赞')
    return
  }
  
  if (!article.value) return
  
  try {
    if (isLiked.value) {
      // 取消点赞
      const res = await blogApi.unlikeBlog(article.value.id)
      if (res.success) {
        isLiked.value = false
        article.value.likeCount = res.data.likeCount
      }
    } else {
      // 点赞
      const res = await blogApi.likeBlog(article.value.id)
      if (res.success) {
        isLiked.value = true
        article.value.likeCount = res.data.likeCount
      }
    }
  } catch (err) {
    console.error('点赞操作失败:', err)
    alert(err.response?.data?.message || '操作失败，请重试')
  }
}

// 分享文章 (模拟)
const shareArticle = () => {
  if (navigator.share) {
    navigator.share({
      title: article.value.title,
      text: article.value.excerpt,
      url: window.location.href,
    })
    .catch(err => console.error('分享失败:', err))
  } else {
    // 降级处理：复制链接到剪贴板
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('文章链接已复制到剪贴板'))
      .catch(() => alert('分享失败'))
  }
}

// 监听路由变化，重新加载文章
watch(() => route.params.id, (newId) => {
  if (newId) {
    loadArticle(newId)
  }
}, { immediate: true })

// 组件卸载时恢复默认的 meta description
onUnmounted(() => {
  updateMetaDescription("Vorest's Personal Website")
})

</script>

<style scoped>
.blog-detail {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.loading, .not-found {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.not-found h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #333;
}

.back-btn {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  transition: background-color 0.3s;
}

.back-btn:hover {
  background-color: #2980b9;
}

.article-header {
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
  margin-bottom: 2rem;
}

.article-cover img {
  width: auto;
  height: 30rem;
  border-radius: 12px;
  display: block;
  margin: 1.5rem auto;
}

.article-info h1 {
  font-size: 2.8rem;
  font-weight: 700;
  color: #333;
  line-height: 1.3;
  margin-bottom: 1.5rem;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  color: #777;
  font-size: 0.9rem;
}

.meta-info span {
  margin-right: 1rem;
}

.article-tags .tag {
  background-color: #f0f0f0;
  padding: 0.3rem 0.8rem;
  border-radius: 16px;
  font-size: 0.85rem;
  margin-left: 0.5rem;
  color: #555;
  transition: background-color 0.3s, color 0.3s;
}

.article-tags .tag:hover {
  background-color: #3498db;
  color: #fff;
}

.article-content {
  line-height: 1.8;
  font-size: 1.1rem;
  color: #333;
}

/* 样式穿透，美化文章内容 */
.article-content :deep(h2) {
  font-size: 1.8rem;
  margin: 2.5rem 0 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.article-content :deep(h3) {
  font-size: 1.5rem;
  margin: 2rem 0 1rem;
}

.article-content :deep(p) {
  margin-bottom: 1.5rem;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  padding-left: 2rem;
  margin-bottom: 1.5rem;
}

.article-content :deep(blockquote) {
  border-left: 4px solid #3498db;
  margin: 2rem 0;
  padding: 1rem 1.5rem;
  background-color: #f8f9fa;
  color: #555;
}

.article-content :deep(pre) {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 2rem 0;
  font-family: 'Courier New', Courier, monospace;
}

.article-content :deep(code) {
  font-family: 'Courier New', Courier, monospace;
}

.article-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 2rem 0;
}

.article-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.article-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 0.75rem 1.5rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  color: #555;
}

.action-btn:hover {
  border-color: #3498db;
  color: #3498db;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
}

.action-btn.liked {
  border-color: #e74c3c;
  color: #e74c3c;
}

.comments-section {
  margin-top: 3rem;
}

.comments-section h3 {
  font-size: 1.8rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
  color: #333;
}

.comment-form {
  background-color: #f9f9f9;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.comment-form h4 {
  font-size: 1.4rem;
  margin-bottom: 1.5rem;
  color: #444;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-actions {
  text-align: right;
  margin-top: 1rem;
}

.submit-btn {
  padding: 0.8rem 2rem;
  background-color: #3498db;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.submit-btn:disabled {
  background-color: #a9d6f5;
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

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment-item {
  display: flex;
  gap: 1rem;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.comment-author {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.comment-time {
  font-size: 0.85rem;
  color: #888;
}

.comment-text {
  color: #555;
  line-height: 1.6;
}

.comment-actions {
  margin-top: 0.5rem;
}

.comment-like-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  font-size: 0.9rem;
  padding: 0;
}

.comment-like-btn:hover {
  color: #3498db;
}

.comment-like-btn.liked {
  color: #e74c3c;
  font-weight: bold;
}

.comments-empty {
  text-align: center;
  padding: 2rem;
  color: #777;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.login-prompt {
  text-align: center;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border: 2px dashed #ddd;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.login-prompt p {
  margin: 0;
  color: #666;
  font-size: 1rem;
}

.login-prompt a {
  color: #3498db;
  text-decoration: none;
  font-weight: 600;
}

.login-prompt a:hover {
  text-decoration: underline;
}
</style>
'''<!-- 
  CommentNode.vue
  - 递归组件，用于显示单条评论及其所有回复。
  - 管理回复框的显示/隐藏。
  - 处理回复提交和评论删除操作。
-->
<template>
  <div 
    class="comment-node"
    :class="{ 'top-level-comment': depth === 0 }"
    :style="{ marginLeft: `${depth * 20}px` }"
  >
    <div class="comment-item">
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-author">{{ comment.author?.username || '匿名用户' }}</span>
          <span class="comment-time">{{ formattedDate }}</span>
          <!-- 添加公开状态标识 -->
          <span v-if="!comment.isPublic" class="private-badge">私有</span>
        </div>
        <div class="comment-text">{{ comment.content }}</div>
        <div class="comment-actions">
          <!-- 点赞按钮 -->
          <button @click="toggleLike" class="action-btn like-btn" :class="{ liked: isLiked }">
            {{ isLiked ? '❤️' : '🤍' }} {{ comment.likeCount || 0 }}
          </button>
          <button @click="showReply = !showReply" class="action-btn">回复</button>
          <!-- 公开/私有切换按钮 -->
          <button 
            v-if="canManageVisibility"
            @click="toggleVisibility"
            class="action-btn visibility-btn"
            :class="{ private: !comment.isPublic }"
          >
            {{ comment.isPublic ? '设为私有' : '设为公开' }}
          </button>
          <button 
            v-if="canDelete"
            @click="handleDelete"
            class="action-btn delete-btn"
          >
            删除
          </button>
        </div>

        <!-- 回复输入框 -->
        <div v-if="showReply" class="reply-form">
          <textarea v-model="replyContent" placeholder="输入你的回复..." rows="3"></textarea>
          <div class="reply-options">
            <label class="checkbox-label">
              <input 
                v-model="replyIsPublic" 
                type="checkbox" 
                class="checkbox-input"
              />
              <span class="checkbox-text">公开回复</span>
            </label>
          </div>
          <button @click="submitReply" :disabled="isSubmitting">提交回复</button>
          <button @click="showReply = false" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>

    <!-- 递归渲染子评论 -->
    <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
      <CommentNode
        v-for="reply in comment.replies"
        :key="reply.id || reply._id"
        :comment="reply"
        :depth="depth + 1"
        @comment-deleted="$emit('comment-deleted', $event)"
        @comment-added="$emit('comment-added', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { commentApi } from '@/api/comment';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  depth: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['comment-deleted', 'comment-added']);

const authStore = useAuthStore();

const showReply = ref(false);
const replyContent = ref('');
const replyIsPublic = ref(true); // 默认公开回复
const isSubmitting = ref(false);
// 添加新的响应式数据
const isLiked = ref(false);

const formattedDate = computed(() => {
  if (!props.comment.createdAt) return '';
  return formatDistanceToNow(new Date(props.comment.createdAt), { addSuffix: true, locale: zhCN });
});

const canDelete = computed(() => {
  if (!authStore.isAuthenticated) return false;
  // 管理员可以删除任何评论
  if (authStore.user?.role === 'admin') return true;
  // 用户可以删除自己的评论
  return authStore.user?.id === (props.comment.author?.id || props.comment.author?._id);
});

// 添加计算属性
const canManageVisibility = computed(() => {
  if (!authStore.isAuthenticated) return false;
  // 管理员可以管理任何评论的可见性
  if (authStore.user?.role === 'admin') return true;
  // 用户可以管理自己评论的可见性
  return authStore.user?.id === (props.comment.author?.id || props.comment.author?._id);
});

const handleDelete = async () => {
  if (!confirm('确定要删除这条评论吗？其所有回复也将被一并删除。')) return;

  try {
    const id = props.comment.id || props.comment._id;
    await commentApi.deleteComment(id);
    emit('comment-deleted', id);
    alert('评论已删除');
  } catch (error) {
    console.error('删除评论失败:', error);
    alert('删除失败，请稍后重试。');
  }
};

const submitReply = async () => {
  if (!replyContent.value.trim()) {
    alert('回复内容不能为空');
    return;
  }

  isSubmitting.value = true;
  try {
    const replyData = {
      content: replyContent.value,
      targetId: props.comment.targetId,
      targetType: props.comment.targetType,
      parentComment: (props.comment.id || props.comment._id),
      isPublic: replyIsPublic.value
    };
    const response = await commentApi.createComment(replyData);
    if (response.success) {
      emit('comment-added', response.data);
      replyContent.value = '';
      replyIsPublic.value = true; // 重置为默认公开
      showReply.value = false;
      alert('回复成功');
    }
  } catch (error) {
    console.error('回复失败:', error);
    alert('回复失败，请稍后重试。');
  } finally {
    isSubmitting.value = false;
  }
};

// 添加方法
const checkLikeStatus = async () => {
  try {
    const id = props.comment.id || props.comment._id;
    const response = await commentApi.checkLikeStatus(id);
    if (response.success) {
      isLiked.value = response.data.isLiked;
    }
  } catch (error) {
    console.error('检查点赞状态失败:', error);
  }
};

const toggleLike = async () => {
  if (!authStore.isAuthenticated) {
    alert('请先登录');
    return;
  }

  try {
    if (isLiked.value) {
      await commentApi.unlikeComment(props.comment.id || props.comment._id);
      props.comment.likeCount = Math.max(0, (props.comment.likeCount || 0) - 1);
    } else {
      await commentApi.likeComment(props.comment.id || props.comment._id);
      props.comment.likeCount = (props.comment.likeCount || 0) + 1;
    }
    isLiked.value = !isLiked.value;
  } catch (error) {
    console.error('点赞操作失败:', error);
    alert(error.response?.data?.message || '操作失败');
  }
};

const toggleVisibility = async () => {
  try {
    const newVisibility = !props.comment.isPublic;
    await commentApi.updateCommentVisibility(props.comment.id || props.comment._id, newVisibility);
    props.comment.isPublic = newVisibility;
    alert(`评论已${newVisibility ? '设为公开' : '设为私有'}`);
  } catch (error) {
    console.error('更新可见性失败:', error);
    alert('操作失败');
  }
};

// 组件挂载时检查点赞状态
onMounted(() => {
  checkLikeStatus();
});

</script>

<style scoped>
.comment-node {
  margin-top: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #eee;
}

.top-level-comment {
  border-top: 3px solid #a0c4e4;
}

.comment-item {
  display: flex;
  gap: 10px;
  padding: 10px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.comment-author {
  font-weight: bold;
  color: #333;
}

.comment-time {
  font-size: 0.8em;
  color: #888;
}

.comment-text {
  margin-bottom: 10px;
  color: #555;
}

.comment-actions .action-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  margin-right: 10px;
}
.comment-actions .action-btn:hover {
  color: #3498db;
}

.comment-actions .delete-btn {
  color: #e74c3c;
}

.reply-form {
  margin-top: 10px;
}

.reply-form textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 5px;
}

.reply-form button {
  margin-right: 10px;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.reply-options {
  margin: 0.5rem 0;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  color: #555;
}

.checkbox-input {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.checkbox-text {
  user-select: none;
}

.reply-form .cancel-btn {
  background-color: #eee;
  border: 1px solid #ccc;
}

.comment-replies {
  margin-top: 10px;
}

/* 添加新的样式 */
.private-badge {
  background: #ff6b6b;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  margin-left: 8px;
}

.like-btn {
  color: #666;
}

.like-btn.liked {
  color: #e74c3c;
}

.visibility-btn {
  color: #666;
}

.visibility-btn.private {
  color: #ff6b6b;
}
</style>
'''
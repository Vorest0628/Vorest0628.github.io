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
        </div>
        <div class="comment-text">{{ comment.content }}</div>
        <div class="comment-actions">
          <button @click="showReply = !showReply" class="action-btn">回复</button>
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
          <button @click="submitReply" :disabled="isSubmitting">提交回复</button>
          <button @click="showReply = false" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>

    <!-- 递归渲染子评论 -->
    <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
      <CommentNode
        v-for="reply in comment.replies"
        :key="reply._id"
        :comment="reply"
        :depth="depth + 1"
        @comment-deleted="$emit('comment-deleted', $event)"
        @comment-added="$emit('comment-added', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
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
const isSubmitting = ref(false);

const formattedDate = computed(() => {
  if (!props.comment.createdAt) return '';
  return formatDistanceToNow(new Date(props.comment.createdAt), { addSuffix: true, locale: zhCN });
});

const canDelete = computed(() => {
  if (!authStore.isAuthenticated) return false;
  // 管理员可以删除任何评论
  if (authStore.user?.role === 'admin') return true;
  // 用户可以删除自己的评论
  return authStore.user?.id === props.comment.author?._id;
});

const handleDelete = async () => {
  if (!confirm('确定要删除这条评论吗？其所有回复也将被一并删除。')) return;

  try {
    await commentApi.deleteComment(props.comment._id);
    emit('comment-deleted', props.comment._id);
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
      parentComment: props.comment._id
    };
    const response = await commentApi.createComment(replyData);
    if (response.success) {
      emit('comment-added', response.data);
      replyContent.value = '';
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

.reply-form .cancel-btn {
  background-color: #eee;
  border: 1px solid #ccc;
}

.comment-replies {
  margin-top: 10px;
}
</style>
'''
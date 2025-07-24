const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  // 关联的目标模型ID (例如博客文章ID)
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  // 关联的目标模型类型 (例如 'Blog')
  targetType: {
    type: String,
    required: true,
    enum: ['Blog', 'Gallery', 'Document', 'General']
  },
  // 评论内容
  content: {
    type: String,
    required: [true, '评论内容不能为空'],
    trim: true,
    maxlength: [2000, '内容不能超过2000个字符']
  },
  // 作者信息（注册用户）
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 父评论ID，用于实现评论回复
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  // 状态
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // 点赞数
  likeCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// 索引
commentSchema.index({ targetId: 1, targetType: 1, status: 1 });
commentSchema.index({ createdAt: -1 });

// 虚拟字段：用于获取评论的回复
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment'
});

const Comment = mongoose.model('Comment', commentSchema)

module.exports = Comment

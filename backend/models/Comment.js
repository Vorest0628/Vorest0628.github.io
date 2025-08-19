const mongoose = require('mongoose')

/**
 * 评论数据模型
 * 定义了评论系统的数据结构和验证规则
 * targetId 评论目标对象的ID (博客、相册、文档等)
 * targetType 评论目标类型 (Blog, Gallery, Document, General)
 * content 评论内容
 * author 评论作者ID
 * parentComment 父评论ID (用于回复功能)
 * isPublic 是否公开显示
 * likeCount 点赞数
 * createdAt 创建时间
 * updatedAt 更新时间
 * 虚拟字段：
 * replies 子评论列表
 * 索引：
 * 目标索引：targetId, targetType, isPublic
 * 时间索引：createdAt
 */
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
  // 是否公开
  isPublic: {
    type: Boolean,
    default: true
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
commentSchema.index({ targetId: 1, targetType: 1, isPublic: 1 });
commentSchema.index({ createdAt: -1 });

// 虚拟字段：用于获取评论的回复
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment'
});

const Comment = mongoose.model('Comment', commentSchema)

module.exports = Comment

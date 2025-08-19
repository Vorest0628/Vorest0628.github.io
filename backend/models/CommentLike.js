const mongoose = require('mongoose')

/**
 * 评论点赞数据模型
 * 定义了用户对评论点赞关系的数据结构
 * comment 被点赞的评论ID
 * user 点赞用户的ID
 * createdAt 点赞时间
 * updatedAt 更新时间
 * 索引：
 * 复合唯一索引：comment, user (确保一个用户只能对一条评论点赞一次)
 */
const commentLikeSchema = new mongoose.Schema({
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// 复合索引，确保一个用户只能对一条评论点赞一次
commentLikeSchema.index({ comment: 1, user: 1 }, { unique: true })

const CommentLike = mongoose.model('CommentLike', commentLikeSchema)
module.exports = CommentLike
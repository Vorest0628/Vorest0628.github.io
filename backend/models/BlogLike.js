const mongoose = require('mongoose')

/**
 * 博客点赞数据模型
 * 定义了用户对博客点赞关系的数据结构
 * blog 被点赞的博客ID
 * user 点赞用户的ID
 * createdAt 点赞时间
 * updatedAt 更新时间
 * 索引：
 * 复合唯一索引：blog, user (确保一个用户只能对一篇博客点赞一次)
 */
const blogLikeSchema = new mongoose.Schema({
  blog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
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

// 复合索引，确保一个用户只能对一篇博客点赞一次
blogLikeSchema.index({ blog: 1, user: 1 }, { unique: true })

const BlogLike = mongoose.model('BlogLike', blogLikeSchema)
module.exports = BlogLike 
const mongoose = require('mongoose')

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
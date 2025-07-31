const mongoose = require('mongoose')

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
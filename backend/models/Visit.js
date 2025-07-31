const mongoose = require('mongoose')

const visitSchema = new mongoose.Schema({
  // 页面路径
  page: {
    type: String,
    required: true,
    trim: true
  },
  // 用户代理
  userAgent: {
    type: String,
    trim: true
  },
  // IP地址（可选）
  ip: {
    type: String,
    trim: true
  },
  // 访问时间
  timestamp: {
    type: Date,
    default: Date.now
  },
  // 会话ID（可选，用于去重）
  sessionId: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// 索引
visitSchema.index({ page: 1, timestamp: -1 })
visitSchema.index({ timestamp: -1 })

const Visit = mongoose.model('Visit', visitSchema)

module.exports = Visit 
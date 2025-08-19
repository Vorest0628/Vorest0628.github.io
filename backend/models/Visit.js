const mongoose = require('mongoose')

/**
 * 访问统计数据模型
 * 定义了网站访问统计的数据结构和验证规则
 * page 访问的页面路径
 * userAgent 用户代理信息
 * ip 访问者IP地址
 * timestamp 访问时间戳
 * sessionId 会话ID (用于去重统计)
 * createdAt 创建时间
 * updatedAt 更新时间
 * 索引：
 * 页面时间索引：page, timestamp
 * 时间索引：timestamp
 */
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
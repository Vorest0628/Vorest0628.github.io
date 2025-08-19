const mongoose = require('mongoose')

/**
 * 博客资源数据模型
 * 定义了博客相关资源文件的数据结构和验证规则
 * blogId 关联的博客ID
 * filename 文件名
 * title 资源标题
 * blobUrl 资源的blob URL
 * createdAt 创建时间
 * updatedAt 更新时间
 * 索引：
 * 复合唯一索引：blogId, filename (确保同一博客下文件名唯一)
 */
const blogAssetSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  filename: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    default: ''
  },
  blobUrl: {
    type: String,
    required: true
  }
}, { timestamps: true })

blogAssetSchema.index({ blogId: 1, filename: 1 }, { unique: true })

module.exports = mongoose.model('BlogAsset', blogAssetSchema)

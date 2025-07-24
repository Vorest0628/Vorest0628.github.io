const mongoose = require('mongoose')

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '标题是必填项'],
    trim: true,
    maxlength: [200, '标题不能超过200个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, '描述不能超过1000个字符']
  },
  filePath: {
    type: String,
    required: [true, '文件路径是必填项']
  },
  fileSize: {
    type: Number,
    required: [true, '文件大小是必填项']
  },
  formattedSize: {
    type: String
  },
  type: {
    type: String,
    required: [true, '文件类型是必填项'],
    enum: {
      values: ['PDF', 'DOCX', 'PPT', 'PPTX', 'XLSX', 'TXT', 'MD', '其他'],
      message: '请选择有效的文件类型'
    }
  },
  category: {
    type: String,
    required: [true, '分类是必填项'],
    enum: {
      values: ['前端开发', '游戏攻略', 'AI技术', '音乐制作', '模板资源'],
      message: '请选择有效的分类'
    }
  },
  secondaryTags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签不能超过20个字符']
  }],
  downloadCount: {
    type: Number,
    default: 0
  },
  author: {
    type: String,
    default: 'Admin'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  previewUrl: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'pinned'],
    default: 'draft'
  },
  // 置顶优先级，数值越大优先级越高
  pinnedPriority: {
    type: Number,
    default: 0 // 默认为0，置顶文档可以设置为正数
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// 索引 - 包含标题、描述、分类、标签
documentSchema.index({ 
  title: 'text', 
  description: 'text',
  category: 'text',
  secondaryTags: 'text'
})
documentSchema.index({ category: 1, secondaryTags: 1 })
documentSchema.index({ type: 1 })
documentSchema.index({ date: -1 })

// 预处理：文件大小格式化
documentSchema.pre('save', function(next) {
  if (this.fileSize) {
    this.formattedSize = formatFileSize(this.fileSize)
  }
  next()
})

// 更新下载次数
documentSchema.methods.incrementDownloadCount = async function() {
  this.downloadCount += 1
  await this.save()
  return this.downloadCount
}

const Document = mongoose.model('Document', documentSchema)

// 辅助函数：格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

module.exports = Document

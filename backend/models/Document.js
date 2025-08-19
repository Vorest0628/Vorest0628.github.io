const mongoose = require('mongoose')

/**
 * 文档数据模型
 * 定义了文档管理系统的数据结构和验证规则
 * title 文档标题
 * description 文档描述
 * filePath 文件存储路径
 * fileSize 文件大小(字节)
 * formattedSize 格式化后的文件大小
 * type 文件类型 (PDF, DOCX, PPT, PPTX, XLSX, TXT, MD, 其他)
 * category 文档分类
 * secondaryTags 次要标签数组
 * downloadCount 下载次数
 * author 作者
 * isPublic 是否公开
 * previewUrl 预览URL
 * date 文档日期
 * lastModified 最后修改时间
 * status 文档状态 (draft, published, pinned)
 * pinnedPriority 置顶优先级
 * createdAt 创建时间
 * updatedAt 更新时间
 * 方法：
 * incrementDownloadCount 增加下载次数
 * 索引：
 * 文本索引：title, description, category, secondaryTags
 * 分类索引：category, secondaryTags
 * 类型索引：type
 * 时间索引：date
 */
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
    trim: true,
    maxlength: [50, '分类名称不能超过50个字符']
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

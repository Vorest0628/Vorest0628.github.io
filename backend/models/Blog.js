const mongoose = require('mongoose')

/**
 * 博客数据模型
 * 定义了博客的数据结构和验证规则
 * title 博客标题
 * excerpt 博客摘要
 * category 博客分类
 * content 博客内容
 * author 作者
 * tags 标签数组
 * coverImage 封面图片URL
 * status 博客状态
 * viewCount 浏览次数
 * likeCount 点赞数
 * commentCount 评论数
 * pinnedPriority 置顶优先级
 * createdAt 创建时间
 * updatedAt 更新时间
 * 虚拟字段：
 * date 日期
 * 索引：
 * 文本索引：title, content, excerpt, category, tags
 * 分类索引：category
 * 状态索引：status
 * 置顶优先级索引：pinnedPriority
 * 时间索引：createdAt
 * 复合索引：status, pinnedPriority, createdAt
 */
const blogSchema = new mongoose.Schema({
  // 博客标题
  title: {
    type: String,
    required: [true, '博客标题不能为空'], // 必填字段
    trim: true // 自动删除首尾空格
  },
  // 博客摘要
  excerpt: {
    type: String,
    required: [true, '博客摘要不能为空'],
    trim: true,
    maxlength: [500, '摘要不能超过500字符']
  },
  // 博客分类 - 改为更灵活的字符串类型，不限制enum
  category: {
    type: String,
    required: [true, '博客分类不能为空'],
    trim: true
  },
  // 博客内容
  content: {
    type: String,
    required: [true, '博客内容不能为空']
  },
  // 作者
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // 标签数组
  tags: [{
    type: String,
    trim: true
  }],
  // 封面图片URL
  coverImage: {
    type: String,
    default: '' // 默认为空字符串
  },
  // 博客状态 - 添加置顶状态
  status: {
    type: String,
    enum: ['draft', 'published', 'pinned'], // 添加置顶状态
    default: 'draft' // 默认为草稿状态
  },
  // 浏览次数
  viewCount: {
    type: Number,
    default: 0
  },
  // 点赞数
  likeCount: {
    type: Number,
    default: 0
  },
  // 评论数
  commentCount: {
    type: Number,
    default: 0
  },
  // 置顶优先级，数值越大优先级越高
  pinnedPriority: {
    type: Number,
    default: 0 // 默认为0，置顶文章可以设置为正数
  }
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt 字段
})

// 创建文本索引，用于全文搜索 - 包含标题、内容、摘要、分类、标签
blogSchema.index({ 
  title: 'text', 
  content: 'text', 
  excerpt: 'text',
  category: 'text',
  tags: 'text'
})
// 创建分类索引
blogSchema.index({ category: 1 })
// 创建状态索引
blogSchema.index({ status: 1 })
// 创建置顶优先级索引
blogSchema.index({ pinnedPriority: -1 })
// 创建时间索引，用于按时间排序
blogSchema.index({ createdAt: -1 })
// 创建复合索引：状态和时间，用于首页展示
blogSchema.index({ status: 1, pinnedPriority: -1, createdAt: -1 })

// 虚拟字段：将createdAt转换为date字段供前端使用
blogSchema.virtual('date').get(function() {
  return this.createdAt.toISOString().split('T')[0]
})

// 确保虚拟字段在JSON序列化时包含
blogSchema.set('toJSON', { virtuals: true })

// 创建并导出Blog模型
const Blog = mongoose.model('Blog', blogSchema)

module.exports = Blog

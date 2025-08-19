const mongoose = require('mongoose')

/**
 * 友情链接数据模型
 * 定义了友情链接系统的数据结构和验证规则
 * name 链接名称
 * url 链接地址
 * avatar 头像图片路径
 * description 链接描述
 * category 链接分类 (个人博客, 技术社区, 学习资源, 工具网站, 友情链接, 其他)
 * tags 标签数组
 * visitCount 访问次数
 * lastChecked 最后检查时间
 * status 链接状态 (正常, 待审核, 已失效)
 * isActive 是否激活
 * email 联系邮箱
 * contactInfo 联系信息
 * remark 备注信息
 * createdAt 创建时间
 * updatedAt 更新时间
 * 虚拟字段：
 * formattedUrl 格式化后的URL (自动添加https://)
 * 方法：
 * incrementVisit 增加访问次数
 * checkAccessibility 检查链接有效性
 * 静态方法：
 * checkAllLinks 批量检查所有链接
 * 索引：
 * 文本索引：name, description
 * 分类索引：category
 * 状态索引：status, isActive
 * 访问量索引：visitCount
 */
const friendLinkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '名称是必填项'],
    trim: true,
    maxlength: [50, '名称不能超过50个字符']
  },
  url: {
    type: String,
    required: [true, 'URL是必填项'],
    trim: true,
    validate: {
      validator: function(url) {
        // 支持带或不带协议的URL
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i
        return urlPattern.test(url)
      },
      message: '请输入有效的网站地址'
    }
  },
  avatar: {
    type: String,
    default: '/uploads/avatars/default.png'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, '描述不能超过200个字符']
  },
  category: {
    type: String,
    required: [true, '分类是必填项'],
    enum: {
      values: ['个人博客', '技术社区', '学习资源', '工具网站', '友情链接', '其他'],
      message: '请选择有效的分类'
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签不能超过20个字符']
  }],
  visitCount: {
    type: Number,
    default: 0
  },
  lastChecked: {
    type: Date
  },
  status: {
    type: String,
    enum: {
      values: ['正常', '待审核', '已失效'],
      message: '请选择有效的状态'
    },
    default: '待审核'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    trim: true,
    match: [
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      '请提供有效的邮箱'
    ]
  },
  contactInfo: {
    type: String,
    trim: true,
    maxlength: [100, '联系信息不能超过100个字符']
  },
  remark: {
    type: String,
    trim: true,
    maxlength: [500, '备注不能超过500个字符']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// 虚拟字段：格式化URL
friendLinkSchema.virtual('formattedUrl').get(function() {
  let url = this.url
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }
  return url
})

// 中间件：保存前统一URL格式和状态
friendLinkSchema.pre('save', function(next) {
  // 根据isActive设置status
  if (this.isActive === true) {
    this.status = '正常'
  } else if (this.isActive === false) {
    this.status = '待审核'
  }
  
  next()
})

// 索引
friendLinkSchema.index({ name: 'text', description: 'text' })
friendLinkSchema.index({ category: 1 })
friendLinkSchema.index({ status: 1 })
friendLinkSchema.index({ isActive: 1 })
friendLinkSchema.index({ visitCount: -1 })

// 访问记录
friendLinkSchema.methods.incrementVisit = async function() {
  this.visitCount += 1
  await this.save()
  return this.visitCount
}

// 检查链接有效性
friendLinkSchema.methods.checkAccessibility = async function() {
  try {
    // 模拟HTTP请求，检查链接是否可访问
    // 实际项目中应使用 axios 或 node-fetch 进行请求
    const isAccessible = true // 简化处理，假设链接可访问
    
    this.lastChecked = new Date()
    this.status = isAccessible ? '正常' : '已失效'
    await this.save()
    
    return {
      isAccessible,
      lastChecked: this.lastChecked
    }
  } catch (error) {
    this.lastChecked = new Date()
    this.status = '已失效'
    await this.save()
    
    return {
      isAccessible: false,
      lastChecked: this.lastChecked,
      error: error.message
    }
  }
}

// 批量检查链接有效性
friendLinkSchema.statics.checkAllLinks = async function() {
  const links = await this.find()
  const results = []
  
  for (const link of links) {
    const result = await link.checkAccessibility()
    results.push({
      id: link._id,
      name: link.name,
      url: link.url,
      ...result
    })
  }
  
  return results
}

const FriendLink = mongoose.model('FriendLink', friendLinkSchema)

module.exports = FriendLink

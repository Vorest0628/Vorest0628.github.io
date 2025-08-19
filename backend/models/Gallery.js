const mongoose = require('mongoose')

/**
 * 相册数据模型
 * 定义了相册系统的数据结构和验证规则
 * title 图片标题
 * description 图片描述
 * thumbnail 缩略图路径
 * fullSize 原图路径
 * category 图片分类 (摄影, 游戏, 编程, 设计)
 * secondaryTags 次要标签数组
 * status 图片状态 (draft, published)
 * date 拍摄/创建日期
 * width 图片宽度
 * height 图片高度
 * author 作者
 * viewCount 查看次数
 * isPublic 是否公开
 * exif 图片EXIF信息 (相机, 镜头, 光圈, 快门速度, ISO, 焦距, 位置)
 * createdAt 创建时间
 * updatedAt 更新时间
 * 虚拟字段：
 * aspect 图片宽高比
 * 索引：
 * 文本索引：title, description
 * 分类索引：category, secondaryTags
 * 时间索引：date
 */
const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '标题是必填项'],
    trim: true,
    maxlength: [100, '标题不能超过100个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '描述不能超过500个字符']
  },
  thumbnail: {
    type: String,
    required: [true, '缩略图路径是必填项']
  },
  fullSize: {
    type: String,
    required: [true, '原图路径是必填项']
  },
  category: {
    type: String,
    required: [true, '分类是必填项'],
    enum: {
      values: ['摄影', '游戏', '编程', '设计'],
      message: '请选择有效的分类'
    }
  },
  secondaryTags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签不能超过20个字符']
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  date: {
    type: Date,
    default: Date.now
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  },
  author: {
    type: String,
    default: 'Admin'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  exif: {
    camera: String,
    lens: String,
    aperture: String,
    shutterSpeed: String,
    iso: String,
    focalLength: String,
    location: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// 虚拟属性：图片比例
gallerySchema.virtual('aspect').get(function() {
  if (this.width && this.height) {
    return (this.width / this.height).toFixed(3)
  }
  return null
})

// 索引
gallerySchema.index({ title: 'text', description: 'text' })
gallerySchema.index({ category: 1, secondaryTags: 1 })
gallerySchema.index({ date: -1 })

const Gallery = mongoose.model('Gallery', gallerySchema)

module.exports = Gallery

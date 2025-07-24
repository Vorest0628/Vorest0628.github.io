const mongoose = require('mongoose')

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

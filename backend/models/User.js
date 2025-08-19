const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

/**
 * 用户数据模型
 * 定义了用户系统的数据结构和验证规则
 * username 用户名
 * email 邮箱地址
 * password 密码 (加密存储)
 * avatar 头像图片路径
 * role 用户角色 (user, admin)
 * isActive 是否激活
 * createdAt 创建时间
 * updatedAt 更新时间
 * 方法：
 * comparePassword 验证密码
 * 中间件：
 * 保存前自动加密密码
 * 索引：
 * 用户名唯一索引：username
 * 邮箱唯一索引：email
 */
const userSchema = new mongoose.Schema({
  // 用户名
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符']
  },
  // 邮箱
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  // 密码
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少6个字符'],
    select: false // 查询时默认不返回密码
  },
  // 头像
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  // 角色
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // 是否激活
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// 保存前加密密码
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// 验证密码的方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model('User', userSchema)

module.exports = User

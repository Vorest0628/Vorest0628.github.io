const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { ApiError } = require('../utils/error')

// 生成JWT令牌
const generateToken = (userId, userRole) => {
  return jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

// 注册新用户
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body

    // 检查用户是否已存在
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    })
    
    if (existingUser) {
      throw new ApiError(400, '用户名或邮箱已被注册')
    }

    // 创建新用户
    const user = await User.create({
      username,
      email,
      password
    })

    // 生成令牌
    const token = generateToken(user._id, user.role)

    // 返回用户信息（不包含密码）和令牌
    res.status(201).json({
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        },
        token
      }
    })
  } catch (error) {
    next(error)
  }
}

// 用户登录
exports.login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body

    // 构建查询条件：支持用户名或邮箱登录
    let query = {}
    if (email) {
      query.email = email
    } else if (username) {
      query.username = username
    } else {
      throw new ApiError(400, '请提供用户名或邮箱')
    }

    // 查找用户并包含密码字段
    const user = await User.findOne(query).select('+password')
    
    // 检查用户是否存在
    if (!user) {
      throw new ApiError(401, '用户名/邮箱或密码错误')
    }

    // 验证密码
    const isPasswordCorrect = await user.comparePassword(password)
    if (!isPasswordCorrect) {
      throw new ApiError(401, '用户名/邮箱或密码错误')
    }

    // 检查用户是否被禁用
    if (!user.isActive) {
      throw new ApiError(403, '账户已被禁用')
    }

    // 生成令牌
    const token = generateToken(user._id, user.role)

    // 返回用户信息和令牌
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        },
        token
      }
    })
  } catch (error) {
    next(error)
  }
}

// 获取当前用户信息
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    
    if (!user) {
      throw new ApiError(404, '用户不存在')
    }

    res.json({
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

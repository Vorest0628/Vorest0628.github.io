const User = require('../models/User')
const { ApiError } = require('../utils/error')
const { signToken } = require('../utils/jwt')

/*
authController.js函数一览：
generateToken 生成JWT令牌
register 注册新用户
login 用户登录
getCurrentUser 获取当前用户信息
getAiConfig 获取AI配置（仅限管理员）
*/

// 生成JWT令牌
const generateToken = (userId, userRole) => {
  return signToken({ id: userId, role: userRole }, {
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

// 获取 DeepSeek API 配置（仅限管理员）
exports.getAiConfig = async (req, res, next) => {
  try {
    console.log('🔑 getAiConfig 被调用');
    console.log('👤 用户信息:', req.user);
    
    // 检查用户是否为管理员
    if (req.user.role !== 'admin') {
      console.log('❌ 非管理员用户访问，角色:', req.user.role);
      throw new ApiError(403, '没有权限访问此资源')
    }

    // 从环境变量获取 DeepSeek API Key
    const apiKey = process.env.DEEPSEEK_API_KEY
    
    console.log('🔍 环境变量检查:');
    console.log('  - DEEPSEEK_API_KEY 存在:', !!apiKey);
    console.log('  - DEEPSEEK_API_KEY 长度:', apiKey ? apiKey.length : 0);
    console.log('  - DEEPSEEK_API_KEY 前缀:', apiKey ? apiKey.substring(0, 10) + '...' : '未配置');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    console.log('  - VERCEL:', process.env.VERCEL);
    
    if (!apiKey) {
      console.log('⚠️ 服务端未配置 DEEPSEEK_API_KEY');
      return res.json({
        success: true,
        data: {
          available: false,
          message: '服务端未配置 AI API Key'
        }
      })
    }

    console.log('✅ API Key 配置正常，返回给前端');
    // 返回完整的 API Key
    res.json({
      success: true,
      data: {
        available: true,
        apiKey: apiKey,
        baseURL: 'https://api.deepseek.com'
      }
    })
  } catch (error) {
    console.error('❌ getAiConfig 错误:', error);
    next(error)
  }
}

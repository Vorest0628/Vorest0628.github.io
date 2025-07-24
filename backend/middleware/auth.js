const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { ApiError } = require('../utils/error')

// 验证JWT令牌
exports.auth = async (req, res, next) => {
  try {
    // 获取请求头中的令牌
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, '请先登录')
    }

    const token = authHeader.split(' ')[1]

    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // 将解码后的用户信息（包含id和role）直接附加到请求对象
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, '无效的令牌'))
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, '令牌已过期'))
    } else {
      next(error)
    }
  }
}

// 可选认证中间件：如果提供了有效的令牌，则附加用户信息
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      // 直接使用解码后的用户信息
      req.user = decoded
    }
    next()
  } catch (error) {
    // 令牌无效或过期时，不抛出错误，直接继续
    next()
  }
}

// 检查用户角色
exports.checkRole = (...roles) => {
  return (req, res, next) => {
    // 确保 req.user 存在后再检查 role
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, '没有权限执行此操作'))
    }
    next()
  }
}

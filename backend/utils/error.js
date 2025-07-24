// 自定义API错误
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('错误信息:', err)
  
  let error = { ...err }
  error.message = err.message

  // MongoDB错误处理
  if (err.name === 'CastError') {
    const message = `资源未找到: ${err.value}`
    error = new ApiError(404, message)
  }

  // MongoDB重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `${field} 已存在，请使用其他值`
    error = new ApiError(400, message)
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message)
    const message = `无效输入: ${errors.join(', ')}`
    error = new ApiError(400, message)
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
}

// 捕获异步错误
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = {
  ApiError,
  errorHandler,
  catchAsync
}
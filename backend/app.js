const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const { errorHandler } = require('./utils/error')

// 检查是否在Vercel环境中
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'

// 配置dotenv读取setting.env文件
if (!isVercel) {
  require('dotenv').config({ path: path.join(__dirname, 'setting.env') })
}

// 创建Express应用实例
const app = express()

// 调试信息
console.log('🔍 环境检查:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('VERCEL:', process.env.VERCEL)
console.log('isVercel:', isVercel)

// 中间件配置
app.use(cors({
  origin: [
    'https://vorest0628.github.io',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174'
  ],
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务 - 在Vercel中禁用
if (!isVercel) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
} else {
  console.log('⚠️ Vercel环境禁用静态文件服务')
}

// 根路径处理
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Vorest个人网站后端API服务',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    isVercel: isVercel,
    timestamp: new Date().toISOString()
  })
})

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    isVercel: isVercel
  })
})

// 数据库连接状态中间件
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: '数据库连接未就绪，请稍后重试',
      readyState: mongoose.connection.readyState
    })
  }
  next()
})

// 路由配置
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/user', require('./routes/userRoutes'))
app.use('/api/blogs', require('./routes/blogRoutes'))
app.use('/api/comments', require('./routes/comment'))
app.use('/api/friend-links', require('./routes/friendLink'))
app.use('/api/documents', require('./routes/document'))
app.use('/api/gallery', require('./routes/gallery'))
app.use('/api/search', require('./routes/searchRoutes'))
app.use('/api/stats', require('./routes/stats'))
app.use('/api/admin', require('./routes/adminRoutes'))

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.originalUrl
  })
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('❌ 服务器错误:', err)
  console.error('📍 请求路径:', req.path)
  console.error('🔍 错误详情:', err.stack)
  
  // 如果是Vercel环境，返回更详细的错误信息
  if (isVercel) {
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: err.message,
      stack: err.stack,
      path: req.path
    })
  } else {
    errorHandler(err, req, res, next)
  }
})

// 数据库连接
const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌ 错误: MONGODB_URI 未在环境变量中设置')
  if (isVercel) {
    console.error('🔍 请检查Vercel环境变量配置')
  }
  process.exit(1)
}

console.log('🔗 尝试连接数据库...')

// 优化MongoDB连接配置
const mongooseOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: true,  // 改为true，允许缓冲命令
  useNewUrlParser: true,
  useUnifiedTopology: true
}

mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('✅ 数据库连接成功')
    console.log('📍 连接地址:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'))
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err.message)
    console.error('🔍 完整错误:', err)
    if (isVercel) {
      console.error('🔍 请检查MongoDB Atlas网络访问设置')
    }
  })

// Vercel适配：只在非Vercel环境中启动服务器
if (!isVercel) {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`)
    console.log(`📖 API文档: http://localhost:${PORT}/api/health`)
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`)
  })
} else {
  console.log('✅ Vercel环境配置完成，等待函数调用...')
  
  // 在Vercel环境中保持数据库连接
  process.on('SIGTERM', async () => {
    console.log('🔄 收到SIGTERM信号，关闭数据库连接...')
    await mongoose.connection.close()
    process.exit(0)
  })
}

module.exports = app
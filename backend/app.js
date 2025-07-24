const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const { errorHandler } = require('./utils/error')

// 配置dotenv读取setting.env文件
require('dotenv').config({ path: path.join(__dirname, 'setting.env') })

// 创建Express应用实例
const app = express()

// 中间件配置
app.use(cors()) // 启用CORS
app.use(express.json()) // 解析JSON请求体
app.use(express.urlencoded({ extended: true })) // 解析URL编码的请求体

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

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

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  })
})

// 错误处理中间件
app.use(errorHandler)

// 数据库连接
const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌ 错误: MONGODB_URI 未在环境变量中设置')
  process.exit(1)
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ 数据库连接成功')
    console.log('📍 连接地址:', MONGODB_URI)
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err.message)
    console.log('💡 请确保 MongoDB 服务正在运行')
    process.exit(1)
  })

// 启动服务器
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`)
  console.log(`📖 API文档: http://localhost:${PORT}/api/health`)
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app
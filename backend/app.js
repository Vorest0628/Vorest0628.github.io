const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const { errorHandler } = require('./utils/error')

// 检查是否在Vercel环境中
const isVercel = process.env.VERCEL === '1'

// 依次加载本地环境变量文件，保留运行环境中已注入的变量
const envCandidates = [
  path.join(__dirname, 'setting.env'),
  path.join(__dirname, '.env'),
  path.join(process.cwd(), 'setting.env'),
  path.join(process.cwd(), '.env')
]

const loadedEnvFiles = []
for (const envPath of envCandidates) {
  if (!fs.existsSync(envPath)) continue

  const result = dotenv.config({ path: envPath, override: false })
  if (!result.error) {
    loadedEnvFiles.push(path.relative(process.cwd(), envPath) || path.basename(envPath))
  }
}

const ENV_HELP_MESSAGE = '请复制 backend/setting.env.example 为 backend/setting.env，并填写有效的 MONGODB_URI，或在运行环境中直接注入该变量。'

const resolveMongoUri = () => {
  const candidates = [
    process.env.MONGODB_URI,
    process.env.MONGO_URI,
    process.env.MONGO_URL
  ]

  const uri = candidates.find(value => typeof value === 'string' && value.trim())
  return uri ? uri.trim() : ''
}

const maskMongoUri = (uri) => {
  if (!uri) return 'undefined'
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@')
}

// 创建Express应用实例
const app = express()

// 调试信息
console.log('🔍 环境检查:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('VERCEL:', process.env.VERCEL)
console.log('isVercel:', isVercel)
console.log('已加载环境文件:', loadedEnvFiles.length ? loadedEnvFiles.join(', ') : '未找到本地环境文件，继续读取系统环境变量')
console.log('MONGODB_URI存在:', !!resolveMongoUri())
console.log('MONGODB_URI长度:', resolveMongoUri() ? resolveMongoUri().length : 0)
console.log('MONGODB_URI掩码:', maskMongoUri(resolveMongoUri()))
console.log('所有环境变量:', Object.keys(process.env).filter(key => key.includes('MONGODB') || key.includes('VERCEL')))
console.log('🔄 CORS配置已更新 - 包含HTTP和HTTPS域名')

// 中间件配置
app.use(cors({
  origin: [
    'https://vorest0628.github.io',
    'https://shirakawananase.top',
    'http://shirakawananase.top',
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
// 博客资源路由（重定向到 Blob）
const assetRoutes = require('./routes/assetRoutes')
app.use('/api', assetRoutes)

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
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    if (!resolveMongoUri()) {
      return res.status(503).json({
        success: false,
        message: `${databaseConfigError || '数据库未配置。'} ${ENV_HELP_MESSAGE}`.trim(),
        readyState: mongoose.connection.readyState
      })
    }

    console.log('⚠️ 数据库连接未就绪，尝试重连...')
    console.log('🔍 当前连接状态:', mongoose.connection.readyState)
    
    try {
      await connectDB()
      
      // 等待连接完全建立
      let retries = 0
      while (mongoose.connection.readyState !== 1 && retries < 10) {
        console.log(`⏳ 等待连接就绪... (${retries + 1}/10)`)
        await new Promise(resolve => setTimeout(resolve, 500))
        retries++
      }
      
      if (mongoose.connection.readyState === 1) {
        console.log('✅ 数据库重连成功')
        return next()
      } else {
        console.error('❌ 数据库连接超时')
      }
    } catch (error) {
      console.error('❌ 数据库重连失败:', error.message)
    }
    
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
let databaseConfigError = ''

console.log('🔗 尝试连接数据库...')

// 优化MongoDB连接配置
const mongooseOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: true  // 允许缓冲命令
}

// 在Vercel环境中，我们需要确保数据库连接在每次函数调用时都可用
const connectDB = async (retryCount = 0) => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('✅ 数据库已连接')
      return
    }

    const mongoUri = resolveMongoUri()
    if (!mongoUri) {
      databaseConfigError = '未检测到 MONGODB_URI 环境变量。'
      throw new Error(`${databaseConfigError} ${ENV_HELP_MESSAGE}`)
    }

    databaseConfigError = ''
    
    console.log(`🔗 尝试连接数据库... (第${retryCount + 1}次)`)
    await mongoose.connect(mongoUri, mongooseOptions)
    
    // 等待连接完全建立
    let waitRetries = 0
    while (mongoose.connection.readyState !== 1 && waitRetries < 20) {
      console.log(`⏳ 等待连接就绪... (${waitRetries + 1}/20)`)
      await new Promise(resolve => setTimeout(resolve, 250))
      waitRetries++
    }
    
    if (mongoose.connection.readyState === 1) {
      console.log('✅ 数据库连接成功')
      console.log('📍 连接地址:', maskMongoUri(mongoUri))
    } else {
      throw new Error('连接超时')
    }
  } catch (err) {
    console.error('❌ 数据库连接失败:', err.message)

    if (!databaseConfigError) {
      console.error('🔍 完整错误:', err)
    }
    
    if (isVercel) {
      if (err.message.includes('whitelist') || err.message.includes('IP')) {
        console.error('🔍 网络访问问题：请检查MongoDB Atlas IP白名单设置')
        console.error('🔍 建议添加 0.0.0.0/0 到IP访问列表')
      } else {
        console.error('🔍 请检查MongoDB Atlas网络访问设置')
      }
    }

    if (databaseConfigError) {
      console.error('🛠️ 配置指引:', ENV_HELP_MESSAGE)
      return
    }
    
    // 如果是网络问题，尝试重连
    if (retryCount < 2 && (err.message.includes('whitelist') || err.message.includes('IP'))) {
      console.log('🔄 等待3秒后重试...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      return connectDB(retryCount + 1)
    }
  }
}

const initialMongoUri = resolveMongoUri()
if (!initialMongoUri) {
  databaseConfigError = '未检测到 MONGODB_URI 环境变量。'
  console.error(`❌ ${databaseConfigError} ${ENV_HELP_MESSAGE}`)
}

if (initialMongoUri) {
  connectDB()
}

// Vercel适配：只在非Vercel环境中启动服务器
if (!isVercel) {
  if (!initialMongoUri) {
    process.exitCode = 1
  } else {
    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`)
      console.log(`📖 API文档: http://localhost:${PORT}/api/health`)
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`)
    })
  }
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

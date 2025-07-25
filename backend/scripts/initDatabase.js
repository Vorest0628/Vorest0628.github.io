const mongoose = require('mongoose')
const User = require('../models/User')

const MONGODB_URI = 'mongodb+srv://Henry:QnnhVROtHpXmTpRr@cluster0.27eleqn.mongodb.net/my_website?retryWrites=true&w=majority'

const initDatabase = async () => {
  try {
    console.log('🔗 连接数据库...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ 数据库连接成功')

    // 检查是否已有用户
    const existingUser = await User.findOne({ username: '222' })
    if (existingUser) {
      console.log('✅ 测试用户已存在')
      return
    }

    // 创建测试用户
    const testUser = await User.create({
      username: '222',
      email: 'test@example.com',
      password: '123456',
      role: 'admin'
    })

    console.log('✅ 测试用户创建成功:', testUser.username)
    console.log('📧 邮箱:', testUser.email)
    console.log('🔑 密码: 123456')
    console.log('👤 角色:', testUser.role)

  } catch (error) {
    console.error('❌ 初始化失败:', error.message)
  } finally {
    await mongoose.connection.close()
    console.log('🔒 数据库连接已关闭')
  }
}

initDatabase() 
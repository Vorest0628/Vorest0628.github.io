const mongoose = require('mongoose')
const User = require('../models/User')
const Blog = require('../models/Blog')
const Document = require('../models/Document')
const Gallery = require('../models/Gallery')
const FriendLink = require('../models/FriendLink')

const MONGODB_URI = 'mongodb+srv://Henry:QnnhVROtHpXmTpRr@cluster0.27eleqn.mongodb.net/my_website?retryWrites=true&w=majority'

const initDatabase = async () => {
  try {
    console.log('🔗 连接数据库...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ 数据库连接成功')

    // 1. 创建测试用户
    let testUser = await User.findOne({ username: '222' })
    if (!testUser) {
      testUser = await User.create({
        username: '222',
        email: 'test@example.com',
        password: '123456',
        role: 'admin'
      })
      console.log('✅ 测试用户创建成功:', testUser.username)
    } else {
      console.log('✅ 测试用户已存在:', testUser.username)
    }

    // 2. 创建测试博客
    const existingBlogs = await Blog.countDocuments()
    if (existingBlogs === 0) {
      const testBlogs = await Blog.create([
        {
          title: '欢迎来到我的个人网站',
          content: '这是我的第一篇博客文章，欢迎访问！',
          excerpt: '个人网站介绍和欢迎信息',
          category: '介绍',
          author: testUser._id,
          status: 'published',
          tags: ['介绍', '欢迎'],
          pinnedPriority: 1
        },
        {
          title: '技术分享：Vue.js 开发心得',
          content: '分享一些Vue.js开发的经验和技巧...',
          excerpt: 'Vue.js开发经验分享',
          category: '技术',
          author: testUser._id,
          status: 'published',
          tags: ['Vue.js', '前端', '技术'],
          pinnedPriority: 0
        }
      ])
      console.log('✅ 测试博客创建成功:', testBlogs.length, '篇')
    } else {
      console.log('✅ 博客数据已存在:', existingBlogs, '篇')
    }

    // 3. 创建测试文档
    const existingDocs = await Document.countDocuments()
    if (existingDocs === 0) {
      const testDocs = await Document.create([
        {
          title: '项目说明文档',
          description: '个人网站项目说明',
          filePath: '/uploads/documents/README.md',
          fileSize: 1024,
          type: 'MD',
          category: '前端开发',
          status: 'pinned',
          pinnedPriority: 1
        },
        {
          title: '技术文档',
          description: '技术相关文档',
          filePath: '/uploads/documents/tech-doc.pdf',
          fileSize: 2048,
          type: 'PDF',
          category: 'AI技术',
          status: 'published',
          pinnedPriority: 0
        }
      ])
      console.log('✅ 测试文档创建成功:', testDocs.length, '个')
    } else {
      console.log('✅ 文档数据已存在:', existingDocs, '个')
    }

    // 4. 创建测试图片
    const existingImages = await Gallery.countDocuments()
    if (existingImages === 0) {
      const testImages = await Gallery.create([
        {
          title: '示例图片1',
          description: '这是一张示例图片',
          thumbnail: '/uploads/gallery/thumbnails/sample1.jpg',
          fullSize: '/uploads/gallery/sample1.jpg',
          category: '摄影',
          status: 'published',
          width: 1920,
          height: 1080
        },
        {
          title: '示例图片2',
          description: '另一张示例图片',
          thumbnail: '/uploads/gallery/thumbnails/sample2.png',
          fullSize: '/uploads/gallery/sample2.png',
          category: '设计',
          status: 'published',
          width: 1200,
          height: 800
        }
      ])
      console.log('✅ 测试图片创建成功:', testImages.length, '张')
    } else {
      console.log('✅ 图片数据已存在:', existingImages, '张')
    }

    // 5. 创建友情链接
    const existingLinks = await FriendLink.countDocuments()
    if (existingLinks === 0) {
      const testLinks = await FriendLink.create([
        {
          name: 'GitHub',
          url: 'https://github.com',
          description: '代码托管平台',
          status: 'active'
        },
        {
          name: 'Stack Overflow',
          url: 'https://stackoverflow.com',
          description: '程序员问答社区',
          status: 'active'
        }
      ])
      console.log('✅ 友情链接创建成功:', testLinks.length, '个')
    } else {
      console.log('✅ 友情链接已存在:', existingLinks, '个')
    }

    console.log('🎉 数据库初始化完成！')

  } catch (error) {
    console.error('❌ 初始化失败:', error.message)
  } finally {
    await mongoose.connection.close()
    console.log('🔒 数据库连接已关闭')
  }
}

initDatabase() 
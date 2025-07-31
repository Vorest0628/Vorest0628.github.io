const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const { auth, checkRole } = require('../middleware/auth')
const User = require('../models/User')
const Blog = require('../models/Blog')
const Document = require('../models/Document')
const Gallery = require('../models/Gallery')
const FriendLink = require('../models/FriendLink')
const Comment = require('../models/Comment')
const { ApiError } = require('../utils/error')

// 验证管理员权限
router.get('/verify', auth, checkRole('admin'), async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: '管理员权限验证成功',
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 管理员专用路由
 */

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'document') {
      cb(null, path.join(__dirname, '../uploads/documents'))
    } else if (file.fieldname === 'image') {
      cb(null, path.join(__dirname, '../uploads/gallery'))
    } else {
      cb(null, path.join(__dirname, '../uploads'))
    }
  },
  filename: function (req, file, cb) {
    // 使用时间戳和原文件名创建唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: function (req, file, cb) {
    // 根据字段名检查文件类型
    if (file.fieldname === 'document') {
      const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt/
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
      const mimetype = allowedTypes.test(file.mimetype)
      
      if (mimetype && extname) {
        return cb(null, true)
      } else {
        cb(new Error('文档文件类型不支持'))
      }
    } else if (file.fieldname === 'image') {
      const allowedTypes = /jpeg|jpg|png|gif/
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
      const mimetype = allowedTypes.test(file.mimetype)
      
      if (mimetype && extname) {
        return cb(null, true)
      } else {
        cb(new Error('图片文件类型不支持'))
      }
    } else {
      cb(null, true)
    }
  }
})

// 管理员控制台数据概览
router.get('/dashboard', auth, checkRole('admin'), async (req, res, next) => {
  try {
    // 获取各种统计数据
    const [
      totalUsers,
      totalBlogs,
      totalComments,
      totalGalleryItems,
      totalDocuments,
      totalFriendLinks,
      
      // 待审核内容统计
      pendingBlogs,
      pendingComments,
      pendingGalleryItems
    ] = await Promise.all([
      // 基础统计
      User.countDocuments(),
      Blog.countDocuments(),
      Comment.countDocuments(),
      Gallery.countDocuments(),
      Document.countDocuments(),
      FriendLink.countDocuments(),
      
      // 待审核统计
      Blog.countDocuments({ status: 'draft' }),
      Comment.countDocuments({ isPublic: false }),
      Gallery.countDocuments({ status: 'pending' })
    ])

    // 最近活动
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email createdAt role')

    const recentBlogs = await Blog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt author')
      .populate('author', 'username')

    const recentComments = await Comment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('content isPublic createdAt author')
      .populate('author', 'username')

    res.json({
      success: true,
      data: {
        stats: {
          users: totalUsers,
          blogs: totalBlogs,
          comments: totalComments,
          galleryItems: totalGalleryItems,
          documents: totalDocuments,
          friendLinks: totalFriendLinks
        },
        pending: {
          blogs: pendingBlogs,
          comments: pendingComments,
          galleryItems: pendingGalleryItems
        },
        recent: {
          users: recentUsers,
          blogs: recentBlogs,
          comments: recentComments
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// 用户管理 - 获取所有用户
router.get('/users', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query
    
    // 构建查询条件
    const query = {}
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    if (role) {
      query.role = role
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await User.countDocuments(query)

    // 转换数据格式，映射isActive到status
    const transformedUsers = users.map(user => {
      const userObj = user.toObject()
      // 映射 isActive 到 status: true -> 'approved', false -> 'pending'
      userObj.status = userObj.isActive ? 'approved' : 'pending'
      return userObj
    })

    res.json({
      success: true,
      data: {
        users: transformedUsers,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// 用户管理 - 更新用户角色和信息
router.put('/users/:id/role', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params
    const { role, username, email, password, status } = req.body

    // 验证角色
    if (role && !['user', 'admin'].includes(role)) {
      throw new ApiError(400, '无效的用户角色')
    }

    // 验证状态
    if (status && !['pending', 'approved'].includes(status)) {
      throw new ApiError(400, '无效的用户状态')
    }

    // 构建更新数据
    const updateData = {}
    if (role !== undefined) updateData.role = role
    if (username !== undefined) updateData.username = username
    if (email !== undefined) updateData.email = email
    
    // 映射状态：pending -> false, approved -> true
    if (status !== undefined) {
      updateData.isActive = status === 'approved'
    }

    // 如果提供了密码，需要加密
    if (password && password.trim() !== '') {
      const bcrypt = require('bcryptjs')
      const saltRounds = 10
      updateData.password = await bcrypt.hash(password.trim(), saltRounds)
    }

    // 验证邮箱唯一性（如果更新了邮箱）
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.trim(), 
        _id: { $ne: id } 
      })
      if (existingUser) {
        throw new ApiError(400, '该邮箱已被其他用户使用')
      }
    }

    // 验证用户名唯一性（如果更新了用户名）
    if (username) {
      const existingUser = await User.findOne({ 
        username: username.trim(), 
        _id: { $ne: id } 
      })
      if (existingUser) {
        throw new ApiError(400, '该用户名已被使用')
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, select: '-password' }
    )

    if (!user) {
      throw new ApiError(404, '用户不存在')
    }

    // 构建响应消息
    let message = '用户信息更新成功'
    if (role) {
      message += `，角色已更新为${role === 'admin' ? '管理员' : '普通用户'}`
    }
    if (password) {
      message += '，密码已重置'
    }

    res.json({
      success: true,
      data: { user },
      message
    })
  } catch (error) {
    next(error)
  }
})

// 用户管理 - 删除用户
router.delete('/users/:id', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params

    // 不能删除自己
    if (id === req.user.id) {
      throw new ApiError(400, '不能删除自己的账户')
    }

    const user = await User.findByIdAndDelete(id)

    if (!user) {
      throw new ApiError(404, '用户不存在')
    }

    res.json({
      success: true,
      message: '用户已删除'
    })
  } catch (error) {
    next(error)
  }
})

// 内容管理 - 获取所有博客文章
router.get('/blogs', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query
    
    const query = {}
    if (status) query.status = status
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ]
    }

    const blogs = await Blog.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Blog.countDocuments(query)

    res.json({
      success: true,
      data: {
        blogs,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// 内容管理 - 创建博客文章
router.post('/blogs', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { title, excerpt, content, category, tags, status = 'draft' } = req.body

    // 验证必填字段
    if (!title || !excerpt || !content || !category) {
      throw new ApiError(400, '标题、摘要、内容和分类不能为空')
    }

    // 设置置顶优先级
    const pinnedPriority = status === 'pinned' ? 1 : 0

    // 创建博客文章
    const blog = new Blog({
      title,
      excerpt,
      content,
      category,
      tags: Array.isArray(tags) ? tags : [],
      status,
      pinnedPriority,
      author: req.user.id
    })

    await blog.save()

    // 返回带有作者信息的博客
    const populatedBlog = await Blog.findById(blog._id).populate('author', 'username')

    res.status(201).json({
      success: true,
      data: { blog: populatedBlog },
      message: '博客文章创建成功'
    })
  } catch (error) {
    next(error)
  }
})

// 内容管理 - 更新博客文章
router.put('/blogs/:id', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params
    const { title, excerpt, content, category, tags, status } = req.body

    // 验证必填字段
    if (!title || !excerpt || !content || !category) {
      throw new ApiError(400, '标题、摘要、内容和分类不能为空')
    }

    const updateData = {
      title,
      excerpt,
      content,
      category,
      tags: Array.isArray(tags) ? tags : [],
    }

    if (status) {
      updateData.status = status
      // 设置置顶优先级
      updateData.pinnedPriority = status === 'pinned' ? 1 : 0
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'username')

    if (!blog) {
      throw new ApiError(404, '博客文章不存在')
    }

    res.json({
      success: true,
      data: { blog },
      message: '博客文章更新成功'
    })
  } catch (error) {
    next(error)
  }
})

// 内容管理 - 更新博客状态
router.put('/blogs/:id/status', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['draft', 'published', 'pinned'].includes(status)) {
      throw new ApiError(400, '无效的博客状态')
    }

    // 如果设置为置顶，给一个默认的置顶优先级
    const updateData = { status }
    if (status === 'pinned') {
      updateData.pinnedPriority = 1 // 默认置顶优先级
    } else {
      updateData.pinnedPriority = 0 // 非置顶状态重置优先级
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('author', 'username')

    if (!blog) {
      throw new ApiError(404, '博客文章不存在')
    }

    res.json({
      success: true,
      data: { blog },
      message: `博客状态已更新为${status}`
    })
  } catch (error) {
    next(error)
  }
})

// 内容管理 - 删除博客文章
router.delete('/blogs/:id', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params

    const blog = await Blog.findByIdAndDelete(id)

    if (!blog) {
      throw new ApiError(404, '博客文章不存在')
    }

    res.json({
      success: true,
      message: '博客文章已删除'
    })
  } catch (error) {
    next(error)
  }
})

// 评论管理 - 获取所有评论
router.get('/comments', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isPublic, search, targetType } = req.query
    
    const query = {}
    if (isPublic !== undefined) query.isPublic = isPublic === 'true'
    if (targetType) query.targetType = targetType
    if (search) {
      query.content = { $regex: search, $options: 'i' }
    }

    // 先获取基本评论数据
    const comments = await Comment.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Comment.countDocuments(query)

    // 手动处理targetId的populate，避免General类型报错
    const commentsWithTitle = await Promise.all(comments.map(async (comment) => {
      const commentObj = comment.toObject()
      
      try {
        // 只对非General类型的评论进行populate
        if (commentObj.targetType !== 'General' && commentObj.targetId) {
          let targetModel
          switch (commentObj.targetType) {
            case 'Blog':
              targetModel = require('../models/Blog')
              break
            case 'Document':
              targetModel = require('../models/Document')
              break
            case 'Gallery':
              targetModel = require('../models/Gallery')
              break
            default:
              targetModel = null
          }
          
          if (targetModel) {
            const targetObj = await targetModel.findById(commentObj.targetId).select('title')
            if (targetObj && targetObj.title) {
              commentObj.targetTitle = targetObj.title
            } else {
              commentObj.targetTitle = '内容已删除'
            }
          } else {
            commentObj.targetTitle = ''
          }
        } else if (commentObj.targetType === 'General') {
          // General类型设置为留言板
          commentObj.targetTitle = '留言板'
        } else {
          commentObj.targetTitle = ''
        }
      } catch (err) {
        console.warn('获取目标标题失败:', err.message)
        commentObj.targetTitle = commentObj.targetType === 'General' ? '留言板' : ''
      }
      
      return commentObj
    }))

    res.json({
      success: true,
      data: {
        comments: commentsWithTitle,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// 评论管理 - 更新评论可见性
router.put('/comments/:id/visibility', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params
    const { isPublic } = req.body

    if (typeof isPublic !== 'boolean') {
      throw new ApiError(400, '无效的可见性设置')
    }

    const comment = await Comment.findByIdAndUpdate(
      id,
      { isPublic },
      { new: true }
    ).populate('author', 'username')

    if (!comment) {
      throw new ApiError(404, '评论不存在')
    }

    res.json({
      success: true,
      data: { comment },
      message: `评论已${isPublic ? '设为公开' : '设为私有'}`
    })
  } catch (error) {
    next(error)
  }
})

// 评论管理 - 删除评论
router.delete('/comments/:id', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params

    const comment = await Comment.findByIdAndDelete(id)

    if (!comment) {
      throw new ApiError(404, '评论不存在')
    }

    res.json({
      success: true,
      message: '评论已删除'
    })
  } catch (error) {
    next(error)
  }
})

// 图库管理 - 获取所有图片
router.get('/gallery', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, status } = req.query
    
    let query = {}
    if (category) {
      query.category = category
    }
    if (status) {
      query.status = status
    }

    const images = await Gallery.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Gallery.countDocuments(query)

    res.json({
      success: true,
      data: {
        images,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// 图片上传
router.post('/gallery/upload', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { title, description, category, secondaryTags, status = 'draft' } = req.body
    
    // 这里应该处理文件上传，暂时使用占位符路径
    const imageData = {
      title: title || '未命名图片',
      description: description || '',
      category: category || '摄影',
      secondaryTags: Array.isArray(secondaryTags) ? secondaryTags : [],
      status,
      thumbnail: '/uploads/gallery/thumbnails/placeholder.jpg',
      fullSize: '/uploads/gallery/full/placeholder.jpg',
      author: req.user.username
    }

    const image = new Gallery(imageData)
    await image.save()

    res.json({
      success: true,
      data: image,
      message: '图片上传成功'
    })
  } catch (error) {
    next(error)
  }
})

// 更新图片信息
router.put('/gallery/:id', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body
    
    const image = await Gallery.findByIdAndUpdate(id, updateData, { new: true })
    
    if (!image) {
      throw new ApiError(404, '图片不存在')
    }

    res.json({
      success: true,
      data: image,
      message: '图片信息更新成功'
    })
  } catch (error) {
    next(error)
  }
})

// 删除图片
router.delete('/gallery/:id', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params
    
    const image = await Gallery.findByIdAndDelete(id)
    
    if (!image) {
      throw new ApiError(404, '图片不存在')
    }

    res.json({
      success: true,
      message: '图片删除成功'
    })
  } catch (error) {
    next(error)
  }
})

// 文档管理 - 获取所有文档
router.get('/documents', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query
    
    const documents = await Document.find({})
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Document.countDocuments()

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// 创建文档
router.post('/documents', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const documentData = {
      ...req.body,
      author: req.user.username
    }
    
    const document = new Document(documentData)
    await document.save()

    res.json({
      success: true,
      data: document,
      message: '文档创建成功'
    })
  } catch (error) {
    next(error)
  }
})

// 更新文档
router.put('/documents/:id', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body
    
    const document = await Document.findByIdAndUpdate(id, updateData, { new: true })
    
    if (!document) {
      throw new ApiError(404, '文档不存在')
    }

    res.json({
      success: true,
      data: document,
      message: '文档更新成功'
    })
  } catch (error) {
    next(error)
  }
})

// 删除文档
router.delete('/documents/:id', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params
    
    const document = await Document.findByIdAndDelete(id)
    
    if (!document) {
      throw new ApiError(404, '文档不存在')
    }

    res.json({
      success: true,
      message: '文档删除成功'
    })
  } catch (error) {
    next(error)
  }
})

// 注意：文档上传功能已移至 /api/documents/upload 路由

// 友链管理 - 获取所有友链
router.get('/friendlinks', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    
    let query = {}
    if (status) {
      query.status = status
    }

    const friendLinks = await FriendLink.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await FriendLink.countDocuments(query)

    res.json({
      success: true,
      data: {
        friendLinks,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// 添加友链
router.post('/friendlinks', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { name, url, description, status = 'pending' } = req.body

    if (!name || !url) {
      throw new ApiError(400, '友链名称和URL是必填项')
    }

    const existingLink = await FriendLink.findOne({ url })
    if (existingLink) {
      throw new ApiError(400, '该URL已存在')
    }

    const friendLink = new FriendLink({
      name: name.trim(),
      url: url.trim(),
      description: description || '',
      status,
      author: req.user.username
    })
    await friendLink.save()

    res.json({
      success: true,
      data: friendLink,
      message: '友链添加成功'
    })
  } catch (error) {
    next(error)
  }
})

// 更新友链状态
router.put('/friendlinks/:id/status', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw new ApiError(400, '无效的友链状态')
    }

    const friendLink = await FriendLink.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )

    if (!friendLink) {
      throw new ApiError(404, '友链不存在')
    }

    res.json({
      success: true,
      data: { friendLink },
      message: `友链状态已更新为${status}`
    })
  } catch (error) {
    next(error)
  }
})

// 删除友链
router.delete('/friendlinks/:id', auth, checkRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params

    const friendLink = await FriendLink.findByIdAndDelete(id)

    if (!friendLink) {
      throw new ApiError(404, '友链不存在')
    }

    res.json({
      success: true,
      message: '友链已删除'
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router 
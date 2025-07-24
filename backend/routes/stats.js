const express = require('express')
const router = express.Router()
const Blog = require('../models/Blog')
const Comment = require('../models/Comment')
const Gallery = require('../models/Gallery')

/**
 * 公开统计API
 * 用于网站侧边栏等前端组件显示统计信息
 */

// 获取网站统计数据
router.get('/', async (req, res, next) => {
  try {
    const Document = require('../models/Document')
    
    const [
      totalBlogs,
      totalComments,
      totalGalleryItems,
      totalDocuments
    ] = await Promise.all([
      Blog.countDocuments({ status: 'published' }),
      Comment.countDocuments({ status: 'approved' }),
      Gallery.countDocuments({ status: 'published' }),
      Document.countDocuments({ status: 'published' })
    ])

    res.json({
      success: true,
      data: {
        visitCount: 1234, // 暂时设为固定值，后续可以添加访问统计
        blogsCount: totalBlogs,
        commentsCount: totalComments,
        documentsCount: totalDocuments,
        imagesCount: totalGalleryItems,
        songsCount: 0, // 暂时设为0，后续可以添加音乐模块
        totalContent: totalBlogs + totalDocuments + totalGalleryItems
      }
    })
  } catch (error) {
    next(error)
  }
})

// 获取热门内容
router.get('/popular', async (req, res, next) => {
  try {
    const [
      recentBlogs,
      latestComments
    ] = await Promise.all([
      Blog.find({ status: 'published' })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('title slug createdAt'),
      Comment.find({ status: 'approved' })
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('content createdAt author')
    ])

    res.json({
      success: true,
      data: {
        recentBlogs,
        latestComments
      }
    })
  } catch (error) {
    next(error)
  }
})

// 记录访问统计（示例接口）
router.post('/visit', async (req, res, next) => {
  try {
    // 这里可以实现访问统计逻辑
    // 目前只返回成功状态
    res.json({
      success: true,
      message: '访问记录成功'
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router 
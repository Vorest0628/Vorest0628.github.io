const express = require('express')
const router = express.Router()
const Blog = require('../models/Blog')
const Comment = require('../models/Comment')
const Gallery = require('../models/Gallery')
const Visit = require('../models/Visit')

/**
 * 公开统计API路由配置
 * 用于网站侧边栏等前端组件显示统计信息
 * /api/stats 获取网站统计数据 get (不需要认证)
 * /api/stats/popular 获取热门内容 get (不需要认证)
 * /api/stats/visit 记录访问统计 post (不需要认证)
 * 功能：
 * - 获取网站基础数据统计（博客、评论、文档、图片数量）
 * - 获取热门内容和最新评论
 * - 记录用户访问统计
 * - 计算总访问量（基础访问量 + 实际访问记录 + 博客浏览次数）
 */
// 获取网站统计数据
router.get('/', async (req, res, next) => {
  try {
    const Document = require('../models/Document')
    
    // 获取基础数据统计
    const [
      totalBlogs,
      totalGalleryItems,
      totalDocuments
    ] = await Promise.all([
      Blog.countDocuments({ status: 'published' }),
      Gallery.countDocuments({ status: 'published' }),
      Document.countDocuments({ status: 'published' })
    ])

    // 获取评论统计 - 包括所有公开的评论和回复
    const totalComments = await Comment.countDocuments({ 
      isPublic: true 
    })

    // 获取博客评论数量（不包括留言板评论）
    const blogCommentsCount = await Comment.countDocuments({
      targetType: 'Blog',
      isPublic: true
    })

    // 获取留言板评论数量（包括回复）
    const messageBoardCommentsCount = await Comment.countDocuments({
      targetType: 'General',
      isPublic: true
    })

    // 计算总访问量（基于实际访问记录 + 博客浏览次数）
    const [totalVisits, totalBlogViews] = await Promise.all([
      Visit.countDocuments(),
      Blog.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
      ])
    ])
    
    const baseVisitCount = 500 // 基础访问量
    const visitCount = baseVisitCount + totalVisits + (totalBlogViews[0]?.totalViews || 0)

    res.json({
      success: true,
      data: {
        visitCount: visitCount,
        blogsCount: totalBlogs,
        commentsCount: totalComments, // 所有公开评论和回复的总数
        blogCommentsCount: blogCommentsCount, // 博客评论数量
        messageBoardCommentsCount: messageBoardCommentsCount, // 留言板评论数量
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
      Comment.find({ isPublic: true })
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('content createdAt author targetType')
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

// 记录访问统计
router.post('/visit', async (req, res, next) => {
  try {
    const { page, userAgent } = req.body
    const ip = req.ip || req.connection.remoteAddress
    
    // 创建访问记录
    const visit = new Visit({
      page: page || '/',
      userAgent: userAgent || '',
      ip: ip,
      timestamp: new Date()
    })
    
    await visit.save()
    
    res.json({
      success: true,
      message: '访问记录成功'
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router 
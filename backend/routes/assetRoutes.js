const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const BlogAsset = require('../models/BlogAsset')

/**
 * 资源访问路由配置
 * 定义了博客资源文件的公开访问接口
 * /api/blog/:blogId/:filename 重定向到Blob URL get
 * 功能：
 * - 公开访问博客资源文件
 * - 自动重定向到云存储的Blob URL
 * - 支持URL编码的文件名处理
 * - 缓存控制优化
 */
// 公开访问：/api/blog/:blogId/:filename -> 重定向到 Blob URL
router.get('/blog/:blogId/:filename', async (req, res, next) => {
  try {
    const { blogId, filename } = req.params

    // 将 blogId 转为 ObjectId，避免类型不匹配导致查不到
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ success: false, message: '无效的blogId' })
    }
    const blogObjectId = new mongoose.Types.ObjectId(blogId)

    // 处理 URL 编码的文件名（如 %7B...%7D.png）
    const decodedFilename = decodeURIComponent(filename)

    const asset = await BlogAsset.findOne({ blogId: blogObjectId, filename: decodedFilename })
    
    if (!asset) {
      return res.status(404).json({ success: false, message: '资源不存在' })
    }
    
    // 直接重定向到 Blob 公网地址
    res.set('Cache-Control', 'public, max-age=31536000, immutable')
    return res.redirect(302, asset.blobUrl)
  } catch (err) {
    next(err)
  }
})

module.exports = router

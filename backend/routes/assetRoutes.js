const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const BlogAsset = require('../models/BlogAsset')

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

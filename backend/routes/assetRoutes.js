const express = require('express')
const router = express.Router()
const BlogAsset = require('../models/BlogAsset')

// 公开访问：/api/blog/:blogId/:filename -> 重定向到 Blob URL
router.get('/blog/:blogId/:filename', async (req, res, next) => {
  try {
    const { blogId, filename } = req.params
    
    const asset = await BlogAsset.findOne({ blogId, filename })
    
    if (!asset) {
      return res.status(404).json({ success: false, message: '资源不存在' })
    }
    
    // 直接重定向到 Blob 公网地址
    return res.redirect(302, asset.blobUrl)
  } catch (err) {
    next(err)
  }
})

module.exports = router

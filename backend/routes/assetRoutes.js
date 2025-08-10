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
      if (req.query.__inspect === '1') {
        return res.status(400).json({
          success: false,
          message: '无效的blogId',
          input: { blogId, filename },
          normalized: { blogIdValid: false, filename: decodeURIComponent(filename || '') }
        })
      }
      return res.status(400).json({ success: false, message: '无效的blogId' })
    }
    const blogObjectId = new mongoose.Types.ObjectId(blogId)

    // 处理 URL 编码的文件名（如 %7B...%7D.png）
    const decodedFilename = decodeURIComponent(filename)

    const asset = await BlogAsset.findOne({ blogId: blogObjectId, filename: decodedFilename })

    // 调试模式：返回结构化信息，不做重定向
    if (req.query.__inspect === '1') {
      return res.json({
        success: !!asset,
        message: asset ? 'found' : 'not found',
        input: { blogId, filename },
        normalized: { blogId: blogObjectId.toString(), filename: decodedFilename },
        db: asset
          ? {
              id: asset._id,
              blobUrl: asset.blobUrl,
              title: asset.title,
              createdAt: asset.createdAt,
              updatedAt: asset.updatedAt
            }
          : null
      })
    }
    
    if (!asset) {
      return res.status(404).json({ success: false, message: '资源不存在' })
    }
    
    // 直接重定向到 Blob 公网地址
    res.set('Cache-Control', 'public, max-age=31536000, immutable')
    res.set('X-Asset-BlogId', blogObjectId.toString())
    res.set('X-Asset-Filename', decodedFilename)
    res.set('X-Asset-Found', 'true')
    return res.redirect(302, asset.blobUrl)
  } catch (err) {
    next(err)
  }
})

// 永远以 JSON 返回的调试端点（便于前端直接拉取信息）
router.get('/blog-debug/:blogId/:filename', async (req, res, next) => {
  try {
    const { blogId, filename } = req.params
    const decodedFilename = decodeURIComponent(filename)
    const isValid = mongoose.Types.ObjectId.isValid(blogId)
    const blogObjectId = isValid ? new mongoose.Types.ObjectId(blogId) : null
    const asset = isValid
      ? await BlogAsset.findOne({ blogId: blogObjectId, filename: decodedFilename })
      : null

    return res.json({
      success: !!asset,
      message: !isValid ? 'invalid blogId' : asset ? 'found' : 'not found',
      input: { blogId, filename },
      normalized: { blogId: isValid ? blogObjectId.toString() : null, filename: decodedFilename },
      db: asset
        ? { id: asset._id, blobUrl: asset.blobUrl, title: asset.title, createdAt: asset.createdAt, updatedAt: asset.updatedAt }
        : null
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router

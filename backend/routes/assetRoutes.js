const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const router = express.Router()
const BlogAsset = require('../models/BlogAsset')

const LOCAL_UPLOAD_PREFIX = '/uploads/'
const LOCAL_UPLOAD_ROOT = path.resolve(path.join(__dirname, '..', 'uploads'))

function resolveLocalAssetPath(urlPath = '') {
  const pathname = String(urlPath || '').trim()
  if (!pathname.startsWith(LOCAL_UPLOAD_PREFIX)) {
    return ''
  }

  const relativePath = pathname.slice(LOCAL_UPLOAD_PREFIX.length)
  const absolutePath = path.resolve(LOCAL_UPLOAD_ROOT, ...relativePath.split('/'))

  if (!absolutePath.startsWith(LOCAL_UPLOAD_ROOT)) {
    return ''
  }

  return absolutePath
}

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
    
    res.set('Cache-Control', 'public, max-age=31536000, immutable')

    // 本地存储时直接从后端发文件，避免生产环境额外暴露 /uploads 路径
    if (typeof asset.blobUrl === 'string' && asset.blobUrl.startsWith(LOCAL_UPLOAD_PREFIX)) {
      const localAssetPath = resolveLocalAssetPath(asset.blobUrl)
      if (!localAssetPath) {
        return res.status(400).json({ success: false, message: '资源路径无效' })
      }

      return res.sendFile(localAssetPath)
    }

    // 对象存储时保持重定向到公网地址
    return res.redirect(302, asset.blobUrl)
  } catch (err) {
    next(err)
  }
})

module.exports = router

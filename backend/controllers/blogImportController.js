// backend/controllers/blogImportController.js
const multer = require('multer')
const sharp = require('sharp')
const JSZip = require('jszip')
const mongoose = require('mongoose')
const { marked } = require('marked')
const { uploadBufferToBlob } = require('../utils/uploader')
const Blog = require('../models/Blog')
const BlogAsset = require('../models/BlogAsset')
const { MARKDOWN_IMAGE_REGEX, normalizeMarkdownImageDestinations } = require('../utils/markdown')

/*
blogImportController.js函数一览：
uploadImage 上传图片
importMarkdown 导入 Markdown
normalizeTags 标准化标签
replaceAsync 异步替换
*/

// 统一使用内存存储（兼容 Vercel）
const upload = multer({ storage: multer.memoryStorage() })

// 1) 图片直传：POST /api/uploads/images  (管理员)
//    form-data: image
const uploadImage = [
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: '请选择图片' })
      const { buffer, mimetype, originalname } = req.file
      const meta = await sharp(buffer).metadata()
      // 将文件名限制在 ASCII 安全字符，避免 Blob 存储对特殊字符路径返回 400
      const sanitizedName = String(originalname || 'image')
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, '-')
      const key = `blog-images/${Date.now()}-${sanitizedName}`
      const url = await uploadBufferToBlob(key, buffer, mimetype)
      return res.json({
        success: true,
        data: { url, width: meta.width || 0, height: meta.height || 0, contentType: mimetype }
      })
    } catch (err) { next(err) }
  }
]

// 2) 导入 Markdown：POST /admin/blogs/import-markdown (管理员)
//    form-data: markdown(必填)、assets(可选：zip 或多文件)
const importMarkdown = [
  upload.any(),
  async (req, res, next) => {
    try {
      //先收集资源，如markdown文件，zip文件，其他文件


      const mdFile = (req.files || []).find(f => /\.md$/i.test(f.originalname))
      if (!mdFile) return res.status(400).json({ success: false, message: '请提供 .md 文件' })
      let content = normalizeMarkdownImageDestinations(mdFile.buffer.toString('utf-8'))

      // 收集可用资源：来自 zip 或多文件
      const assetMap = new Map() // 相对路径(标准化) -> Buffer
      const otherFiles = (req.files || []).filter(f => f !== mdFile)
      
      // 遍历所有除 Markdown 文件外的其他上传文件，收集资源到 assetMap
      // 如果是 zip 文件，则解压并将其中的所有文件（非目录）加入 assetMap
      // 否则直接将文件以原名（路径分隔符标准化为 /）作为 key，buffer 作为 value 存入 assetMap
      for (const f of otherFiles) {
        if (/\.zip$/i.test(f.originalname)) { 
          const zip = await JSZip.loadAsync(f.buffer)
          const entries = Object.keys(zip.files)

          for (const name of entries) {
            const file = zip.files[name]
            if (!file.dir) {
              const buf = await file.async('nodebuffer')
              assetMap.set(name.replace(/\\/g, '/'), buf)
            }
          }
        } else {
          assetMap.set(f.originalname.replace(/\\/g, '/'), f.buffer)
        }
      }

      //找到blogid对应的博客，如果存在则更新，如果不存在则创建


      // 读取额外字段
      const { title = '', excerpt = '', category = '', status = 'draft', blogId: existingBlogId } = req.body
      const tags = normalizeTags(req.body.tags)

      let blog
      if (existingBlogId) {
        // 编辑模式：更新现有博客
        blog = await Blog.findById(existingBlogId)
        if (!blog) {
          return res.status(404).json({ success: false, message: '博客不存在' })
        }
        // 检查权限（仅作者或管理员可编辑）
        if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
          return res.status(403).json({ success: false, message: '无权限编辑此博客' })
        }
        blog.title = title || blog.title
        blog.excerpt = excerpt || blog.excerpt
        blog.category = category || blog.category
        blog.tags = tags.length ? tags : blog.tags
        blog.status = status || blog.status
        blog.content = content // 暂存原始内容，随后重写
        if (typeof req.body.coverImage === 'string') {
          blog.coverImage = req.body.coverImage
        }
      } else {
        // 创建模式：新建博客
        blog = await Blog.create({
          title: title || '未命名标题',
          excerpt: excerpt || '（无摘要）',
          content, // 暂存原始内容，随后重写
          category: category || '未分类',
          tags: tags,
          status,
          author: req.user.id,
          coverImage: typeof req.body.coverImage === 'string' ? req.body.coverImage : ''
        })
      }

      const warnings = []
      const blogId = String(blog._id)

      //重写图片链接
      let firstRewrittenUrl = ''
      const rewritten = await replaceAsync(content, MARKDOWN_IMAGE_REGEX, async (match, altText, angleHref, plainHref) => {
        const href = String(angleHref || plainHref || '').trim()
        console.log(`🔍 处理图片: ${match}`)
        console.log(`  - altText: "${altText}"`)
        console.log(`  - href: "${href}"`)
        
        const isRemote = /^(https?:|data:)/i.test(href)
        const isStoredRoute = /^\/api\/blog\//i.test(href) || /^\/uploads\//i.test(href)
        if (isRemote || isStoredRoute) {
          console.log(`  - 跳过绝对链接: ${href}`)
          return match
        }
        
        //本地img的链接
        const norm = String(href).trim().replace(/^\.\//, '').replace(/\\/g, '/').replace(/^\//, '')
        console.log(`  - 标准化路径: "${norm}"`)
        
        let buf = assetMap.get(norm)
        if (!buf) {
          const base = norm.split('/').pop()
          console.log(`  - 尝试 basename: "${base}"`)
          if (base) buf = assetMap.get(base)
        }
        
        if (!buf) {
          console.log(`  - ❌ 未找到资源: ${href}`)
          console.log(`  - 可用资源:`, Array.from(assetMap.keys()))
          warnings.push(`未找到资源: ${href}`)
          return match
        }
        
        const safeFilename = norm.split('/').pop() || `asset-${Date.now()}`
        console.log(`  - 安全文件名: "${safeFilename}"`)
        
        // 先检查是否已存在相同资源（编辑模式下复用）
        const blogObjectId = new mongoose.Types.ObjectId(blogId)
        let existingAsset = await BlogAsset.findOne({ blogId: blogObjectId, filename: safeFilename })
        let blobUrl
        
        if (existingAsset) {
          // 复用现有资源
          blobUrl = existingAsset.blobUrl
          console.log(`🔄 复用现有资源: ${safeFilename} -> ${blobUrl}`)
        } else {
          // 上传新资源
          const ext = (safeFilename.split('.').pop() || 'bin').toLowerCase()
          const mime = ext === 'png' ? 'image/png'
                    : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                    : ext === 'gif' ? 'image/gif'
                    : ext === 'webp' ? 'image/webp'
                    : 'application/octet-stream'
          const key = `blogs/${blogId}/images/${safeFilename}`
          console.log(`📤 上传新资源: ${key} (${mime})`)
          blobUrl = await uploadBufferToBlob(key, buf, mime, true) // 允许覆盖
          console.log(`📤 上传完成: ${safeFilename} -> ${blobUrl}`)
        }

        console.log(`💾 保存资源映射: blogId=${blogId}, filename=${safeFilename}`)
        const savedAsset = await BlogAsset.findOneAndUpdate(
          { blogId: blogObjectId, filename: safeFilename },
          { blogId: blogObjectId, filename: safeFilename, title: altText || '', blobUrl },
          { upsert: true, new: true }
        )
        console.log(`💾 保存结果:`, savedAsset ? `SUCCESS - ${savedAsset._id}` : 'FAILED')

        const routeUrl = `/api/blog/${blogId}/${encodeURIComponent(safeFilename)}`
        const publicUrl = typeof blobUrl === 'string' && blobUrl.startsWith('/uploads/')
          ? blobUrl
          : routeUrl

        console.log(`🔄 重写链接: ${href} -> ${publicUrl}`)
        if (!firstRewrittenUrl) firstRewrittenUrl = publicUrl
        return match.replace(href, publicUrl)
      })

      blog.content = rewritten
      // 若未显式传入封面且导入过程中成功重写了第一张图片，则使用其作为封面
      if ((!blog.coverImage || blog.coverImage === '') && firstRewrittenUrl) {
        blog.coverImage = firstRewrittenUrl
      }
      await blog.save()

      const populated = await Blog.findById(blog._id).populate('author', 'username')
      return res.json({ success: true, data: { blog: populated }, warnings })
    } catch (err) { next(err) }
  }
]

function normalizeTags(input) {
  if (!input) return []
  if (Array.isArray(input)) return input.map(x => String(x).trim()).filter(Boolean)
  return String(input).split(',').map(x => x.trim()).filter(Boolean)
}

async function replaceAsync(str, regex, asyncFn) {
  const promises = []
  str.replace(regex, (match, ...args) => {
    const p = asyncFn(match, ...args)
    promises.push(p)
    return match
  })
  const data = await Promise.all(promises)
  let i = 0
  return str.replace(regex, () => data[i++])
}

module.exports = { uploadImage, importMarkdown }

#!/usr/bin/env node
// backend/bin/optimize-existing-images.js
// 存量图片一次性优化：等比压缩 + 转 WebP，并同步更新数据库中的 URL
//
// 用法：
//   node backend/bin/optimize-existing-images.js [--dry-run]
//
// 说明：
// - 处理三类数据：Gallery 记录（fullSize/thumbnail）、BlogAsset 映射、Blog 正文/封面中的直传图片 URL
// - 已是 .webp 的一律跳过
// - 本地存储（/uploads/...）直接读盘；远程 URL（Vercel Blob 等）通过 HTTP 下载，
//   处理 Blob 存量需要环境中有 BLOB_READ_WRITE_TOKEN 且能访问 Blob 公网 URL
// - --dry-run 只扫描和预估，不写存储、不改数据库、不删旧文件
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

const DRY_RUN = process.argv.includes('--dry-run')

// 与 app.js 一致的本地环境变量加载顺序
const envCandidates = [
  path.join(__dirname, '..', 'setting.env'),
  path.join(__dirname, '..', '.env'),
  path.join(process.cwd(), 'setting.env'),
  path.join(process.cwd(), '.env')
]
for (const envPath of envCandidates) {
  if (!fs.existsSync(envPath)) continue
  dotenv.config({ path: envPath, override: false })
}

const mongoUri = [process.env.MONGODB_URI, process.env.MONGO_URI, process.env.MONGO_URL]
  .find(value => typeof value === 'string' && value.trim())
if (!mongoUri) {
  console.error('未检测到 MONGODB_URI 环境变量，无法连接数据库。')
  process.exit(1)
}

const { uploadBuffer, deleteStoredFile } = require('../utils/storage')
const { optimizeImage, toWebpFilename } = require('../utils/imageProcessor')
const Gallery = require('../models/Gallery')
const Blog = require('../models/Blog')
const BlogAsset = require('../models/BlogAsset')

const UPLOAD_ROOT = path.resolve(path.join(__dirname, '..', 'uploads'))
const LOCAL_UPLOAD_PREFIX = '/uploads/'

const stats = {
  processed: 0,
  skipped: 0,
  failed: 0,
  srcBytes: 0,
  outBytes: 0
}

function isWebpUrl(url) {
  try {
    const pathname = url.startsWith(LOCAL_UPLOAD_PREFIX) ? url : new URL(url).pathname
    return /\.webp$/i.test(pathname)
  } catch {
    return false
  }
}

async function readSourceBuffer(url) {
  if (url.startsWith(LOCAL_UPLOAD_PREFIX)) {
    const relative = url.slice(LOCAL_UPLOAD_PREFIX.length)
    const absolutePath = path.resolve(UPLOAD_ROOT, ...relative.split('/'))
    if (!absolutePath.startsWith(UPLOAD_ROOT)) {
      throw new Error(`路径越界: ${url}`)
    }
    return fs.promises.readFile(absolutePath)
  }
  if (/^https?:\/\//i.test(url)) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`下载失败 HTTP ${res.status}: ${url}`)
    return Buffer.from(await res.arrayBuffer())
  }
  throw new Error(`不支持的 URL: ${url}`)
}

function urlToStorageKey(url) {
  if (url.startsWith(LOCAL_UPLOAD_PREFIX)) {
    return url.slice(LOCAL_UPLOAD_PREFIX.length)
  }
  return new URL(url).pathname.replace(/^\/+/, '')
}

/**
 * 优化单个 URL 对应的图片。已是 WebP 返回 null（跳过）。
 * @returns {Promise<{ url: string, width: number, height: number, srcBytes: number, outBytes: number } | null>}
 */
async function optimizeUrl(url, options) {
  if (!url || typeof url !== 'string') return null
  if (isWebpUrl(url)) return null

  const srcBuffer = await readSourceBuffer(url)
  const optimized = await optimizeImage(srcBuffer, options)
  const newKey = toWebpFilename(urlToStorageKey(url))

  if (DRY_RUN) {
    return {
      url: `[dry-run] ${newKey}`,
      width: optimized.width,
      height: optimized.height,
      srcBytes: srcBuffer.length,
      outBytes: optimized.buffer.length
    }
  }

  const result = await uploadBuffer(newKey, optimized.buffer, {
    contentType: 'image/webp',
    allowOverwrite: true
  })

  return {
    url: result.url,
    width: optimized.width,
    height: optimized.height,
    srcBytes: srcBuffer.length,
    outBytes: optimized.buffer.length
  }
}

function recordSuccess(result) {
  stats.processed += 1
  stats.srcBytes += result.srcBytes
  stats.outBytes += result.outBytes
}

// 1) Gallery：fullSize（1600px/q80）与 thumbnail（400px/q75）
async function processGallery() {
  const images = await Gallery.find()
  console.log(`\n[Gallery] 共 ${images.length} 条记录`)

  for (const image of images) {
    try {
      let dirty = false

      const full = await optimizeUrl(image.fullSize, { maxEdge: 1600, quality: 80 })
      if (full) {
        console.log(`  fullSize: ${image.fullSize} -> ${full.url} (${full.srcBytes} -> ${full.outBytes} bytes)`)
        if (!DRY_RUN) {
          const oldUrl = image.fullSize
          image.fullSize = full.url
          image.width = full.width
          image.height = full.height
          await deleteStoredFile(oldUrl)
        }
        recordSuccess(full)
        dirty = true
      } else {
        stats.skipped += 1
      }

      const thumb = await optimizeUrl(image.thumbnail, { maxEdge: 400, quality: 75 })
      if (thumb) {
        console.log(`  thumbnail: ${image.thumbnail} -> ${thumb.url} (${thumb.srcBytes} -> ${thumb.outBytes} bytes)`)
        if (!DRY_RUN) {
          const oldUrl = image.thumbnail
          image.thumbnail = thumb.url
          await deleteStoredFile(oldUrl)
        }
        recordSuccess(thumb)
        dirty = true
      } else {
        stats.skipped += 1
      }

      if (dirty && !DRY_RUN) await image.save()
    } catch (error) {
      stats.failed += 1
      console.warn(`  [失败] Gallery ${image._id}: ${error.message}`)
    }
  }
}

// 2) BlogAsset：处理后文件名扩展名变化，需要同步替换 Blog 正文/封面中的引用
async function processBlogAssets() {
  const assets = await BlogAsset.find()
  console.log(`\n[BlogAsset] 共 ${assets.length} 条记录`)

  for (const asset of assets) {
    try {
      const result = await optimizeUrl(asset.blobUrl, { maxEdge: 1600, quality: 80 })
      if (!result) {
        stats.skipped += 1
        continue
      }

      const oldFilename = asset.filename
      const newFilename = toWebpFilename(oldFilename)
      const blogId = String(asset.blogId)
      const newRouteUrl = `/api/blog/${blogId}/${encodeURIComponent(newFilename)}`
      const newPublicUrl = result.url.startsWith(LOCAL_UPLOAD_PREFIX) ? result.url : newRouteUrl

      console.log(`  ${oldFilename}: ${asset.blobUrl} -> ${newPublicUrl} (${result.srcBytes} -> ${result.outBytes} bytes)`)

      if (!DRY_RUN) {
        const oldBlobUrl = asset.blobUrl

        asset.filename = newFilename
        asset.blobUrl = result.url
        await asset.save()

        // 替换 Blog 正文/封面里的旧引用（route URL 的编码/未编码形态 + 旧存储 URL）
        const blog = await Blog.findById(asset.blogId)
        if (blog) {
          const oldVariants = [
            oldBlobUrl,
            `/api/blog/${blogId}/${encodeURIComponent(oldFilename)}`,
            `/api/blog/${blogId}/${oldFilename}`
          ]
          let contentDirty = false
          for (const oldVariant of oldVariants) {
            if (!oldVariant) continue
            if (typeof blog.content === 'string' && blog.content.includes(oldVariant)) {
              blog.content = blog.content.split(oldVariant).join(newPublicUrl)
              contentDirty = true
            }
            if (typeof blog.coverImage === 'string' && blog.coverImage.includes(oldVariant)) {
              blog.coverImage = blog.coverImage.split(oldVariant).join(newPublicUrl)
              contentDirty = true
            }
          }
          if (contentDirty) await blog.save()
        }

        await deleteStoredFile(oldBlobUrl)
      }

      recordSuccess(result)
    } catch (error) {
      stats.failed += 1
      console.warn(`  [失败] BlogAsset ${asset._id} (${asset.filename}): ${error.message}`)
    }
  }
}

// 3) Blog 正文/封面中的直传图片 URL（/uploads/blog-images/... 或远程 URL）
//    这类文件没有 DB 记录做单一来源，可能被多处引用，因此不删除旧文件
const CONTENT_IMAGE_REGEX = /(?:\/uploads\/|https?:\/\/)[^\s)"'<>]+\.(?:png|jpe?g|gif)(?:\?[^\s)"'<>]*)?/gi

async function replaceInText(text, cache) {
  if (typeof text !== 'string' || !text) return { text, changed: false }
  const matches = text.match(CONTENT_IMAGE_REGEX)
  if (!matches) return { text, changed: false }

  let changed = false
  let newText = text

  for (const url of new Set(matches)) {
    try {
      if (!cache.has(url)) {
        cache.set(url, await optimizeUrl(url, { maxEdge: 1600, quality: 80 }))
      }
      const result = cache.get(url)
      if (!result) continue

      console.log(`  正文引用: ${url} -> ${result.url} (${result.srcBytes} -> ${result.outBytes} bytes)`)
      if (!DRY_RUN) {
        newText = newText.split(url).join(result.url)
      }
      recordSuccess(result)
      changed = true
    } catch (error) {
      stats.failed += 1
      console.warn(`  [失败] 正文图片 ${url}: ${error.message}`)
    }
  }

  return { text: newText, changed }
}

async function processBlogContents() {
  const blogs = await Blog.find()
  console.log(`\n[Blog 正文/封面] 共 ${blogs.length} 条记录`)

  const cache = new Map()
  for (const blog of blogs) {
    const contentResult = await replaceInText(blog.content, cache)
    const coverResult = await replaceInText(blog.coverImage, cache)

    if ((contentResult.changed || coverResult.changed) && !DRY_RUN) {
      blog.content = contentResult.text
      blog.coverImage = coverResult.text
      await blog.save()
    }
  }
}

async function main() {
  console.log(`存量图片优化脚本${DRY_RUN ? '（dry-run，仅扫描）' : ''}`)
  await mongoose.connect(mongoUri.trim())

  await processGallery()
  await processBlogAssets()
  await processBlogContents()

  const savedMB = ((stats.srcBytes - stats.outBytes) / 1024 / 1024).toFixed(2)
  console.log('\n========== 完成 ==========')
  console.log(`处理: ${stats.processed}，跳过(已是 WebP): ${stats.skipped}，失败: ${stats.failed}`)
  console.log(`体积: ${(stats.srcBytes / 1024 / 1024).toFixed(2)} MB -> ${(stats.outBytes / 1024 / 1024).toFixed(2)} MB，节省 ${savedMB} MB`)
  if (DRY_RUN) console.log('（dry-run 未做任何写入；去掉 --dry-run 正式执行）')

  await mongoose.connection.close()
}

main().catch(async (error) => {
  console.error('脚本执行失败:', error)
  try { await mongoose.connection.close() } catch {}
  process.exit(1)
})

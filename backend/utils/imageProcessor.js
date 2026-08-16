// backend/utils/imageProcessor.js
// 图片优化：等比缩放（只缩不放）+ 转 WebP，供各上传路径与存量处理脚本共用
const sharp = require('sharp')

const OPTIMIZABLE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp'])

/**
 * 判断文件是否为可优化的位图（svg、文档等除外）
 * @param {string} filenameOrMime 文件名或 mimetype
 */
function isOptimizableImage(filenameOrMime = '') {
  const value = String(filenameOrMime).toLowerCase()
  if (value.startsWith('image/')) {
    const subtype = value.slice('image/'.length)
    return OPTIMIZABLE_EXTENSIONS.has(subtype === 'jpeg' ? 'jpeg' : subtype)
  }
  const ext = value.split('?')[0].split('.').pop()
  return OPTIMIZABLE_EXTENSIONS.has(ext)
}

/**
 * 将文件扩展名替换为 .webp
 * @param {string} filename
 */
function toWebpFilename(filename = '') {
  const name = String(filename)
  const base = name.replace(/\.[^.]+$/, '')
  return `${base || 'image'}.webp`
}

/**
 * 等比压缩并转为 WebP（GIF 保留动画）
 * @param {Buffer} inputBuffer 原始图片内容
 * @param {{ maxEdge?: number, quality?: number }} options maxEdge 最长边上限（默认 1600，只缩不放）
 * @returns {Promise<{ buffer: Buffer, width: number, height: number, contentType: string }>}
 */
async function optimizeImage(inputBuffer, { maxEdge = 1600, quality = 80 } = {}) {
  const { data, info } = await sharp(inputBuffer, { animated: true })
    .rotate()
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true })

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    contentType: 'image/webp'
  }
}

module.exports = {
  optimizeImage,
  toWebpFilename,
  isOptimizableImage
}

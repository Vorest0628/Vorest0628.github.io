// backend/utils/uploader.js
const { put } = require('@vercel/blob')

async function uploadBufferToBlob(key, buffer, contentType, allowOverwrite = false) {
  // key 建议包含子目录与时间戳，如 'gallery/full/1699999999999-filename.png'
  const result = await put(key, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: !allowOverwrite // 如果允许覆盖则不添加随机后缀
  })
  // result.url 为可公网访问的 URL
  return result.url
}

module.exports = { uploadBufferToBlob }
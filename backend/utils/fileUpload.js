const multer = require('multer')
const path = require('path')
const fs = require('fs')

/*
fileUpload.js函数一览：
isVercel 检查是否在Vercel环境中
ensureDirectory 确保上传目录存在
createUpload 通用文件上传配置
imageUpload 图片上传配置
documentUpload 文档上传配置
avatarUpload 头像上传配置
deleteFile 删除文件
getFileSize 获取文件大小
formatFileSize 格式化文件大小
*/

// 检查是否在Vercel环境中
const isVercel = process.env.VERCEL === '1'

// 确保上传目录存在
const ensureDirectory = (dir) => {
  if (isVercel) {
    console.log('⚠️ Vercel环境不支持文件系统写入，跳过目录创建:', dir)
    return
  }
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// 通用文件上传配置
const createUpload = (uploadPath, allowedTypes, maxSize = 10 * 1024 * 1024) => {
  // 对于Vercel部署，始终使用内存存储配合Blob存储
  // 本地开发也可以使用内存存储，因为现在所有文件都会上传到Vercel Blob
  console.log('📝 使用内存存储配合Vercel Blob，解决文件持久化问题')
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxSize
    },
    fileFilter: (req, file, cb) => {
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
      
      // 对于某些文件类型，MIME类型可能不准确，所以主要检查扩展名
      // 特别是 .md 和 .txt 文件
      if (extname) {
        return cb(null, true)
      } else {
        console.log('❌ 文件类型验证失败:', {
          filename: file.originalname,
          mimetype: file.mimetype,
          extension: path.extname(file.originalname).toLowerCase()
        })
        cb(new Error('文件类型不支持'))
      }
    }
  })
}

// 图片上传配置
const imageUpload = createUpload(
  'uploads/gallery/',
  /jpeg|jpg|png|gif|webp/,
  10 * 1024 * 1024 // 10MB
)

// 文档上传配置
const documentUpload = createUpload(
  'uploads/documents/',
  /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|md/,
  50 * 1024 * 1024 // 50MB
)

// 头像上传配置
const avatarUpload = createUpload(
  'uploads/avatars/',
  /jpeg|jpg|png/,
  2 * 1024 * 1024 // 2MB
)

// 删除文件
const deleteFile = (filePath) => {
  if (isVercel) {
    console.log('⚠️ Vercel环境不支持文件删除:', filePath)
    return Promise.resolve()
  }
  
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// 获取文件大小
const getFileSize = (filePath) => {
  if (isVercel) {
    console.log('⚠️ Vercel环境不支持文件系统操作:', filePath)
    return Promise.resolve(0)
  }
  
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        reject(err)
      } else {
        resolve(stats.size)
      }
    })
  })
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

module.exports = {
  createUpload,
  imageUpload,
  documentUpload,
  avatarUpload,
  deleteFile,
  getFileSize,
  formatFileSize,
  ensureDirectory
} 
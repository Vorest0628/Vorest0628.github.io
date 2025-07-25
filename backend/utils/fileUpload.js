const multer = require('multer')
const path = require('path')
const fs = require('fs')

// 检查是否在Vercel环境中
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'

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
  // 在Vercel环境中，使用内存存储而不是磁盘存储
  if (isVercel) {
    console.log('⚠️ Vercel环境使用内存存储，文件上传功能受限')
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: maxSize
      },
      fileFilter: (req, file, cb) => {
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
        const mimetype = allowedTypes.test(file.mimetype)
        
        if (mimetype && extname) {
          return cb(null, true)
        } else {
          cb(new Error('文件类型不支持'))
        }
      }
    })
  }
  
  // 确保上传目录存在
  ensureDirectory(uploadPath)
  
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath)
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
  })

  return multer({
    storage,
    limits: {
      fileSize: maxSize
    },
    fileFilter: (req, file, cb) => {
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
      const mimetype = allowedTypes.test(file.mimetype)
      
      if (mimetype && extname) {
        return cb(null, true)
      } else {
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
  /pdf|doc|docx|ppt|pptx|xls|xlsx|txt/,
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
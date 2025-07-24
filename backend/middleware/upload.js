const multer = require('multer')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const { ApiError } = require('../utils/error')

// 确保上传目录存在
const ensureUploadDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || 'uploads/'
    let subDir = ''
    
    // 根据文件类型决定子目录
    if (file.fieldname === 'avatar' || file.mimetype.startsWith('image/')) {
      subDir = 'images/'
    } else if (file.mimetype.startsWith('video/')) {
      subDir = 'videos/'
    } else {
      subDir = 'documents/'
    }
    
    const fullPath = path.join(uploadPath, subDir)
    ensureUploadDir(fullPath)
    cb(null, fullPath)
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const extension = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + extension)
  }
})

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的图片类型
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/
  // 允许的文档类型
  const allowedDocTypes = /pdf|doc|docx|ppt|pptx|txt|md|xlsx|xls/
  // 允许的视频类型
  const allowedVideoTypes = /mp4|avi|mov|wmv|flv/
  
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1)
  const mimeType = file.mimetype.toLowerCase()
  
  // 检查文件类型
  if (mimeType.startsWith('image/') && allowedImageTypes.test(fileExtension)) {
    cb(null, true)
  } else if (mimeType.startsWith('video/') && allowedVideoTypes.test(fileExtension)) {
    cb(null, true)
  } else if (allowedDocTypes.test(fileExtension)) {
    cb(null, true)
  } else {
    cb(new ApiError(400, '不支持的文件类型'), false)
  }
}

// 基础上传配置
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
    files: 10 // 最多10个文件
  }
})

// 图片上传中间件
exports.uploadImage = upload.single('image')

// 多图片上传中间件
exports.uploadImages = upload.array('images', 10)

// 头像上传中间件
exports.uploadAvatar = upload.single('avatar')

// 文档上传中间件
exports.uploadDocument = upload.single('document')

// 任意文件上传中间件
exports.uploadAny = upload.any()

// 图片处理中间件
exports.processImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next()
  }

  try {
    const { filename, path: filePath } = req.file
    const outputPath = path.join(path.dirname(filePath), 'processed-' + filename)

    // 使用sharp处理图片
    await sharp(filePath)
      .resize(1200, 1200, { // 最大尺寸限制
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 }) // 压缩质量
      .toFile(outputPath)

    // 删除原文件，使用处理后的文件
    fs.unlinkSync(filePath)
    req.file.path = outputPath
    req.file.filename = 'processed-' + filename

    next()
  } catch (error) {
    next(new ApiError(500, '图片处理失败'))
  }
}

// 头像处理中间件
exports.processAvatar = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next()
  }

  try {
    const { filename, path: filePath } = req.file
    const outputPath = path.join(path.dirname(filePath), 'avatar-' + filename)

    // 处理头像：固定尺寸，圆形裁剪
    await sharp(filePath)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toFile(outputPath)

    // 删除原文件，使用处理后的文件
    fs.unlinkSync(filePath)
    req.file.path = outputPath
    req.file.filename = 'avatar-' + filename

    next()
  } catch (error) {
    next(new ApiError(500, '头像处理失败'))
  }
}

// 文件上传错误处理中间件
exports.handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, '文件大小超出限制'))
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new ApiError(400, '文件数量超出限制'))
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new ApiError(400, '意外的文件字段'))
    }
  }
  next(error)
}

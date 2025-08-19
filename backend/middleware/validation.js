const { ApiError } = require('../utils/error')

/*
validation.js函数一览：
isValidEmail 验证邮箱格式
isValidPassword 验证密码格式
isValidUrl 验证URL格式
validateRegister 用户注册验证
validateLogin 用户登录验证
validateBlog 博客验证
validateComment 评论验证
validateSong 歌曲验证
validateFriendLink 友情链接验证
validateDocument 文档验证
validatePagination 分页参数验证
validateObjectId ID参数验证
*/

// 通用验证工具函数
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidPassword = (password) => {
  // 密码至少8位，包含字母和数字
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
  return passwordRegex.test(password)
}

const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// 用户注册验证
exports.validateRegister = (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body

  const errors = []

  // 用户名验证
  if (!username || typeof username !== 'string' || username.trim().length < 2) {
    errors.push('用户名至少需要2个字符')
  } else if (username.trim().length > 20) {
    errors.push('用户名不能超过20个字符')
  }

  // 邮箱验证
  if (!email || typeof email !== 'string') {
    errors.push('邮箱不能为空')
  } else if (!isValidEmail(email)) {
    errors.push('邮箱格式不正确')
  }

  // 密码验证
  if (!password || typeof password !== 'string') {
    errors.push('密码不能为空')
  } else if (!isValidPassword(password)) {
    errors.push('密码至少8位，必须包含字母和数字')
  }

  // 确认密码验证
  if (password !== confirmPassword) {
    errors.push('两次输入的密码不一致')
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors.join('; ')))
  }

  next()
}

// 用户登录验证
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body

  const errors = []

  if (!email || typeof email !== 'string') {
    errors.push('邮箱不能为空')
  } else if (!isValidEmail(email)) {
    errors.push('邮箱格式不正确')
  }

  if (!password || typeof password !== 'string') {
    errors.push('密码不能为空')
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors.join('; ')))
  }

  next()
}

// 博客验证
exports.validateBlog = (req, res, next) => {
  const { title, content, tag } = req.body

  const errors = []

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('博客标题不能为空')
  } else if (title.trim().length > 100) {
    errors.push('博客标题不能超过100个字符')
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    errors.push('博客内容不能为空')
  } else if (content.trim().length > 50000) {
    errors.push('博客内容不能超过50000个字符')
  }

  if (tag && typeof tag !== 'string') {
    errors.push('标签必须是字符串类型')
  } else if (tag && tag.length > 20) {
    errors.push('标签不能超过20个字符')
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors.join('; ')))
  }

  next()
}

// 评论验证
exports.validateComment = (req, res, next) => {
  const { content } = req.body

  const errors = []

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    errors.push('评论内容不能为空')
  } else if (content.trim().length > 500) {
    errors.push('评论内容不能超过500个字符')
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors.join('; ')))
  }

  next()
}

// 歌曲验证
exports.validateSong = (req, res, next) => {
  const { title, author, content, tag } = req.body

  const errors = []

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('歌曲标题不能为空')
  } else if (title.trim().length > 100) {
    errors.push('歌曲标题不能超过100个字符')
  }

  if (!author || typeof author !== 'string' || author.trim().length === 0) {
    errors.push('歌手名称不能为空')
  } else if (author.trim().length > 50) {
    errors.push('歌手名称不能超过50个字符')
  }

  if (content && typeof content !== 'string') {
    errors.push('歌曲描述必须是字符串类型')
  } else if (content && content.length > 1000) {
    errors.push('歌曲描述不能超过1000个字符')
  }

  if (tag && typeof tag !== 'string') {
    errors.push('标签必须是字符串类型')
  } else if (tag && tag.length > 20) {
    errors.push('标签不能超过20个字符')
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors.join('; ')))
  }

  next()
}

// 友情链接验证
exports.validateFriendLink = (req, res, next) => {
  const { name, url, intro, email } = req.body

  const errors = []

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('网站名称不能为空')
  } else if (name.trim().length > 30) {
    errors.push('网站名称不能超过30个字符')
  }

  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    errors.push('网站URL不能为空')
  } else if (!isValidUrl(url)) {
    errors.push('网站URL格式不正确')
  }

  if (intro && typeof intro !== 'string') {
    errors.push('网站介绍必须是字符串类型')
  } else if (intro && intro.length > 200) {
    errors.push('网站介绍不能超过200个字符')
  }

  if (email && typeof email !== 'string') {
    errors.push('邮箱必须是字符串类型')
  } else if (email && !isValidEmail(email)) {
    errors.push('邮箱格式不正确')
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors.join('; ')))
  }

  next()
}

// 文档验证
exports.validateDocument = (req, res, next) => {
  const { title, content, author, category, tags } = req.body

  const errors = []

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('文档标题不能为空')
  } else if (title.trim().length > 100) {
    errors.push('文档标题不能超过100个字符')
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    errors.push('文档内容不能为空')
  } else if (content.trim().length > 100000) {
    errors.push('文档内容不能超过100000个字符')
  }

  if (!author || typeof author !== 'string' || author.trim().length === 0) {
    errors.push('作者名称不能为空')
  } else if (author.trim().length > 30) {
    errors.push('作者名称不能超过30个字符')
  }

  if (category && typeof category !== 'string') {
    errors.push('分类必须是字符串类型')
  } else if (category && category.length > 30) {
    errors.push('分类名称不能超过30个字符')
  }

  if (tags && !Array.isArray(tags)) {
    errors.push('标签必须是数组类型')
  } else if (tags && tags.length > 10) {
    errors.push('标签数量不能超过10个')
  } else if (tags && tags.some(tag => typeof tag !== 'string' || tag.length > 20)) {
    errors.push('每个标签必须是字符串且不超过20个字符')
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors.join('; ')))
  }

  next()
}

// 分页参数验证
exports.validatePagination = (req, res, next) => {
  const { page, limit } = req.query

  if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return next(new ApiError(400, '页码必须是大于0的整数'))
  }

  if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return next(new ApiError(400, '每页数量必须是1-100之间的整数'))
  }

  next()
}

// ID参数验证
exports.validateObjectId = (req, res, next) => {
  const { id } = req.params
  
  // MongoDB ObjectId 格式验证
  const objectIdRegex = /^[0-9a-fA-F]{24}$/
  
  if (!id || !objectIdRegex.test(id)) {
    return next(new ApiError(400, '无效的ID格式'))
  }

  next()
}

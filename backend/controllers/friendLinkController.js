const FriendLink = require('../models/FriendLink')
const { ApiError } = require('../utils/error')
const { getFavicon } = require('../utils/favicon')

/*
friendLinkController.js函数一览：
getFriendLinks 获取友情链接列表
getFriendLinkById 获取单个友情链接详情
createFriendLink 创建新友情链接
updateFriendLink 更新友情链接
deleteFriendLink 删除友情链接
recordVisit 记录友链访问
previewFavicon 获取网站favicon预览
applyFriendLink 申请友情链接
*/

// 获取友情链接列表
exports.getFriendLinks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isActive, category } = req.query
    
    const query = {}
    if (isActive !== undefined) {
      query.isActive = isActive === 'true'
    }
    if (category) {
      query.category = category
    }

    const friendLinks = await FriendLink.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await FriendLink.countDocuments(query)

    res.json({
      success: true,
      data: {
        friendLinks,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// 获取单个友情链接详情
exports.getFriendLinkById = async (req, res, next) => {
  try {
    const friendLink = await FriendLink.findById(req.params.id)

    if (!friendLink) {
      throw new ApiError(404, '友情链接不存在')
    }

    res.json({
      success: true,
      data: { friendLink }
    })
  } catch (error) {
    next(error)
  }
}

// 创建新友情链接
exports.createFriendLink = async (req, res, next) => {
  try {
    const { name, description, url, avatar, email, contactInfo, category, isActive } = req.body

    if (!name || name.trim().length === 0) {
      throw new ApiError(400, '网站名称不能为空')
    }

    if (!url || url.trim().length === 0) {
      throw new ApiError(400, '网站URL不能为空')
    }

    // 格式化URL
    let formattedUrl = url.trim()
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      // 对于不带协议的URL，先尝试https
      formattedUrl = 'https://' + formattedUrl
    }

    // 检查URL是否已存在
    const existingLink = await FriendLink.findOne({ url: formattedUrl })
    if (existingLink) {
      throw new ApiError(400, '该网站链接已存在')
    }

    // 自动获取网站favicon（如果没有提供avatar）
    let finalAvatar = avatar?.trim() || ''
    
    if (!finalAvatar) {
      try {
        console.log(`🔍 自动获取网站 ${formattedUrl} 的favicon...`)
        const faviconResult = await getFavicon(formattedUrl)
        if (faviconResult.success) {
          finalAvatar = faviconResult.faviconUrl
          console.log(`✅ 自动获取favicon成功: ${finalAvatar}`)
        }
      } catch (error) {
        console.error('自动获取favicon失败:', error)
        // 失败时使用默认头像，不影响主流程
      }
    }

    const friendLinkData = {
      name: name.trim(),
      description: description?.trim() || '',
      url: formattedUrl,
      avatar: finalAvatar,
      email: email?.trim() || '',
      contactInfo: contactInfo?.trim() || '',
      category: category || '其他',
      isActive: isActive !== undefined ? isActive : false
    }

    const friendLink = await FriendLink.create(friendLinkData)

    res.status(201).json({
      success: true,
      data: { friendLink },
      message: '友情链接创建成功'
    })
  } catch (error) {
    next(error)
  }
}

// 更新友情链接
exports.updateFriendLink = async (req, res, next) => {
  try {
    const friendLink = await FriendLink.findById(req.params.id)

    if (!friendLink) {
      throw new ApiError(404, '友情链接不存在')
    }

    const { name, description, url, avatar, email, contactInfo, isActive, category } = req.body

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new ApiError(400, '网站名称不能为空')
      }
      friendLink.name = name.trim()
    }

    if (url !== undefined) {
      if (!url || url.trim().length === 0) {
        throw new ApiError(400, '网站URL不能为空')
      }
      
      // 格式化URL
      let formattedUrl = url.trim()
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl
      }

      // 检查URL是否已被其他链接使用
      const existingLink = await FriendLink.findOne({ 
        url: formattedUrl, 
        _id: { $ne: req.params.id } 
      })
      if (existingLink) {
        throw new ApiError(400, '该网站链接已被其他友链使用')
      }

      friendLink.url = formattedUrl
    }

    if (description !== undefined) {
      friendLink.description = description.trim()
    }

    if (avatar !== undefined) {
      // 如果avatar为空字符串，尝试自动获取favicon
      if (!avatar || avatar.trim() === '') {
        try {
          console.log(`🔍 自动获取网站 ${friendLink.url} 的favicon...`)
          const faviconResult = await getFavicon(friendLink.url)
          if (faviconResult.success) {
            friendLink.avatar = faviconResult.faviconUrl
            console.log(`✅ 自动获取favicon成功: ${faviconResult.faviconUrl}`)
          } else {
            friendLink.avatar = ''
          }
        } catch (error) {
          console.error('自动获取favicon失败:', error)
          friendLink.avatar = ''
        }
      } else {
      friendLink.avatar = avatar.trim()
      }
    }

    if (email !== undefined) {
      friendLink.email = email.trim()
    }

    if (contactInfo !== undefined) {
      friendLink.contactInfo = contactInfo.trim()
    }

    if (category !== undefined) {
      friendLink.category = category
    }

    if (isActive !== undefined) {
      friendLink.isActive = isActive
    }

    await friendLink.save()

    res.json({
      success: true,
      data: { friendLink },
      message: '友情链接更新成功'
    })
  } catch (error) {
    next(error)
  }
}

// 删除友情链接
exports.deleteFriendLink = async (req, res, next) => {
  try {
    const friendLink = await FriendLink.findById(req.params.id)

    if (!friendLink) {
      throw new ApiError(404, '友情链接不存在')
    }

    await FriendLink.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: '友情链接删除成功'
    })
  } catch (error) {
    next(error)
  }
}

// 记录友链访问
exports.recordVisit = async (req, res, next) => {
  try {
    const friendLink = await FriendLink.findById(req.params.id)

    if (!friendLink) {
      throw new ApiError(404, '友情链接不存在')
    }

    const newVisitCount = await friendLink.incrementVisit()

    res.json({
      success: true,
      data: { visitCount: newVisitCount },
      message: '访问记录成功'
    })
  } catch (error) {
    next(error)
  }
}

// 获取网站favicon预览（用于管理界面）
exports.previewFavicon = async (req, res, next) => {
  try {
    const { url } = req.query
    
    if (!url) {
      throw new ApiError(400, '请提供网站URL')
    }

    console.log(`🔍 预览网站favicon: ${url}`)
    const faviconResult = await getFavicon(url)
    
    res.json({
      success: true,
      data: faviconResult,
      message: faviconResult.success ? 'Favicon获取成功' : 'Favicon获取失败，将使用默认图标'
    })
  } catch (error) {
    next(error)
  }
}

// 申请友情链接（公开接口）
exports.applyFriendLink = async (req, res, next) => {
  try {
    const { name, description, url, avatar, email, contactInfo, category } = req.body

    if (!name || name.trim().length === 0) {
      throw new ApiError(400, '网站名称不能为空')
    }

    if (!url || url.trim().length === 0) {
      throw new ApiError(400, '网站URL不能为空')
    }

    if (!email || email.trim().length === 0) {
      throw new ApiError(400, '联系邮箱不能为空')
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      throw new ApiError(400, '邮箱格式不正确')
    }

    // 格式化URL
    let formattedUrl = url.trim()
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl
    }

    // 检查URL是否已存在
    const existingLink = await FriendLink.findOne({ url: formattedUrl })
    if (existingLink) {
      throw new ApiError(400, '该网站链接已存在，请检查是否已申请过')
    }

    const friendLinkData = {
      name: name.trim(),
      description: description?.trim() || '',
      url: formattedUrl,
      avatar: avatar?.trim() || '',
      email: email.trim(),
      contactInfo: contactInfo?.trim() || '',
      category: category || '其他',
      isActive: false // 申请的友链默认为待审核状态
    }

    const friendLink = await FriendLink.create(friendLinkData)

    res.status(201).json({
      success: true,
      data: { friendLink },
      message: '友情链接申请提交成功，等待管理员审核'
    })
  } catch (error) {
    next(error)
  }
}

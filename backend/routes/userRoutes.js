const express = require('express')
const router = express.Router()
const Comment = require('../models/Comment')
const User = require('../models/User')
const { auth } = require('../middleware/auth')
const { ApiError } = require('../utils/error')
const bcrypt = require('bcryptjs')

// 获取当前用户的统计数据
router.get('/stats', auth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId)

    if (!user) {
      throw new ApiError(404, '用户不存在')
    }

    // 并行获取用户统计数据
    const [
      myComments
    ] = await Promise.all([
      Comment.countDocuments({ author: userId })
    ])

    // 计算加入天数
    const joinDate = new Date(user.createdAt)
    const now = new Date()
    const joinDays = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24))

    res.json({
      success: true,
      data: {
        myComments,
        // 账户统计信息
        stats: {
          joinDays: joinDays > 0 ? joinDays : 1,
          totalComments: myComments,
          likesReceived: 0 // 暂时设为0，后续可以添加点赞功能
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// 更新用户资料
router.put('/profile', auth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const { email, nickname, bio } = req.body

    // 验证输入
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, '邮箱格式不正确')
    }

    // 检查邮箱是否被其他用户使用
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      })
      if (existingUser) {
        throw new ApiError(400, '该邮箱已被其他用户使用')
      }
    }

    // 构建更新数据
    const updateData = {}
    if (email !== undefined) updateData.email = email.trim()
    if (nickname !== undefined) updateData.nickname = nickname ? nickname.trim() : ''
    if (bio !== undefined) updateData.bio = bio ? bio.trim() : ''

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    )

    if (!updatedUser) {
      throw new ApiError(404, '用户不存在')
    }

    res.json({
      success: true,
      data: { user: updatedUser },
      message: '个人资料更新成功'
    })
  } catch (error) {
    next(error)
  }
})

// 修改密码
router.put('/password', auth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, '请提供当前密码和新密码')
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, '新密码长度至少为6位')
    }

    // 获取用户信息（包含密码）
    const user = await User.findById(userId).select('+password')
    if (!user) {
      throw new ApiError(404, '用户不存在')
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new ApiError(400, '当前密码不正确')
    }

    // 检查新密码是否与当前密码相同
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      throw new ApiError(400, '新密码不能与当前密码相同')
    }

    // 加密新密码
    const saltRounds = 10
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // 更新密码
    await User.findByIdAndUpdate(userId, { 
      password: hashedNewPassword 
    })

    res.json({
      success: true,
      message: '密码修改成功'
    })
  } catch (error) {
    next(error)
  }
})

// 重置密码（通过邮箱验证）
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword } = req.body

    if (!email || !newPassword || !confirmPassword) {
      throw new ApiError(400, '请提供邮箱地址和新密码')
    }

    if (newPassword !== confirmPassword) {
      throw new ApiError(400, '两次输入的密码不一致')
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, '新密码长度至少为6位')
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, '邮箱格式不正确')
    }

    // 查找用户
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      throw new ApiError(404, '该邮箱地址未注册')
    }

    // 检查新密码是否与当前密码相同
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      throw new ApiError(400, '新密码不能与当前密码相同')
    }

    // 加密新密码
    const saltRounds = 10
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // 更新密码
    await User.findByIdAndUpdate(user._id, { 
      password: hashedNewPassword 
    })

    res.json({
      success: true,
      message: '密码重置成功'
    })
  } catch (error) {
    next(error)
  }
})

// 获取当前用户的评论
router.get('/comments', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const userId = req.user.id

    // 先获取基本评论数据
    const comments = await Comment.find({ author: userId })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Comment.countDocuments({ author: userId })

    // 手动处理targetId的populate，避免General类型报错
    const commentsWithTitle = await Promise.all(comments.map(async (comment) => {
      const commentObj = comment.toObject()
      
      try {
        // 只对非General类型的评论进行populate
        if (commentObj.targetType !== 'General' && commentObj.targetId) {
          let targetModel
          switch (commentObj.targetType) {
            case 'Blog':
              targetModel = require('../models/Blog')
              break
            case 'Document':
              targetModel = require('../models/Document')
              break
            case 'Gallery':
              targetModel = require('../models/Gallery')
              break
            default:
              targetModel = null
          }
          
          if (targetModel) {
            const targetObj = await targetModel.findById(commentObj.targetId).select('title')
            if (targetObj && targetObj.title) {
              commentObj.targetTitle = targetObj.title
            } else {
              commentObj.targetTitle = '内容已删除'
            }
          } else {
            commentObj.targetTitle = ''
          }
        } else if (commentObj.targetType === 'General') {
          // General类型设置为留言板
          commentObj.targetTitle = '留言板'
        } else {
          commentObj.targetTitle = ''
        }
      } catch (err) {
        console.warn('获取目标标题失败:', err.message)
        commentObj.targetTitle = commentObj.targetType === 'General' ? '留言板' : ''
      }
      
      return commentObj
    }))

    res.json({
      success: true,
      data: {
        comments: commentsWithTitle,
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
})

// 更新用户评论
router.put('/comments/:id', auth, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      throw new ApiError(404, '评论不存在')
    }

    // 检查权限（只有评论作者才能修改）
    if (comment.author.toString() !== req.user.id.toString()) {
      throw new ApiError(403, '没有权限修改此评论')
    }

    const { content, isPublic } = req.body

    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        throw new ApiError(400, '评论内容不能为空')
      }
      comment.content = content.trim()
    }

    if (isPublic !== undefined) {
      comment.isPublic = isPublic
    }

    await comment.save()

    const updatedComment = await Comment.findById(comment._id)
      .populate('author', 'username avatar')

    res.json({
      success: true,
      data: { comment: updatedComment },
      message: '评论更新成功'
    })
  } catch (error) {
    next(error)
  }
})

// 删除用户评论
router.delete('/comments/:id', auth, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      throw new ApiError(404, '评论不存在')
    }

    // 检查权限（只有评论作者才能删除）
    if (comment.author.toString() !== req.user.id.toString()) {
      throw new ApiError(403, '没有权限删除此评论')
    }

    await Comment.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: '评论删除成功'
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router 
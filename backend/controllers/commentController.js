const Comment = require('../models/Comment')
const { ApiError } = require('../utils/error')

// 获取所有评论列表（分页）
exports.getAllComments = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      isPublic = 'true',
      sortBy = 'createdAt', 
      order = 'desc',
      targetType,
      status
    } = req.query

    const query = {}

    // 处理isPublic参数：true表示只获取审核通过的评论
    if (isPublic === 'true') {
      query.status = 'approved'
    } else if (status) {
      query.status = status
    }

    // 如果指定了targetType，添加到查询条件
    if (targetType) {
      query.targetType = targetType
    }

    const limit = Math.min(parseInt(pageSize), 100) // 最大100条
    const skip = (parseInt(page) - 1) * limit

    const comments = await Comment.find(query)
      .populate('author', 'username avatar')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit)
      .skip(skip)

    const total = await Comment.countDocuments(query)

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          total,
          page: parseInt(page),
          pageSize: limit,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// 获取指定目标的评论列表
exports.getCommentsByTarget = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.params
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query

    const query = {
      targetType,
      targetId,
      status: 'approved' // 只获取审核通过的评论
    }

    // 递归函数，用于获取一个评论的所有子评论
    const getReplies = async (commentId) => {
      const replies = await Comment.find({ parentComment: commentId, status: 'approved' })
        .populate({
          path: 'author',
          select: 'username avatar'
        })
        .populate({
          path: 'replies', // 填充虚拟字段
          populate: {
            path: 'author',
            select: 'username avatar'
          }
        })
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })

      // 这是一个简化的递归填充，对于深度嵌套非常有效
      for (const reply of replies) {
        reply.replies = await getReplies(reply._id)
      }
      return replies
    }

    // 1. 获取顶层评论（分页）
    const topLevelComments = await Comment.find({ ...query, parentComment: null })
      .populate('author', 'username avatar')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    // 2. 为每个顶层评论获取其所有回复
    const commentsWithReplies = []
    for (const comment of topLevelComments) {
      const commentObject = comment.toObject()
      commentObject.replies = await getReplies(comment._id)
      commentsWithReplies.push(commentObject)
    }

    // 3. 获取顶层评论的总数用于分页
    const total = await Comment.countDocuments({ ...query, parentComment: null })

    res.json({
      success: true,
      data: commentsWithReplies,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    next(error)
  }
}

// 获取单个评论详情
exports.getCommentById = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('author', 'username avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username avatar'
        }
      })

    if (!comment) {
      throw new ApiError(404, '评论不存在')
    }

    res.json({
      success: true,
      data: { comment }
    })
  } catch (error) {
    next(error)
  }
}

// 创建新评论
exports.createComment = async (req, res, next) => {
  try {
    const { targetId, targetType, content, parentComment } = req.body

    // 检查用户是否已登录
    if (!req.user) {
      throw new ApiError(401, '请先登录后再发表评论')
    }

    if (!content || content.trim().length === 0) {
      throw new ApiError(400, '评论内容不能为空')
    }

    const commentData = {
      targetId,
      targetType,
      content: content.trim(),
      parentComment: parentComment || null,
      author: req.user.id,
      status: 'approved' // 注册用户评论自动通过
    }
    
    // TODO: 验证 targetId 和 targetType 对应的资源是否存在

    const comment = await Comment.create(commentData)
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username avatar')

    res.status(201).json({
      success: true,
      data: populatedComment,
      message: '评论发表成功'
    })
  } catch (error) {
    next(error)
  }
}

// 更新评论
exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      throw new ApiError(404, '评论不存在')
    }

    // 权限检查：管理员可以修改任何评论，普通用户只能修改自己的评论
    const isAdmin = req.user.role === 'admin'
    const isOwner = comment.author && comment.author.toString() === req.user.id.toString()
    
    // 如果既不是管理员也不是评论作者，则拒绝修改
    if (!isAdmin && !isOwner) {
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
}

// 删除评论
exports.deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id
    const comment = await Comment.findById(commentId)

    if (!comment) {
      throw new ApiError(404, '评论不存在')
    }

    // 权限检查：管理员或作者可删除
    const isAdmin = req.user.role === 'admin'
    const isOwner = comment.author && comment.author.toString() === req.user.id.toString()

    if (!isAdmin && !isOwner) {
      throw new ApiError(403, '没有权限删除此评论')
    }

    // 递归删除所有子评论
    const deleteReplies = async (parentId) => {
      const replies = await Comment.find({ parentComment: parentId })
      for (const reply of replies) {
        await deleteReplies(reply._id) // 递归删除子评论的子评论
        await Comment.findByIdAndDelete(reply._id)
      }
    }

    // 开始删除过程
    await deleteReplies(commentId)
    await Comment.findByIdAndDelete(commentId) // 删除主评论

    res.json({
      success: true,
      message: '评论及所有回复已成功删除'
    })
  } catch (error) {
    next(error)
  }
}

// 审核评论（管理员功能）
exports.moderateComment = async (req, res, next) => {
  try {
    const { isPublic } = req.body
    
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      throw new ApiError(404, '评论不存在')
    }

    comment.isPublic = isPublic
    await comment.save()

    const updatedComment = await Comment.findById(comment._id)
      .populate('author', 'username avatar')

    res.json({
      success: true,
      data: { comment: updatedComment },
      message: `评论已${isPublic ? '发布' : '隐藏'}`
    })
  } catch (error) {
    next(error)
  }
}

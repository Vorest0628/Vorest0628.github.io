const Comment = require('../models/Comment')
const CommentLike = require('../models/CommentLike')
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

    // 处理isPublic参数
    if (isPublic === 'true') {
      query.isPublic = true
    } else if (isPublic === 'false') {
      // 显示私有评论
      query.isPublic = false
      // 只有管理员或评论作者可以看到私有评论
      if (req.user && req.user.role === 'admin') {
        // 管理员可以看到所有私有评论，不需要额外过滤
        // 保持 isPublic: false 条件
      } else if (req.user) {
        // 普通用户只能看到自己的私有评论
        query.author = req.user.id
      } else {
        // 未登录用户不能看到私有评论，返回空结果
        query._id = null // 确保查询不到任何结果
      }
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
      targetId
    }

    // 根据用户权限过滤评论
    if (req.user && req.user.role === 'admin') {
      // 管理员可以看到所有评论，不需要额外过滤条件
      // 保持原有的 targetType 和 targetId 条件
    } else if (req.user) {
      // 普通用户可以看到公开评论和自己的私有评论
      query.$or = [
        { isPublic: true },
        { author: req.user.id, isPublic: false }
      ]
    } else {
      // 未登录用户只能看到公开评论
      query.isPublic = true
    }

    // 递归函数，用于获取一个评论的所有子评论
    const getReplies = async (commentId) => {
      const replyQuery = { parentComment: commentId }
      
      // 对回复也应用相同的权限过滤
      if (req.user && req.user.role === 'admin') {
        // 管理员可以看到所有回复，不需要额外过滤条件
        // 保持原有的 parentComment 条件
      } else if (req.user) {
        replyQuery.$or = [
          { isPublic: true },
          { author: req.user.id, isPublic: false }
        ]
      } else {
        replyQuery.isPublic = true
      }
      
      const replies = await Comment.find(replyQuery)
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
    const { targetId, targetType, content, parentComment, isPublic } = req.body

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
      isPublic: isPublic !== undefined ? isPublic : true // 使用前端传递的值，默认为true
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

// 点赞评论
exports.likeComment = async (req, res, next) => {
  try {
    const { id } = req.params
    
    if (!req.user) {
      throw new ApiError(401, '请先登录')
    }

    const comment = await Comment.findById(id)
    if (!comment) {
      throw new ApiError(404, '评论不存在')
    }

    // 检查是否已经点赞
    const existingLike = await CommentLike.findOne({
      comment: id,
      user: req.user.id
    })

    if (existingLike) {
      throw new ApiError(400, '您已经点赞过这条评论')
    }

    // 创建点赞记录
    await CommentLike.create({
      comment: id,
      user: req.user.id
    })

    // 更新评论点赞数
    comment.likeCount += 1
    await comment.save()

    res.json({
      success: true,
      message: '点赞成功',
      data: { likeCount: comment.likeCount }
    })
  } catch (error) {
    next(error)
  }
}

// 取消点赞
exports.unlikeComment = async (req, res, next) => {
  try {
    const { id } = req.params
    
    if (!req.user) {
      throw new ApiError(401, '请先登录')
    }

    const comment = await Comment.findById(id)
    if (!comment) {
      throw new ApiError(404, '评论不存在')
    }

    // 删除点赞记录
    const deletedLike = await CommentLike.findOneAndDelete({
      comment: id,
      user: req.user.id
    })

    if (!deletedLike) {
      throw new ApiError(400, '您还没有点赞过这条评论')
    }

    // 更新评论点赞数
    comment.likeCount = Math.max(0, comment.likeCount - 1)
    await comment.save()

    res.json({
      success: true,
      message: '取消点赞成功',
      data: { likeCount: comment.likeCount }
    })
  } catch (error) {
    next(error)
  }
}

// 检查用户是否已点赞
exports.checkLikeStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    
    if (!req.user) {
      return res.json({
        success: true,
        data: { isLiked: false }
      })
    }

    const like = await CommentLike.findOne({
      comment: id,
      user: req.user.id
    })

    res.json({
      success: true,
      data: { isLiked: !!like }
    })
  } catch (error) {
    next(error)
  }
}

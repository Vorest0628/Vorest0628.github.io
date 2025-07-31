const express = require('express')
const router = express.Router()
const commentController = require('../controllers/commentController')
const { auth, optionalAuth, checkRole } = require('../middleware/auth')

/**
 * 评论路由配置
 * 定义了所有与评论相关的API端点
 */

// 获取所有评论（分页）
router.get('/', commentController.getAllComments)

// 获取指定目标的公开评论
router.get('/:targetType/:targetId', commentController.getCommentsByTarget)

// 创建评论（需要登录）
router.post('/', auth, commentController.createComment)

// 删除评论（需要登录，权限控制在控制器中处理）
router.delete('/:id', auth, commentController.deleteComment)

// 更新评论（需要登录，权限控制在控制器中处理）
router.put('/:id', auth, commentController.updateComment)

// 审核评论（管理员专用）
router.patch('/:id/moderate', auth, checkRole('admin'), commentController.moderateComment)

// 添加点赞相关路由
router.post('/:id/like', auth, commentController.likeComment)
router.delete('/:id/like', auth, commentController.unlikeComment)
router.get('/:id/like-status', optionalAuth, commentController.checkLikeStatus)

module.exports = router

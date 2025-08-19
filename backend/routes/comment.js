const express = require('express')
const router = express.Router()
const commentController = require('../controllers/commentController')
const { auth, optionalAuth, checkRole } = require('../middleware/auth')

/**
 * 评论路由配置
 * 定义了所有与评论相关的API端点
 * 公开路由 - 可选认证：
 * /api/comments 获取所有评论 get (可选认证)
 * /api/comments/:targetType/:targetId 获取指定目标的评论 get (可选认证)
 * 点赞相关路由：
 * /api/comments/:id/like 点赞评论 post (需要认证)
 * /api/comments/:id/like 取消点赞评论 delete (需要认证)
 * /api/comments/:id/like-status 检查评论点赞状态 get (可选认证)
 * 需要认证的路由：
 * /api/comments 创建评论 post (需要登录)
 * /api/comments/:id 删除评论 delete (需要登录)
 * /api/comments/:id 更新评论 put (需要登录)
 * 管理员专用路由：
 * /api/comments/:id/moderate 审核评论 patch (需要管理员权限)
 */
// 获取所有评论（分页，支持可选认证）
router.get('/', optionalAuth, commentController.getAllComments)

// 点赞相关路由（必须在 /:targetType/:targetId 之前）
router.post('/:id/like', auth, commentController.likeComment)
router.delete('/:id/like', auth, commentController.unlikeComment)
router.get('/:id/like-status', optionalAuth, commentController.checkLikeStatus)

// 获取指定目标的评论（支持可选认证）
router.get('/:targetType/:targetId', optionalAuth, commentController.getCommentsByTarget)

// 创建评论（需要登录）
router.post('/', auth, commentController.createComment)

// 删除评论（需要登录，权限控制在控制器中处理）
router.delete('/:id', auth, commentController.deleteComment)

// 更新评论（需要登录，权限控制在控制器中处理）
router.put('/:id', auth, commentController.updateComment)

// 审核评论（管理员专用）
router.patch('/:id/moderate', auth, checkRole('admin'), commentController.moderateComment)

module.exports = router

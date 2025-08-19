const express = require('express')
const router = express.Router()
const friendLinkController = require('../controllers/friendLinkController')
const { auth, checkRole } = require('../middleware/auth')

/**
 * 友情链接路由配置
 * 定义了所有与友情链接相关的API端点
 * 公开路由 - 不需要认证：
 * /api/friendlinks 获取友情链接列表 get (不需要认证)
 * /api/friendlinks/preview-favicon 预览网站favicon get (不需要认证)
 * /api/friendlinks/:id 获取友情链接详情 get (不需要认证)
 * /api/friendlinks/apply 申请友情链接 post (不需要认证)
 * /api/friendlinks/:id/click 记录友链访问 post (不需要认证)
 * 管理员专用路由 - 需要管理员权限：
 * /api/friendlinks 创建友情链接 post (需要管理员权限)
 * /api/friendlinks/:id 更新友情链接 put (需要管理员权限)
 * /api/friendlinks/:id 删除友情链接 delete (需要管理员权限)
 */
// 公开路由 - 不需要认证
router.get('/', friendLinkController.getFriendLinks) // 获取友情链接列表
router.get('/preview-favicon', friendLinkController.previewFavicon) // 预览网站favicon
router.get('/:id', friendLinkController.getFriendLinkById) // 获取友情链接详情
router.post('/apply', friendLinkController.applyFriendLink) // 申请友情链接（公开接口）
router.post('/:id/click', friendLinkController.recordVisit) // 记录友链访问

// 管理员专用路由 - 需要管理员权限
router.use(auth, checkRole('admin')) // 应用认证和管理员权限检查
router.post('/', friendLinkController.createFriendLink) // 创建友情链接
router.put('/:id', friendLinkController.updateFriendLink) // 更新友情链接
router.delete('/:id', friendLinkController.deleteFriendLink) // 删除友情链接

module.exports = router

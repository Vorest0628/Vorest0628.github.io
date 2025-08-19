const express = require('express')
const router = express.Router()
const blogController = require('../controllers/blogController')
const { auth, checkRole, optionalAuth } = require('../middleware/auth')

/**
 * 博客路由配置
 * 定义了所有与博客相关的API端点
 * 公开路由 - 不需要认证：
 * /api/blogs 获取博客列表 get
 * /api/blogs/categories 获取分类列表 get
 * /api/blogs/:id 获取博客详情 get
 * 点赞相关路由：
 * /api/blogs/:id/like 点赞博客 post (需要认证)
 * /api/blogs/:id/like 取消点赞 delete (需要认证)
 * /api/blogs/:id/like-status 检查点赞状态 get (可选认证)
 * 管理员专用路由：
 * /api/blogs/admin/all 管理员获取所有博客 get (需要管理员权限)
 * 需要认证的路由：
 * /api/blogs 创建博客 post (需要登录)
 * /api/blogs/:id 更新博客 put (需要登录)
 * /api/blogs/:id 删除博客 delete (需要登录)
 */
// 公开路由 - 不需要认证
router.get('/', blogController.getBlogs) // 获取博客列表
router.get('/categories', blogController.getCategories) // 获取分类列表

// 管理员专用路由 - 必须放在动态路由之前
router.get('/admin/all', auth, checkRole('admin'), blogController.getAllBlogsForAdmin) // 管理员获取所有博客

// 点赞相关路由（必须在 /:id 之前）
router.post('/:id/like', auth, blogController.likeBlog) // 点赞博客
router.delete('/:id/like', auth, blogController.unlikeBlog) // 取消点赞博客
router.get('/:id/like-status', optionalAuth, blogController.checkBlogLikeStatus) // 检查点赞状态

// 动态路由 - 放在最后
router.get('/:id', blogController.getBlogById) // 获取博客详情

// 需要认证的路由 - 需要用户登录
router.use(auth) // 应用认证中间件
router.post('/', blogController.createBlog) // 创建博客
router.put('/:id', blogController.updateBlog) // 更新博客
router.delete('/:id', blogController.deleteBlog) // 删除博客

module.exports = router 
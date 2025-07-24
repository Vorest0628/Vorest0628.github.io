const express = require('express')
const router = express.Router()
const blogController = require('../controllers/blogController')
const { auth, checkRole } = require('../middleware/auth')

/**
 * 博客路由配置
 * 定义了所有与博客相关的API端点
 */

// 公开路由 - 不需要认证
router.get('/', blogController.getBlogs) // 获取博客列表
router.get('/categories', blogController.getCategories) // 获取分类列表

// 管理员专用路由 - 必须放在动态路由之前
router.get('/admin/all', auth, checkRole('admin'), blogController.getAllBlogsForAdmin) // 管理员获取所有博客

// 动态路由 - 放在最后
router.get('/:id', blogController.getBlogById) // 获取博客详情

// 需要认证的路由 - 需要用户登录
router.use(auth) // 应用认证中间件
router.post('/', blogController.createBlog) // 创建博客
router.put('/:id', blogController.updateBlog) // 更新博客
router.delete('/:id', blogController.deleteBlog) // 删除博客
router.post('/:id/like', blogController.likeBlog) // 点赞博客

module.exports = router 
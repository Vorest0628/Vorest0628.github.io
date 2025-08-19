const express = require('express')
const router = express.Router()
const blogController = require('../controllers/blogController')
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')

/**
 * 博客路由配置
 * 定义了所有与博客相关的API端点
 * 公开接口：
 * /api/blogs 获取博客列表 get
 * /api/blogs/search 搜索博客 get
 * /api/blogs/categories 获取分类列表 get
 * /api/blogs/:id 获取博客详情 get
 * 点赞相关：
 * /api/blogs/:id/like 点赞博客 post (需要认证)
 * /api/blogs/:id/like 取消点赞 delete (需要认证)
 * /api/blogs/:id/like-status 检查点赞状态 get (可选认证)
 * 管理员接口：
 * /api/blogs 创建博客 post (需要管理员权限)
 * /api/blogs/:id 更新博客 put (需要管理员权限)
 * /api/blogs/:id 删除博客 delete (需要管理员权限)
 * /api/blogs/admin/all 获取所有博客 get (需要管理员权限)
 */
// 公开接口
router.get('/', blogController.getBlogs)
router.get('/search', blogController.searchBlogs)
router.get('/categories', blogController.getCategories)

// 点赞相关路由（必须在 /:id 之前）
router.post('/:id/like', auth.auth, blogController.likeBlog)
router.delete('/:id/like', auth.auth, blogController.unlikeBlog)
router.get('/:id/like-status', auth.optionalAuth, blogController.checkBlogLikeStatus)

// 博客详情（必须在点赞路由之后）
router.get('/:id', blogController.getBlogById)

// 管理员接口
router.post('/', auth, admin, blogController.createBlog)
router.put('/:id', auth, admin, blogController.updateBlog)
router.delete('/:id', auth, admin, blogController.deleteBlog)
router.get('/admin/all', auth, admin, blogController.getAllBlogsForAdmin)

module.exports = router
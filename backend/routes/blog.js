const express = require('express')
const router = express.Router()
const blogController = require('../controllers/blogController')
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')

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
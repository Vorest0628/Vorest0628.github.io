const express = require('express')
const router = express.Router()
const blogController = require('../controllers/blogController')
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')

// 公开接口
router.get('/', blogController.getBlogs)
router.get('/search', blogController.searchBlogs)
router.get('/:id', blogController.getBlogById)
router.post('/:id/like', blogController.likeBlog)
router.get('/categories', blogController.getCategories)

// 管理员接口
router.post('/', auth, admin, blogController.createBlog)
router.put('/:id', auth, admin, blogController.updateBlog)
router.delete('/:id', auth, admin, blogController.deleteBlog)
router.get('/admin/all', auth, admin, blogController.getAllBlogsForAdmin)

module.exports = router
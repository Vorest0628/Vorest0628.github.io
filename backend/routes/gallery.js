const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { auth, checkRole } = require('../middleware/auth');

/**
 * 相册路由配置
 * 定义了所有与相册相关的API端点
 * 公开路由 - 不需要认证：
 * /api/gallery 获取所有公开图片 get (不需要认证)
 * /api/gallery/filters 获取分类和标签过滤器 get (不需要认证)
 * /api/gallery/tags 获取所有唯一标签 get (不需要认证)
 * /api/gallery/:id 获取单张图片详情 get (不需要认证)
 * 管理员专用路由 - 需要管理员权限：
 * /api/gallery/all 管理员获取所有图片 get (需要管理员权限)
 * /api/gallery 上传新图片 post (需要管理员权限)
 * /api/gallery/:id 更新图片信息 put (需要管理员权限)
 * /api/gallery/:id 删除图片 delete (需要管理员权限)
 */
// PUBLIC ROUTES
router.get('/', galleryController.getImages); // Get all public images with filters
router.get('/filters', galleryController.getFilters); // Get categories and tags for filtering
router.get('/tags', galleryController.getUniqueTags); // Get all unique tags

// ADMIN ROUTES (specific routes before dynamic routes)
router.get('/all', auth, checkRole('admin'), galleryController.getAllImages); // Get all images for admin panel
router.post('/', auth, checkRole('admin'), galleryController.uploadImage); // Upload a new image
router.put('/:id', auth, checkRole('admin'), galleryController.updateImage); // Update image details
router.delete('/:id', auth, checkRole('admin'), galleryController.deleteImage); // Delete an image

// Dynamic routes (must be last)
router.get('/:id', galleryController.getImage); // Get a single image by ID

module.exports = router;

const express = require('express')
const router = express.Router()
const documentController = require('../controllers/documentController')
const { auth, optionalAuth, checkRole } = require('../middleware/auth')
const { handleUploadError } = require('../middleware/upload')

/**
 * 文档库路由配置
 * 定义了所有与文档相关的API端点
 * 公开路由 - 可选认证：
 * /api/documents 获取文档列表 get (可选认证)
 * /api/documents/categories 获取所有分类 get (可选认证)
 * /api/documents/tags 获取所有标签 get (可选认证)
 * /api/documents/stats/categories 获取分类统计 get (可选认证)
 * /api/documents/popular 获取热门文档 get (可选认证)
 * /api/documents/:id/preview 预览文档 get (可选认证)
 * /api/documents/:id/content 获取文档内容 get (可选认证)
 * /api/documents/:id/download 下载文档 get (可选认证)
 * /api/documents/:id/view 记录访问 post (可选认证)
 * /api/documents/:id 获取文档详情 get (可选认证)
 * 管理员专用路由 - 需要管理员权限：
 * /api/documents/upload 上传文档 post (需要管理员权限)
 * /api/documents 创建文档 post (需要管理员权限)
 * /api/documents/:id 更新文档 put (需要管理员权限)
 * /api/documents/:id 删除文档 delete (需要管理员权限)
 * /api/documents/:id/toggle 切换文档公开状态 patch (需要管理员权限)
 */
// 公开路由 - 可选认证
router.get('/', optionalAuth, documentController.getDocuments) // 获取文档列表
router.get('/categories', documentController.getCategories) // 获取所有分类
router.get('/tags', documentController.getTags) // 获取所有标签
router.get('/stats/categories', documentController.getCategoryStats) // 获取分类统计
router.get('/popular', documentController.getPopularDocuments) // 获取热门文档
router.get('/:id/preview', optionalAuth, documentController.previewDocument) // 预览文档
router.get('/:id/content', optionalAuth, documentController.getDocumentContent) // 获取文档内容
router.get('/:id/download', optionalAuth, documentController.downloadDocument) // 下载文档
router.post('/:id/view', optionalAuth, documentController.recordView) // 记录访问
router.get('/:id', optionalAuth, documentController.getDocumentById) // 获取文档详情

// 管理员专用路由 - 需要管理员权限
router.use(auth, checkRole('admin')) // 应用认证和管理员权限检查
router.post('/upload', handleUploadError, documentController.uploadDocument) // 上传文档
router.post('/', documentController.createDocument) // 创建文档
router.put('/:id', documentController.updateDocument) // 更新文档
router.delete('/:id', documentController.deleteDocument) // 删除文档
router.patch('/:id/toggle', documentController.toggleDocumentPublic) // 切换文档公开状态

module.exports = router

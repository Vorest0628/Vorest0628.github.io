const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { optionalAuth } = require('../middleware/auth');

/**
 * 搜索路由配置
 * 定义了网站的统一搜索接口
 * /api/search 统一搜索接口 get (可选认证)
 * 功能：
 * - 支持全文搜索博客、文档、相册等内容
 * - 可选认证，未登录用户也可使用
 * - 返回相关内容的搜索结果
 */
// 统一搜索接口
router.get('/', optionalAuth, searchController.searchAll);

module.exports = router; 
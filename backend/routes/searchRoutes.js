const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { optionalAuth } = require('../middleware/auth');

/**
 * 搜索路由配置
 */

// 统一搜索接口
router.get('/', optionalAuth, searchController.searchAll);

module.exports = router; 
const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { auth } = require('../middleware/auth')

/**
 * 用户认证路由配置
 * 定义了用户注册、登录和身份验证相关的API端点
 * /api/auth/register 用户注册 post
 * /api/auth/login 用户登录 post
 * /api/auth/me 获取当前用户信息 get (需要认证)
 * 功能：
 * - 新用户注册
 * - 用户登录认证
 * - 获取当前登录用户信息
 */
// 注册新用户
router.post('/register', authController.register)

// 用户登录
router.post('/login', authController.login)

// 获取当前用户信息（需要认证）
router.get('/me', auth, authController.getCurrentUser)

module.exports = router 
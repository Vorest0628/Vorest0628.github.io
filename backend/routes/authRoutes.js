const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { auth } = require('../middleware/auth')

// 注册新用户
router.post('/register', authController.register)

// 用户登录
router.post('/login', authController.login)

// 获取当前用户信息（需要认证）
router.get('/me', auth, authController.getCurrentUser)

module.exports = router 
import { apiService } from '../services/api'

/**
 * 认证相关的API请求
 */
export const authApi = {
  /**
   * 用户注册
   * @param {Object} userData - 用户数据
   * @param {string} userData.username - 用户名
   * @param {string} userData.email - 邮箱
   * @param {string} userData.password - 密码
   * @returns {Promise} 返回注册结果
   */
  register(userData) {
    return apiService.post('/auth/register', userData)
  },

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭证
   * @param {string} credentials.email - 邮箱
   * @param {string} credentials.username - 用户名（可选，与邮箱二选一）
   * @param {string} credentials.password - 密码
   * @returns {Promise} 返回登录结果
   */
  login(credentials) {
    return apiService.post('/auth/login', credentials)
  },

  /**
   * 获取当前用户信息
   * @returns {Promise} 返回用户信息
   */
  getCurrentUser() {
    return apiService.get('/auth/me')
  },

  /**
   * 刷新令牌
   * @returns {Promise} 返回新的令牌
   */
  refreshToken() {
    return apiService.post('/auth/refresh')
  },

  /**
   * 修改密码
   * @param {Object} passwordData - 密码数据
   * @param {string} passwordData.currentPassword - 当前密码
   * @param {string} passwordData.newPassword - 新密码
   * @returns {Promise} 返回修改结果
   */
  changePassword(passwordData) {
    return apiService.put('/auth/password', passwordData)
  },

  /**
   * 更新用户资料
   * @param {Object} userData - 用户数据
   * @returns {Promise} 返回更新结果
   */
  updateProfile(userData) {
    return apiService.put('/auth/profile', userData)
  },

  /**
   * 上传头像
   * @param {FormData} formData - 头像文件数据
   * @returns {Promise} 返回上传结果
   */
  uploadAvatar(formData) {
    return apiService.upload('/auth/avatar', formData)
  },

  /**
   * 忘记密码
   * @param {Object} data - 邮箱数据
   * @param {string} data.email - 邮箱地址
   * @returns {Promise} 返回处理结果
   */
  forgotPassword(data) {
    return apiService.post('/auth/forgot-password', data)
  },

  /**
   * 重置密码
   * @param {Object} data - 重置数据
   * @param {string} data.token - 重置令牌
   * @param {string} data.password - 新密码
   * @returns {Promise} 返回重置结果
   */
  resetPassword(data) {
    return apiService.post('/auth/reset-password', data)
  },

  /**
   * 退出登录
   * @returns {Promise} 返回退出结果
   */
  logout() {
    return apiService.post('/auth/logout')
  }
}

// 本地存储管理
export const authStorage = {
  // 保存认证信息
  setAuth(token, user) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    console.log('💾 认证信息已保存')
  },

  // 获取认证信息
  getAuth() {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    return { 
      token, 
      user: user ? JSON.parse(user) : null 
    }
  },

  // 清除认证信息
  clearAuth() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    console.log('🗑️ 认证信息已清除')
  },

  // 检查是否已认证
  isAuthenticated() {
    return !!localStorage.getItem('token')
  },

  // 检查是否为管理员
  isAdmin() {
    const { user } = this.getAuth()
    return user && user.role === 'admin'
  }
}

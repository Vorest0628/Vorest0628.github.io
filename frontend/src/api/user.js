import { apiService } from '../services/api'

/**
 * 普通用户相关的API请求
 */
export const userApi = {
  /**
   * 获取当前用户的统计数据
   * @returns {Promise} 返回用户统计数据
   */
  getMyStats() {
    return apiService.get('/user/stats')
  },

  /**
   * 获取当前用户的评论
   * @returns {Promise} 返回用户评论列表
   */
  getMyComments() {
    return apiService.get('/user/comments')
  },

  /**
   * 获取当前用户的推荐
   * @returns {Promise} 返回用户推荐列表
   */
  getMyRecommendations() {
    return apiService.get('/user/recommendations')
  },

  /**
   * 更新用户评论
   * @param {number} commentId - 评论ID
   * @param {Object} data - 更新数据
   * @returns {Promise} 返回更新结果
   */
  updateMyComment(commentId, data) {
    return apiService.put(`/user/comments/${commentId}`, data)
  },

  /**
   * 删除用户评论
   * @param {number} commentId - 评论ID
   * @returns {Promise} 返回删除结果
   */
  deleteMyComment(commentId) {
    return apiService.delete(`/user/comments/${commentId}`)
  },

  /**
   * 更新用户推荐
   * @param {number} recommendationId - 推荐ID
   * @param {Object} data - 更新数据
   * @returns {Promise} 返回更新结果
   */
  updateMyRecommendation(recommendationId, data) {
    return apiService.put(`/user/recommendations/${recommendationId}`, data)
  },

  /**
   * 删除用户推荐
   * @param {number} recommendationId - 推荐ID
   * @returns {Promise} 返回删除结果
   */
  deleteMyRecommendation(recommendationId) {
    return apiService.delete(`/user/recommendations/${recommendationId}`)
  },

  /**
   * 更新用户资料
   * @param {Object} data - 用户资料数据
   * @returns {Promise} 返回更新结果
   */
  updateProfile(data) {
    return apiService.put('/user/profile', data)
  },

  /**
   * 修改密码
   * @param {Object} data - 密码数据
   * @param {string} data.currentPassword - 当前密码
   * @param {string} data.newPassword - 新密码
   * @returns {Promise} 返回修改结果
   */
  changePassword(data) {
    return apiService.put('/user/password', data)
  },

  /**
   * 重置密码（通过邮箱）
   * @param {Object} data - 重置数据
   * @param {string} data.email - 邮箱地址
   * @param {string} data.newPassword - 新密码
   * @param {string} data.confirmPassword - 确认密码
   * @returns {Promise} 返回重置结果
   */
  resetPassword(data) {
    return apiService.post('/user/reset-password', data)
  }
} 
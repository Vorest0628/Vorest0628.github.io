import { apiService } from '../services/api'

/**
 * 统计相关的API请求
 */
export const statsApi = {
  /**
   * 获取网站基础统计数据
   * @returns {Promise} 返回统计数据
   */
  getWebsiteStats() {
    return apiService.get('/stats')
  },

  /**
   * 获取热门内容统计
   * @returns {Promise} 返回热门内容数据
   */
  getPopularContent() {
    return apiService.get('/stats/popular')
  },

  /**
   * 记录页面访问
   * @param {Object} visitData - 访问数据
   * @param {string} visitData.page - 页面路径
   * @param {string} visitData.userAgent - 用户代理
   * @returns {Promise} 返回记录结果
   */
  recordVisit(visitData) {
    return apiService.post('/stats/visit', visitData)
  }
} 
import { apiService } from '../services/api'

/**
 * 友情链接相关的API请求
 */
export const friendLinkApi = {
  /**
   * 获取友情链接列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.keyword - 搜索关键词
   * @param {string} params.category - 分类
   * @param {string} params.status - 状态 (approved/pending/rejected)
   * @returns {Promise} 返回友情链接列表数据
   */
  getFriendLinks(params) {
    return apiService.get('/friend-links', { params })
  },

  /**
   * 获取友情链接详情
   * @param {string} id - 友情链接ID
   * @returns {Promise} 返回友情链接详情数据
   */
  getFriendLinkById(id) {
    return apiService.get(`/friend-links/${id}`)
  },

  /**
   * 预览网站favicon
   * @param {string} url - 网站URL
   * @returns {Promise} 返回favicon信息
   */
  previewFavicon(url) {
    return apiService.get('/friend-links/preview-favicon', { params: { url } })
  },

  /**
   * 申请友情链接
   * @param {Object} data - 友情链接数据
   * @param {string} data.name - 网站名称
   * @param {string} data.url - 网站链接
   * @param {string} data.description - 网站描述
   * @param {string} data.logo - 网站Logo
   * @param {string} data.category - 分类
   * @param {string} data.contactEmail - 联系邮箱
   * @param {string} data.contactName - 联系人姓名
   * @returns {Promise} 返回申请结果
   */
  applyFriendLink(data) {
    return apiService.post('/friend-links/apply', data)
  },

  /**
   * 创建友情链接（管理员）
   * @param {Object} data - 友情链接数据
   * @returns {Promise} 返回创建的友情链接数据
   */
  createFriendLink(data) {
    return apiService.post('/friend-links', data)
  },

  /**
   * 更新友情链接
   * @param {string} id - 友情链接ID
   * @param {Object} data - 更新的友情链接数据
   * @returns {Promise} 返回更新后的友情链接数据
   */
  updateFriendLink(id, data) {
    return apiService.put(`/friend-links/${id}`, data)
  },

  /**
   * 删除友情链接
   * @param {string} id - 友情链接ID
   * @returns {Promise} 返回删除结果
   */
  deleteFriendLink(id) {
    return apiService.delete(`/friend-links/${id}`)
  },

  /**
   * 审核友情链接申请（管理员）
   * @param {string} id - 友情链接ID
   * @param {Object} data - 审核数据
   * @param {string} data.status - 审核状态 (approved/rejected)
   * @param {string} data.reason - 审核原因
   * @returns {Promise} 返回审核结果
   */
  reviewFriendLink(id, data) {
    return apiService.post(`/friend-links/${id}/review`, data)
  },

  /**
   * 检查友情链接状态
   * @param {string} id - 友情链接ID
   * @returns {Promise} 返回检查结果
   */
  checkFriendLinkStatus(id) {
    return apiService.post(`/friend-links/${id}/check`)
  },

  /**
   * 批量检查友情链接状态
   * @returns {Promise} 返回批量检查结果
   */
  checkAllFriendLinks() {
    return apiService.post('/friend-links/check-all')
  },

  /**
   * 获取待审核的友情链接申请
   * @param {Object} params - 查询参数
   * @returns {Promise} 返回待审核申请列表
   */
  getPendingApplications(params) {
    return apiService.get('/friend-links/pending', { params })
  },

  /**
   * 获取已通过的友情链接
   * @param {Object} params - 查询参数
   * @returns {Promise} 返回已通过的友情链接列表
   */
  getApprovedFriendLinks(params) {
    return apiService.get('/friend-links/approved', { params })
  },

  /**
   * 获取友情链接分类列表
   * @returns {Promise} 返回分类列表
   */
  getCategories() {
    return apiService.get('/friend-links/categories')
  },

  /**
   * 创建友情链接分类
   * @param {Object} data - 分类数据
   * @returns {Promise} 返回创建结果
   */
  createCategory(data) {
    return apiService.post('/friend-links/categories', data)
  },

  /**
   * 上传友情链接Logo
   * @param {FormData} formData - Logo文件数据
   * @returns {Promise} 返回上传结果
   */
  uploadLogo(formData) {
    return apiService.upload('/friend-links/upload/logo', formData)
  },

  /**
   * 搜索友情链接
   * @param {string} keyword - 搜索关键词
   * @param {Object} params - 其他查询参数
   * @returns {Promise} 返回搜索结果
   */
  searchFriendLinks(keyword, params = {}) {
    return apiService.get('/friend-links/search', { 
      params: { keyword, ...params } 
    })
  },

  /**
   * 获取友情链接统计信息
   * @returns {Promise} 返回统计信息
   */
  getStats() {
    return apiService.get('/friend-links/stats')
  },

  /**
   * 点击友情链接（记录访问）
   * @param {string} id - 友情链接ID
   * @returns {Promise} 返回记录结果
   */
  clickFriendLink(id) {
    return apiService.post(`/friend-links/${id}/click`)
  },

  /**
   * 举报友情链接
   * @param {string} id - 友情链接ID
   * @param {Object} data - 举报数据
   * @param {string} data.reason - 举报原因
   * @param {string} data.description - 详细描述
   * @returns {Promise} 返回举报结果
   */
  reportFriendLink(id, data) {
    return apiService.post(`/friend-links/${id}/report`, data)
  }
} 
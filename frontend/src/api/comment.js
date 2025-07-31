import { apiService } from '../services/api'

/**
 * 评论相关的API请求
 */
export const commentApi = {
  /**
   * 获取评论列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.targetType - 目标类型 (blog/playlist/gallery/document)
   * @param {string} params.targetId - 目标ID
   * @param {string} params.status - 状态 (approved/pending/rejected)
   * @returns {Promise} 返回评论列表数据
   */
  getComments(params) {
    return apiService.get('/comments', { params })
  },

  /**
   * 获取评论详情
   * @param {string} id - 评论ID
   * @returns {Promise} 返回评论详情数据
   */
  getCommentById(id) {
    return apiService.get(`/comments/${id}`)
  },

  /**
   * 创建评论
   * @param {Object} data - 评论数据
   * @param {string} data.content - 评论内容
   * @param {string} data.targetType - 目标类型
   * @param {string} data.targetId - 目标ID
   * @param {string} data.parentId - 父评论ID（回复评论时）
   * @param {string} data.authorName - 作者名称（游客评论）
   * @param {string} data.authorEmail - 作者邮箱（游客评论）
   * @returns {Promise} 返回创建的评论数据
   */
  createComment(data) {
    return apiService.post('/comments', data)
  },

  /**
   * 更新评论
   * @param {string} id - 评论ID
   * @param {Object} data - 更新的评论数据
   * @returns {Promise} 返回更新后的评论数据
   */
  updateComment(id, data) {
    return apiService.put(`/comments/${id}`, data)
  },

  /**
   * 删除评论
   * @param {string} id - 评论ID
   * @returns {Promise} 返回删除结果
   */
  deleteComment(id) {
    return apiService.delete(`/comments/${id}`)
  },

  /**
   * 回复评论
   * @param {string} parentId - 父评论ID
   * @param {Object} data - 回复数据
   * @returns {Promise} 返回回复结果
   */
  replyComment(parentId, data) {
    return apiService.post(`/comments/${parentId}/reply`, data)
  },

  /**
   * 点赞评论
   * @param {string} id - 评论ID
   * @returns {Promise} 返回点赞结果
   */
  likeComment(id) {
    return apiService.post(`/comments/${id}/like`)
  },

  /**
   * 取消点赞评论
   * @param {string} id - 评论ID
   * @returns {Promise} 返回取消点赞结果
   */
  unlikeComment(id) {
    return apiService.delete(`/comments/${id}/like`)
  },

  /**
   * 举报评论
   * @param {string} id - 评论ID
   * @param {Object} data - 举报数据
   * @param {string} data.reason - 举报原因
   * @param {string} data.description - 详细描述
   * @returns {Promise} 返回举报结果
   */
  reportComment(id, data) {
    return apiService.post(`/comments/${id}/report`, data)
  },

  /**
   * 获取指定目标的评论
   * @param {string} targetType - 目标类型
   * @param {string} targetId - 目标ID
   * @param {Object} params - 查询参数
   * @returns {Promise} 返回评论列表
   */
  getTargetComments(targetType, targetId, params = {}) {
    return apiService.get(`/comments/${targetType}/${targetId}`, { params })
  },

  /**
   * 获取热门评论
   * @param {Object} params - 查询参数
   * @param {number} params.limit - 限制数量
   * @param {string} params.targetType - 目标类型
   * @param {string} params.targetId - 目标ID
   * @returns {Promise} 返回热门评论列表
   */
  getPopularComments(params = {}) {
    return apiService.get('/comments/popular', { params })
  },

  /**
   * 获取最新评论
   * @param {Object} params - 查询参数
   * @param {number} params.limit - 限制数量
   * @param {string} params.targetType - 目标类型
   * @returns {Promise} 返回最新评论列表
   */
  getLatestComments(params = {}) {
    return apiService.get('/comments/latest', { params })
  },

  /**
   * 获取我的评论
   * @param {Object} params - 查询参数
   * @returns {Promise} 返回我的评论列表
   */
  getMyComments(params = {}) {
    return apiService.get('/comments/my', { params })
  },

  /**
   * 审核评论（管理员）
   * @param {string} id - 评论ID
   * @param {Object} data - 审核数据
   * @param {string} data.status - 审核状态 (approved/rejected)
   * @param {string} data.reason - 审核原因
   * @returns {Promise} 返回审核结果
   */
  reviewComment(id, data) {
    return apiService.post(`/comments/${id}/review`, data)
  },

  /**
   * 获取评论统计信息
   * @param {Object} params - 查询参数
   * @returns {Promise} 返回统计信息
   */
  getStats(params = {}) {
    return apiService.get('/comments/stats', { params })
  },

  /**
   * 搜索评论
   * @param {string} keyword - 搜索关键词
   * @param {Object} params - 其他查询参数
   * @returns {Promise} 返回搜索结果
   */
  searchComments(keyword, params = {}) {
    return apiService.get('/comments/search', { 
      params: { keyword, ...params } 
    })
  },

  /**
   * 点赞评论
   * @param {string} id - 评论ID
   * @returns {Promise} 返回点赞结果
   */
  likeComment(id) {
    return apiService.post(`/comments/${id}/like`)
  },

  /**
   * 取消点赞评论
   * @param {string} id - 评论ID
   * @returns {Promise} 返回取消点赞结果
   */
  unlikeComment(id) {
    return apiService.delete(`/comments/${id}/like`)
  },

  /**
   * 检查点赞状态
   * @param {string} id - 评论ID
   * @returns {Promise} 返回点赞状态
   */
  checkLikeStatus(id) {
    return apiService.get(`/comments/${id}/like-status`)
  },

  /**
   * 更新评论公开状态
   * @param {string} id - 评论ID
   * @param {boolean} isPublic - 是否公开
   * @returns {Promise} 返回更新结果
   */
  updateCommentVisibility(id, isPublic) {
    return apiService.put(`/comments/${id}`, { isPublic })
  }
} 
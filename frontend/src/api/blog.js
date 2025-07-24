import { apiService } from '../services/api'

/**
 * 博客相关的API请求
 */
export const blogApi = {
  /**
   * 获取博客列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.keyword - 搜索关键词
   * @param {string} params.category - 分类
   * @param {string} params.tag - 标签
   * @param {string} params.status - 状态 (published/draft)
   * @returns {Promise} 返回博客列表数据
   */
  getBlogs(params) {
    return apiService.get('/blogs', { params })
  },

  /**
   * 获取博客详情
   * @param {string} id - 博客ID
   * @returns {Promise} 返回博客详情数据
   */
  getBlogById(id) {
    return apiService.get(`/blogs/${id}`)
  },

  /**
   * 创建博客
   * @param {Object} data - 博客数据
   * @param {string} data.title - 标题
   * @param {string} data.content - 内容
   * @param {string} data.summary - 摘要
   * @param {string} data.category - 分类
   * @param {Array} data.tags - 标签数组
   * @param {string} data.status - 状态
   * @returns {Promise} 返回创建的博客数据
   */
  createBlog(data) {
    return apiService.post('/blogs', data)
  },

  /**
   * 更新博客
   * @param {string} id - 博客ID
   * @param {Object} data - 更新的博客数据
   * @returns {Promise} 返回更新后的博客数据
   */
  updateBlog(id, data) {
    return apiService.put(`/blogs/${id}`, data)
  },

  /**
   * 删除博客
   * @param {string} id - 博客ID
   * @returns {Promise} 返回删除结果
   */
  deleteBlog(id) {
    return apiService.delete(`/blogs/${id}`)
  },

  /**
   * 点赞博客
   * @param {string} id - 博客ID
   * @returns {Promise} 返回点赞结果
   */
  likeBlog(id) {
    return apiService.post(`/blogs/${id}/like`)
  },

  /**
   * 取消点赞博客
   * @param {string} id - 博客ID
   * @returns {Promise} 返回取消点赞结果
   */
  unlikeBlog(id) {
    return apiService.delete(`/blogs/${id}/like`)
  },

  /**
   * 获取热门博客
   * @param {number} limit - 限制数量
   * @returns {Promise} 返回热门博客列表
   */
  getPopularBlogs(limit = 5) {
    return apiService.get('/blogs/popular', { params: { limit } })
  },

  /**
   * 获取最新博客
   * @param {number} limit - 限制数量
   * @returns {Promise} 返回最新博客列表
   */
  getLatestBlogs(limit = 5) {
    return apiService.get('/blogs/latest', { params: { limit } })
  },

  /**
   * 获取博客分类列表
   * @returns {Promise} 返回分类列表
   */
  getCategories() {
    return apiService.get('/blogs/categories')
  },

  /**
   * 获取博客标签列表
   * @returns {Promise} 返回标签列表
   */
  getTags() {
    return apiService.get('/blogs/tags')
  },

  /**
   * 搜索博客
   * @param {string} keyword - 搜索关键词
   * @param {Object} params - 其他查询参数
   * @returns {Promise} 返回搜索结果
   */
  searchBlogs(q, params = {}) {
    return apiService.get('/blogs/search', { 
      params: { q, ...params } 
    })
  },

  /**
   * 上传博客图片
   * @param {FormData} formData - 图片文件数据
   * @returns {Promise} 返回上传结果
   */
  uploadImage(formData) {
    return apiService.upload('/blogs/upload/image', formData)
  }
}

import { apiService } from '../services/api'

/**
 * 管理员相关的API请求
 */
export const adminApi = {
  /**
   * 验证管理员权限
   * @returns {Promise} 返回验证结果
   */
  verifyAdmin() {
    return apiService.get('/admin/verify')
  },

  /**
   * 获取管理员控制台数据
   * @returns {Promise} 返回控制台数据
   */
  getDashboard() {
    return apiService.get('/admin/dashboard')
  },

  // ========== 用户管理 ==========
  /**
   * 获取所有用户
   * @param {Object} params - 查询参数
   * @returns {Promise} 返回用户列表
   */
  getAllUsers(params) {
    return apiService.get('/admin/users', { params })
  },

  /**
   * 更新用户角色
   * @param {number} id - 用户ID
   * @param {Object} data - 角色数据
   * @returns {Promise} 返回更新结果
   */
  updateUserRole(id, data) {
    return apiService.put(`/admin/users/${id}/role`, data)
  },

  /**
   * 删除用户
   * @param {number} id - 用户ID
   * @returns {Promise} 返回删除结果
   */
  deleteUser(id) {
    return apiService.delete(`/admin/users/${id}`)
  },

  // ========== 博客管理 ==========
  /**
   * 获取所有博客（包括草稿）
   * @param {Object} params - 查询参数
   * @returns {Promise} 返回博客列表
   */
  getAllBlogs(params) {
    return apiService.get('/admin/blogs', { params })
  },

  /**
   * 创建博客
   * @param {Object} data - 博客数据
   * @returns {Promise} 返回创建结果
   */
  createBlog(data) {
    return apiService.post('/admin/blogs', data)
  },

  /**
   * 获取单个博客详情
   * @param {number} id - 博客ID
   * @returns {Promise} 返回博客详情
   */
  getBlogById(id) {
    return apiService.get(`/admin/blogs/${id}`)
  },

  /**
   * 更新博客
   * @param {number} id - 博客ID
   * @param {Object} data - 博客数据
   * @returns {Promise} 返回更新结果
   */
  updateBlog(id, data) {
    return apiService.put(`/admin/blogs/${id}`, data)
  },

  /**
   * 更新博客状态
   * @param {number} id - 博客ID
   * @param {Object} data - 状态数据
   * @returns {Promise} 返回更新结果
   */
  updateBlogStatus(id, data) {
    return apiService.put(`/admin/blogs/${id}/status`, data)
  },

  /**
   * 删除博客
   * @param {number} id - 博客ID
   * @returns {Promise} 返回删除结果
   */
  deleteBlog(id) {
    return apiService.delete(`/admin/blogs/${id}`)
  },

  /**
   * 导入 Markdown（支持携带资源 zip/多文件）
   * @param {FormData} formData - 包含 markdown 文件以及可选 assets（zip 或多文件）
   */
  importMarkdown(formData) {
    return apiService.upload('/admin/blogs/import-markdown', formData)
  },

  // ========== 评论管理 ==========
  /**
   * 获取所有评论（包括未审核的）
   * @param {Object} params - 查询参数
   * @returns {Promise} 返回评论列表
   */
  getAllComments(params) {
    return apiService.get('/admin/comments', { params })
  },

  /**
   * 审核评论
   * @param {number} id - 评论ID
   * @param {Object} data - 审核数据
   * @returns {Promise} 返回审核结果
   */
  moderateComment(id, data) {
    return apiService.put(`/admin/comments/${id}/moderate`, data)
  },

  /**
   * 删除评论
   * @param {number} id - 评论ID
   * @returns {Promise} 返回删除结果
   */
  deleteComment(id) {
    return apiService.delete(`/admin/comments/${id}`)
  },

  // ========== 图库管理 ==========
  /**
   * 获取所有图片（包括未发布的）
   * @param {Object} params - 查询参数
   * @returns {Promise} 返回图片列表
   */
  getAllImages(params) {
    return apiService.get('/admin/gallery', { params })
  },

  /**
   * 上传图片
   * @param {FormData} formData - 图片文件数据
   * @returns {Promise} 返回上传结果
   */
  uploadImage(formData) {
    return apiService.post('/admin/gallery/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * 更新图片信息
   * @param {number} id - 图片ID
   * @param {Object} data - 更新数据
   * @returns {Promise} 返回更新结果
   */
  updateImage(id, data) {
    return apiService.put(`/admin/gallery/${id}`, data)
  },

  /**
   * 删除图片
   * @param {number} id - 图片ID
   * @returns {Promise} 返回删除结果
   */
  deleteImage(id) {
    return apiService.delete(`/admin/gallery/${id}`)
  },

  // ========== 文档管理 ==========
  /**
   * 获取所有文档（包括未发布的）
   * @param {Object} params - 查询参数
   * @returns {Promise} 返回文档列表
   */
  getAllDocuments(params) {
    return apiService.get('/admin/documents', { params })
  },

  /**
   * 创建文档
   * @param {Object} data - 文档数据
   * @returns {Promise} 返回创建结果
   */
  createDocument(data) {
    return apiService.post('/admin/documents', data)
  },

  /**
   * 更新文档
   * @param {number} id - 文档ID
   * @param {Object} data - 更新数据
   * @returns {Promise} 返回更新结果
   */
  updateDocument(id, data) {
    return apiService.put(`/admin/documents/${id}`, data)
  },

  /**
   * 删除文档
   * @param {number} id - 文档ID
   * @returns {Promise} 返回删除结果
   */
  deleteDocument(id) {
    return apiService.delete(`/admin/documents/${id}`)
  },

  /**
   * 上传文档文件
   * @param {FormData} formData - 文件数据
   * @returns {Promise} 返回上传结果
   */
  uploadDocumentFile(formData) {
    return apiService.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // ========== 友链管理 ==========
  /**
   * 获取所有友链
   * @param {Object} params - 查询参数
   * @returns {Promise} 返回友链列表
   */
  getAllFriendLinks(params) {
    return apiService.get('/admin/friendlinks', { params })
  },

  /**
   * 添加友链
   * @param {Object} data - 友链数据
   * @returns {Promise} 返回创建结果
   */
  createFriendLink(data) {
    return apiService.post('/admin/friendlinks', data)
  },

  /**
   * 更新友链状态
   * @param {number} id - 友链ID
   * @param {Object} data - 状态数据
   * @returns {Promise} 返回更新结果
   */
  updateFriendLinkStatus(id, data) {
    return apiService.put(`/admin/friendlinks/${id}/status`, data)
  },

  /**
   * 删除友链
   * @param {number} id - 友链ID
   * @returns {Promise} 返回删除结果
   */
  deleteFriendLink(id) {
    return apiService.delete(`/admin/friendlinks/${id}`)
  },

  /**
   * 更新评论公开状态
   * @param {number} id - 评论ID
   * @param {boolean} isPublic - 是否公开
   * @returns {Promise} 返回更新结果
   */
  updateCommentVisibility(id, isPublic) {
    return apiService.put(`/admin/comments/${id}/visibility`, { isPublic })
  }
} 
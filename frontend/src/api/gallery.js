import { apiService } from '../services/api';

export const galleryApi = {
  // ... (existing methods like getImages, getImageById, etc.)

  /**
   * ADMIN: 获取所有图片 (用于管理后台)
   * @returns {Promise} 返回所有图片列表数据
   */
  getAllImages() {
    return apiService.get('/gallery/all');
  },

  /**
   * 获取图片列表
   * @param {Object} params - 查询参数
   * @returns {Promise} 返回图片列表数据
   */
  getImages(params) {
    return apiService.get('/gallery', { params });
  },

  /**
   * 获取图片详情
   * @param {string} id - 图片ID
   * @returns {Promise} 返回图片详情数据
   */
  getImageById(id) {
    return apiService.get(`/gallery/${id}`);
  },

  /**
   * 上传图片 (ADMIN)
   * @param {FormData} formData - 包含图片文件和数据的表单
   * @param {Function} [onUploadProgress] - 上传进度回调
   * @returns {Promise} 返回上传结果
   */
  uploadImage(formData, onUploadProgress) {
    // 注意：后端的路由是 /gallery, 而不是 /gallery/upload
    return apiService.post('/gallery', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
  },

  /**
   * 更新图片信息 (ADMIN)
   * @param {string} id - 图片ID
   * @param {Object} data - 更新数据
   * @returns {Promise} 返回更新结果
   */
  updateImage(id, data) {
    return apiService.put(`/gallery/${id}`, data);
  },

  /**
   * 删除图片 (ADMIN)
   * @param {string} id - 图片ID
   * @returns {Promise} 返回删除结果
   */
  deleteImage(id) {
    return apiService.delete(`/gallery/${id}`);
  },

  /**
   * 获取所有唯一的公开标签
   * @returns {Promise} 返回标签列表
   */
  getTags() {
    return apiService.get('/gallery/tags');
  },

  /**
   * 获取所有公开的分类
   * @returns {Promise} 返回分类列表
   */
  getCategories() {
    return apiService.get('/gallery/categories');
  }

  // ... (other existing methods can be kept if they are still relevant)
}; 
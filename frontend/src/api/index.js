import { apiService } from '../services/api'

export const authApi = {
  login: (credentials) => apiService.post('/auth/login', credentials),
  getCurrentUser: () => apiService.get('/auth/me')
}

export const blogApi = {
  getBlogs: (params = {}) => apiService.get('/blogs', { params }),
  getBlog: (id) => apiService.get(`/blogs/${id}`),
  searchBlogs: (q, params = {}) => apiService.get('/blogs/search', { params: { q, ...params } })
}

export const searchApi = {
  searchAll: (params = {}) => apiService.get('/search', { params })
}

export default apiService

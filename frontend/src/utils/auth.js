import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || 'http://localhost:3000/api',
  timeout: 5000
})

// 请求拦截器：添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 清除本地存储的认证信息
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // 重定向到登录页
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 认证相关的API请求
export const authAPI = {
  // 用户注册
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response // 响应拦截器已经返回了data
  },

  // 用户登录
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response // 响应拦截器已经返回了data
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response // 响应拦截器已经返回了data
  }
}

// 本地存储管理
export const authStorage = {
  // 保存认证信息
  setAuth: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  },

  // 获取认证信息
  getAuth: () => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user'))
    return { token, user }
  },

  // 清除认证信息
  clearAuth: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  // 检查是否已认证
  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  }
}

export default api

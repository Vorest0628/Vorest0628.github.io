import axios from 'axios'

// 调试环境变量
console.log('🔍 环境变量检查:')
console.log('VITE_APP_API_URL:', import.meta.env.VITE_APP_API_URL)
console.log('NODE_ENV:', import.meta.env.NODE_ENV)
console.log('MODE:', import.meta.env.MODE)

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || 'https://vorest0628-github-io.vercel.app/api',
  timeout: 30000  // 增加到30秒
})

console.log('🚀 API baseURL:', api.defaults.baseURL)

// 请求拦截器：添加认证令牌和请求日志
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求时间戳
    config.metadata = { startTime: new Date() }
    
    console.log(`🚀 API请求: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ API请求失败:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器：处理错误和响应日志
api.interceptors.response.use(
  (response) => {
    const endTime = new Date()
    const duration = endTime - response.config.metadata.startTime
    console.log(`✅ API响应: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`)
    
    return response.data
  },
  (error) => {
    const endTime = new Date()
    const duration = error.config?.metadata ? endTime - error.config.metadata.startTime : 0
    
    console.error(`❌ API错误: ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`, error.response?.data || error.message)
    
    // 处理认证错误
    if (error.response?.status === 401) {
      console.log('🔐 认证失效，清除本地存储')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // 避免在管理员页面无限重定向
      if (!window.location.pathname.includes('/admin')) {
        window.location.href = '/'
      }
    }
    
    // 处理网络错误
    if (!error.response) {
      console.error('🌐 网络连接错误，请检查服务器状态')
    }
    
    return Promise.reject(error)
  }
)

// 封装常用的请求方法
export const apiService = {
  // GET请求
  get(url, config = {}) {
    return api.get(url, config)
  },

  // POST请求
  post(url, data = {}, config = {}) {
    return api.post(url, data, config)
  },

  // PUT请求
  put(url, data = {}, config = {}) {
    return api.put(url, data, config)
  },

  // PATCH请求
  patch(url, data = {}, config = {}) {
    return api.patch(url, data, config)
  },

  // DELETE请求
  delete(url, config = {}) {
    return api.delete(url, config)
  },

  // 文件上传
  upload(url, formData, onUploadProgress = null) {
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    })
  },

  // 下载文件
  download(url, filename) {
    return api.get(url, {
      responseType: 'blob'
    }).then(response => {
      const blob = new Blob([response])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    })
  }
}

// 导出api实例供直接使用
export default api 
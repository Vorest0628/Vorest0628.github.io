import axios, { AxiosError, AxiosHeaders, AxiosInstance, AxiosProgressEvent, AxiosResponse, InternalAxiosRequestConfig, type AxiosRequestConfig } from 'axios'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: Date
    }
  }
}

// 兼容读取 Vite 环境变量（避免直接使用 import.meta 触发编译器设置限制）
const getViteEnv = (key: string): string | undefined => {
  try {
    // 使用运行时代码构造，绕过 TS 对 import.meta 的解析限制
    // eslint-disable-next-line no-new-func
    const env = (new Function('try{return import.meta.env}catch(e){return {}}'))() as Record<string, string>
    return env?.[key]
  } catch {
    return undefined
  }
}

// 调试环境变量（可选打印）
console.log('🔍 环境变量检查:')
console.log('VITE_APP_API_URL:', getViteEnv('VITE_APP_API_URL'))
console.log('NODE_ENV:', getViteEnv('NODE_ENV'))
console.log('MODE:', getViteEnv('MODE'))

// 通用接口类型约束
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
}

export interface PaginatedResult<T = any> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface UploadResult {
  url: string
  width?: number
  height?: number
  contentType?: string
}

// 解析 baseURL
const resolveBaseURL = (): string => {
  const envUrl = getViteEnv('VITE_APP_API_URL')
  if (envUrl) return envUrl
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'shirakawananase.top' || host.endsWith('.shirakawananase.top')) {
      return 'https://api.shirakawananase.top/api'
    }
  }
  return '/api'
}

const api: AxiosInstance = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 30000
})

console.log('🚀 API baseURL:', api.defaults.baseURL)


api.interceptors.request.use(
  // 请求拦截器：为每个请求自动添加 Authorization 头（如果本地有 token）
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      if (!config.headers) {
        config.headers = new AxiosHeaders()
      }
      ;(config.headers as any).Authorization = `Bearer ${token}`
    }
    // 记录请求开始时间 用于计算请求时间
    config.metadata = { startTime: new Date() }
    console.log(`🚀 API请求: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  // 请求失败
  (error: AxiosError) => {
    console.error('❌ API请求失败:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // 计算请求时间
    const endTime = new Date()
    const duration = response.config.metadata ? endTime.getTime() - response.config.metadata.startTime.getTime() : 0
    console.log(`✅ API响应: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`)
    return response
  },
  // 响应失败
  (error: AxiosError) => {
    // 计算请求时间
    const endTime = new Date()
    const cfg = (error.config as InternalAxiosRequestConfig | undefined)
    const duration = cfg?.metadata ? endTime.getTime() - cfg.metadata.startTime.getTime() : 0
    console.error(`❌ API错误: ${cfg?.method?.toUpperCase()} ${cfg?.url} (${duration}ms)`, (error.response?.data as any) || error.message)

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      console.log('🔐 认证失效，清除本地存储')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.includes('/admin')) {
        window.location.href = '/'
      }
    }

    if (!error.response) {
      console.error('🌐 网络连接错误，请检查服务器状态')
    }

    return Promise.reject(error)
  }
)

// 按 Axios API 提供等价别名方法，返回 AxiosResponse
export const http = {
  request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.request<T>(config)
  },
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.get<T>(url, config)
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.delete<T>(url, config)
  },
  head<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.head<T>(url, config)
  },
  options<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.options<T>(url, config)
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.post<T>(url, data, config)
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.put<T>(url, data, config)
  },
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.patch<T>(url, data, config)
  },
  postForm<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.postForm<T>(url, data, config)
  },
  putForm<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.putForm<T>(url, data, config)
  },
  patchForm<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return api.patchForm<T>(url, data, config)
  }
}

// 便利方法：直接返回 data，保持与项目现有调用兼容
export const apiService = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return api.get<T>(url, config).then(r => r.data)
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return api.delete<T>(url, config).then(r => r.data)
  },
  head<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return api.head<T>(url, config).then(r => r.data as unknown as T)
  },
  options<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return api.options<T>(url, config).then(r => r.data)
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return api.post<T>(url, data, config).then(r => r.data)
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return api.put<T>(url, data, config).then(r => r.data)
  },
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return api.patch<T>(url, data, config).then(r => r.data)
  },
  postForm<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return api.postForm<T>(url, data, config).then(r => r.data)
  },
  putForm<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return api.putForm<T>(url, data, config).then(r => r.data)
  },
  patchForm<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return api.patchForm<T>(url, data, config).then(r => r.data)
  },
  upload<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig & { onUploadProgress?: (e: AxiosProgressEvent) => void }): Promise<T> {
    return api.post<T>(url, formData, { headers: { 'Content-Type': 'multipart/form-data' }, ...(config || {}) }).then(r => r.data)
  },
  download(url: string, filename: string, config?: AxiosRequestConfig): Promise<void> {
    return api.get<Blob>(url, { responseType: 'blob', ...(config || {}) }).then(response => {
      const blob = new Blob([response.data])
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

export default api



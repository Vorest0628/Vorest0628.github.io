import { apiService } from '../services/api'
import type { 
  LoginCredentials, 
  LoginResponse, 
  AuthResponse,
  Blog,
  BlogListParams,
  BlogListResponse,
  SearchParams
} from '../types/api'

/*
index.ts输出函数一览：
authApi 认证相关 API
blogApi 博客相关 API
searchApi 全局搜索 API
auth 认证相关 API
admin 管理员相关 API
blog 博客相关 API
comment 评论相关 API
document 文档相关 API
friendLink 友情链接相关 API
gallery 图库相关 API
stats 统计相关 API
upload 上传相关 API
user 用户相关 API
weather 天气相关 API
*/

/**
 * 全局搜索参数
 */
export interface GlobalSearchParams {
  q: string
  type?: 'all' | 'blog' | 'document' | 'gallery' | 'comment'
  page?: number
  pageSize?: number
}

/**
 * 全局搜索结果
 */
export interface GlobalSearchResult {
  blogs: Blog[]
  documents: Array<{ id: number; title: string; description?: string }>
  images: Array<{ id: number; title: string; description?: string }>
  comments: Array<{ id: number; content: string; targetType: string; targetId: number }>
  total: number
}

/**
 * 认证相关 API
 */
export const authApi = {
  /**
   * 用户登录
   */
  login: (credentials: LoginCredentials): Promise<LoginResponse> => 
    apiService.post<LoginResponse>('/auth/login', credentials),
  
  /**
   * 获取当前用户信息
   */
  getCurrentUser: (): Promise<AuthResponse> => 
    apiService.get<AuthResponse>('/auth/me')
}

/**
 * 博客相关 API
 */
export const blogApi = {
  /**
   * 获取博客列表
   */
  getBlogs: (params: BlogListParams = {}): Promise<BlogListResponse> => 
    apiService.get<BlogListResponse>('/blogs', { params }),
  
  /**
   * 获取单个博客
   */
  getBlog: (id: number): Promise<Blog> => 
    apiService.get<Blog>(`/blogs/${id}`),
  
  /**
   * 搜索博客
   */
  searchBlogs: (q: string, params: Omit<SearchParams, 'q'> = {}): Promise<BlogListResponse> => 
    apiService.get<BlogListResponse>('/blogs/search', { params: { q, ...params } })
}

/**
 * 全局搜索 API
 */
export const searchApi = {
  /**
   * 全局搜索
   */
  searchAll: (params: GlobalSearchParams): Promise<GlobalSearchResult> => 
    apiService.get<GlobalSearchResult>('/search', { params })
}

// 重新导出 apiService 作为默认导出
export default apiService

// 导出所有其他 API 模块
export { authApi as auth } from './auth'
export { adminApi as admin } from './admin'
export { blogApi as blog } from './blog'
export { commentApi as comment } from './comment'
export { documentApi as document } from './document'
export { friendLinkApi as friendLink } from './friendLink'
export { galleryApi as gallery } from './gallery'
export { statsApi as stats } from './stats'
export { uploadImage } from './upload'
export { userApi as user } from './user'
export { weatherApi as weather } from './weather'


import { apiService } from '../services/api'
import type { 
  Blog, 
  BlogListItem,
  BlogListParams, 
  BlogListResponse,
  BlogCreateData,
  BlogUpdateData,
  LikeStatusResponse,
  UploadResponse,
  ApiResponse
} from '../types/api'

/*
BlogApi输出函数一览：
getBlogs 获取博客列表
getBlogById 获取博客详情
createBlog 创建博客
updateBlog 更新博客
deleteBlog 删除博客
likeBlog 点赞博客
unlikeBlog 取消点赞博客
checkBlogLikeStatus 检查博客点赞状态
getPopularBlogs 获取热门博客
getLatestBlogs 获取最新博客
getCategories 获取博客分类列表
getTags 获取博客标签列表
searchBlogs 搜索博客
uploadImage 上传博客图片
*/

/**
 * 博客分类响应
 */
// 分类/标签统一由 ApiResponse<string[]> 包装

/**
 * 博客标签响应
 */
// 见上：使用 ApiResponse<string[]>

/**
 * 博客搜索参数
 */
export interface BlogSearchParams {
  q: string
  page?: number
  pageSize?: number
  category?: string
  tag?: string
}

/**
 * 博客相关的API请求
 */
export const blogApi = {
  /**
   * 获取博客列表
   */
  getBlogs(params?: BlogListParams): Promise<BlogListResponse> {
    return apiService.get<BlogListResponse>('/blogs', { params })
  },

  /**
   * 获取博客详情
   */
  getBlogById(id: string): Promise<ApiResponse<Blog>> {
    return apiService.get<ApiResponse<Blog>>(`/blogs/${id}`)
  },

  /**
   * 创建博客
   */
  createBlog(data: BlogCreateData): Promise<ApiResponse<Blog>> {
    return apiService.post<ApiResponse<Blog>>('/blogs', data)
  },

  /**
   * 更新博客
   */
  updateBlog(id: string, data: BlogUpdateData): Promise<ApiResponse<Blog>> {
    return apiService.put<ApiResponse<Blog>>(`/blogs/${id}`, data)
  },

  /**
   * 删除博客
   */
  deleteBlog(id: string): Promise<{ success: boolean; message?: string }> {
    return apiService.delete<{ success: boolean; message?: string }>(`/blogs/${id}`)
  },

  /**
   * 点赞博客
   */
  likeBlog(id: string): Promise<ApiResponse<{ likeCount: number }>> {
    return apiService.post<ApiResponse<{ likeCount: number }>>(`/blogs/${id}/like`)
  },

  /**
   * 取消点赞博客
   */
  unlikeBlog(id: string): Promise<ApiResponse<{ likeCount: number }>> {
    return apiService.delete<ApiResponse<{ likeCount: number }>>(`/blogs/${id}/like`)
  },

  /**
   * 检查博客点赞状态
   */
  checkBlogLikeStatus(id: string): Promise<ApiResponse<LikeStatusResponse>> {
    return apiService.get<ApiResponse<LikeStatusResponse>>(`/blogs/${id}/like-status`)
  },

  /**
   * 获取热门博客
   */
  getPopularBlogs(limit: number = 5): Promise<ApiResponse<BlogListItem[]>> {
    return apiService.get<ApiResponse<BlogListItem[]>>('/blogs/popular', { params: { limit } })
  },

  /**
   * 获取最新博客
   */
  getLatestBlogs(limit: number = 5): Promise<ApiResponse<BlogListItem[]>> {
    return apiService.get<ApiResponse<BlogListItem[]>>('/blogs/latest', { params: { limit } })
  },

  /**
   * 获取博客分类列表
   */
  getCategories(): Promise<ApiResponse<string[]>> {
    return apiService.get<ApiResponse<string[]>>('/blogs/categories')
  },

  /**
   * 获取博客标签列表
   */
  getTags(): Promise<ApiResponse<string[]>> {
    return apiService.get<ApiResponse<string[]>>('/blogs/tags')
  },

  /**
   * 搜索博客
   */
  searchBlogs(q: string, params: Omit<BlogSearchParams, 'q'> = {}): Promise<BlogListResponse> {
    return apiService.get<BlogListResponse>('/blogs/search', { 
      params: { q, ...params } 
    })
  },

  /**
   * 上传博客图片
   */
  uploadImage(formData: FormData): Promise<ApiResponse<UploadResponse>> {
    return apiService.upload<ApiResponse<UploadResponse>>('/blogs/upload/image', formData)
  }
}


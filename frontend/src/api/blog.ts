import { apiService } from '../services/api'
import type { 
  Blog, 
  BlogListParams, 
  BlogListResponse,
  BlogCreateData,
  BlogUpdateData,
  LikeStatusResponse,
  UploadResponse
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
export interface BlogCategoriesResponse {
  categories: string[]
}

/**
 * 博客标签响应
 */
export interface BlogTagsResponse {
  tags: string[]
}

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
  getBlogById(id: number): Promise<Blog> {
    return apiService.get<Blog>(`/blogs/${id}`)
  },

  /**
   * 创建博客
   */
  createBlog(data: BlogCreateData): Promise<Blog> {
    return apiService.post<Blog>('/blogs', data)
  },

  /**
   * 更新博客
   */
  updateBlog(id: number, data: BlogUpdateData): Promise<Blog> {
    return apiService.put<Blog>(`/blogs/${id}`, data)
  },

  /**
   * 删除博客
   */
  deleteBlog(id: number): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/blogs/${id}`)
  },

  /**
   * 点赞博客
   */
  likeBlog(id: number): Promise<{ success: boolean; likeCount: number }> {
    return apiService.post<{ success: boolean; likeCount: number }>(`/blogs/${id}/like`)
  },

  /**
   * 取消点赞博客
   */
  unlikeBlog(id: number): Promise<{ success: boolean; likeCount: number }> {
    return apiService.delete<{ success: boolean; likeCount: number }>(`/blogs/${id}/like`)
  },

  /**
   * 检查博客点赞状态
   */
  checkBlogLikeStatus(id: number): Promise<LikeStatusResponse> {
    return apiService.get<LikeStatusResponse>(`/blogs/${id}/like-status`)
  },

  /**
   * 获取热门博客
   */
  getPopularBlogs(limit: number = 5): Promise<Blog[]> {
    return apiService.get<Blog[]>('/blogs/popular', { params: { limit } })
  },

  /**
   * 获取最新博客
   */
  getLatestBlogs(limit: number = 5): Promise<Blog[]> {
    return apiService.get<Blog[]>('/blogs/latest', { params: { limit } })
  },

  /**
   * 获取博客分类列表
   */
  getCategories(): Promise<BlogCategoriesResponse> {
    return apiService.get<BlogCategoriesResponse>('/blogs/categories')
  },

  /**
   * 获取博客标签列表
   */
  getTags(): Promise<BlogTagsResponse> {
    return apiService.get<BlogTagsResponse>('/blogs/tags')
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
  uploadImage(formData: FormData): Promise<UploadResponse> {
    return apiService.upload<UploadResponse>('/blogs/upload/image', formData)
  }
}


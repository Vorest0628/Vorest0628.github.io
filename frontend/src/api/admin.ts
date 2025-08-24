import { apiService } from '../services/api'
import type { 
  User,
  Blog,
  Comment,
  Document,
  FriendLink,
  GalleryImage,
  AdminDashboardData,
  BlogCreateData,
  BlogUpdateData,
  DocumentCreateData,
  FriendLinkCreateData,
  GalleryImageCreateData,
  RoleUpdateData,
  StatusUpdateData,
  ModerationData,
  PaginationParams,
  ApiResponse
} from '../types/api'

/*
AdminApi输出函数一览：
verifyAdmin 验证管理员权限
getDashboard 获取管理员控制台数据
getAllUsers 获取所有用户
updateUserRole 更新用户角色
deleteUser 删除用户
getAllBlogs 获取所有博客（包括草稿）
createBlog 创建博客
getBlogById 获取单个博客详情
updateBlog 更新博客
updateBlogStatus 更新博客状态
deleteBlog 删除博客
importMarkdown 导入 Markdown（支持携带资源 zip/多文件）
getAllComments 获取所有评论（包括未审核的）
moderateComment 审核评论
deleteComment 删除评论
updateCommentVisibility 更新评论公开状态
getAllImages 获取所有图片（包括未发布的）
uploadImage 上传图片
updateImage 更新图片信息
deleteImage 删除图片
getAllDocuments 获取所有文档（包括未发布的）
createDocument 创建文档
updateDocument 更新文档
deleteDocument 删除文档
uploadDocumentFile 上传文档文件
getAllFriendLinks 获取所有友链
createFriendLink 添加友链
updateFriendLinkStatus 更新友链状态
deleteFriendLink 删除友链
*/



/**
 * 管理员验证响应
 */
export interface AdminVerifyResponse {
  isAdmin: boolean
  permissions: string[]
}

/**
 * 导入 Markdown 响应
 */
export interface ImportMarkdownResponse {
  success: boolean
  blog: Blog
  assets?: Array<{ filename: string; url: string }>
}

/**
 * 管理员相关的API请求
 */
export const adminApi = {
  /**
   * 验证管理员权限
   */
  verifyAdmin(): Promise<AdminVerifyResponse> {
    return apiService.get<AdminVerifyResponse>('/admin/verify')
  },

  /**
   * 获取管理员控制台数据
   */
  getDashboard(): Promise<ApiResponse<any>> {
    return apiService.get<ApiResponse<any>>('/admin/dashboard')
  },

  // ========== 用户管理 ==========
  /**
   * 获取所有用户
   */
  getAllUsers(params?: PaginationParams): Promise<ApiResponse<{ users: User[]; pagination: any }>> {
    return apiService.get<ApiResponse<{ users: User[]; pagination: any }>>('/admin/users', { params })
  },

  /**
   * 更新用户角色
   */
  updateUserRole(id: string, data: RoleUpdateData): Promise<ApiResponse<{ user: User }>> {
    return apiService.put<ApiResponse<{ user: User }>>(`/admin/users/${id}/role`, data)
  },

  /**
   * 删除用户
   */
  deleteUser(id: string): Promise<{ success: boolean; message?: string }> {
    return apiService.delete<{ success: boolean; message?: string }>(`/admin/users/${id}`)
  },

  // ========== 博客管理 ==========
  /**
   * 获取所有博客（包括草稿）
   */
  getAllBlogs(params?: PaginationParams): Promise<ApiResponse<{ blogs: Blog[]; pagination: any }>> {
    return apiService.get<ApiResponse<{ blogs: Blog[]; pagination: any }>>('/admin/blogs', { params })
  },

  /**
   * 创建博客
   */
  createBlog(data: BlogCreateData): Promise<ApiResponse<{ blog: Blog }>> {
    return apiService.post<ApiResponse<{ blog: Blog }>>('/admin/blogs', data)
  },

  /**
   * 获取单个博客详情
   */
  getBlogById(id: string): Promise<ApiResponse<Blog>> {
    return apiService.get<ApiResponse<Blog>>(`/admin/blogs/${id}`)
  },

  /**
   * 更新博客
   */
  updateBlog(id: string, data: BlogUpdateData): Promise<ApiResponse<{ blog: Blog }>> {
    return apiService.put<ApiResponse<{ blog: Blog }>>(`/admin/blogs/${id}`, data)
  },

  /**
   * 更新博客状态
   */
  updateBlogStatus(id: string, data: StatusUpdateData): Promise<ApiResponse<{ blog: Blog }>> {
    return apiService.put<ApiResponse<{ blog: Blog }>>(`/admin/blogs/${id}/status`, data)
  },

  /**
   * 删除博客
   */
  deleteBlog(id: string): Promise<{ success: boolean; message?: string }> {
    return apiService.delete<{ success: boolean; message?: string }>(`/admin/blogs/${id}`)
  },

  /**
   * 导入 Markdown（支持携带资源 zip/多文件）
   */
  importMarkdown(formData: FormData): Promise<ApiResponse<any>> {
    return apiService.upload<ApiResponse<any>>('/admin/blogs/import-markdown', formData)
  },

  // ========== 评论管理 ==========
  /**
   * 获取所有评论（包括未审核的）
   */
  getAllComments(params?: Record<string, any>): Promise<ApiResponse<{ comments: Comment[]; pagination: any }>> {
    return apiService.get<ApiResponse<{ comments: Comment[]; pagination: any }>>('/admin/comments', { params })
  },

  /**
   * 审核评论
   */
  moderateComment(id: string, data: ModerationData): Promise<ApiResponse<Comment>> {
    return apiService.put<ApiResponse<Comment>>(`/admin/comments/${id}/moderate`, data)
  },

  /**
   * 删除评论
   */
  deleteComment(id: string): Promise<{ success: boolean; message?: string }> {
    return apiService.delete<{ success: boolean; message?: string }>(`/admin/comments/${id}`)
  },

  /**
   * 更新评论公开状态
   */
  updateCommentVisibility(id: string, isPublic: boolean): Promise<ApiResponse<{ comment: Comment }>> {
    return apiService.put<ApiResponse<{ comment: Comment }>>(`/admin/comments/${id}/visibility`, { isPublic })
  },

  // ========== 图库管理 ==========
  /**
   * 获取所有图片（包括未发布的）
   */
  getAllImages(params?: PaginationParams): Promise<ApiResponse<{ images: GalleryImage[]; pagination: any }>> {
    return apiService.get<ApiResponse<{ images: GalleryImage[]; pagination: any }>>('/admin/gallery', { params })
  },

  /**
   * 上传图片
   */
  uploadImage(formData: FormData): Promise<ApiResponse<GalleryImage>> {
    return apiService.post<ApiResponse<GalleryImage>>('/admin/gallery/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * 更新图片信息
   */
  updateImage(id: string, data: Partial<GalleryImageCreateData>): Promise<ApiResponse<GalleryImage>> {
    return apiService.put<ApiResponse<GalleryImage>>(`/admin/gallery/${id}`, data)
  },

  /**
   * 删除图片
   */
  deleteImage(id: string): Promise<{ success: boolean; message?: string }> {
    return apiService.delete<{ success: boolean; message?: string }>(`/admin/gallery/${id}`)
  },

  // ========== 文档管理 ==========
  /**
   * 获取所有文档（包括未发布的）
   */
  getAllDocuments(params?: PaginationParams): Promise<ApiResponse<{ documents: Document[]; pagination: any }>> {
    return apiService.get<ApiResponse<{ documents: Document[]; pagination: any }>>('/admin/documents', { params })
  },

  /**
   * 创建文档
   */
  createDocument(data: DocumentCreateData): Promise<ApiResponse<Document>> {
    return apiService.post<ApiResponse<Document>>('/admin/documents', data)
  },

  /**
   * 更新文档
   */
  updateDocument(id: string, data: Partial<DocumentCreateData>): Promise<ApiResponse<Document>> {
    return apiService.put<ApiResponse<Document>>(`/admin/documents/${id}`, data)
  },

  /**
   * 删除文档
   */
  deleteDocument(id: string): Promise<{ success: boolean; message?: string }> {
    return apiService.delete<{ success: boolean; message?: string }>(`/admin/documents/${id}`)
  },

  /**
   * 上传文档文件
   */
  uploadDocumentFile(formData: FormData): Promise<ApiResponse<any>> {
    return apiService.post<ApiResponse<any>>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // ========== 友链管理 ==========
  /**
   * 获取所有友链
   */
  getAllFriendLinks(params?: PaginationParams): Promise<ApiResponse<{ friendLinks: FriendLink[]; pagination: any }>> {
    return apiService.get<ApiResponse<{ friendLinks: FriendLink[]; pagination: any }>>('/admin/friendlinks', { params })
  },

  /**
   * 添加友链
   */
  createFriendLink(data: FriendLinkCreateData): Promise<ApiResponse<FriendLink>> {
    return apiService.post<ApiResponse<FriendLink>>('/admin/friendlinks', data)
  },

  /**
   * 更新友链状态
   */
  updateFriendLinkStatus(id: string, data: StatusUpdateData): Promise<ApiResponse<{ friendLink: FriendLink }>> {
    return apiService.put<ApiResponse<{ friendLink: FriendLink }>>(`/admin/friendlinks/${id}/status`, data)
  },

  /**
   * 删除友链
   */
  deleteFriendLink(id: string): Promise<{ success: boolean; message?: string }> {
    return apiService.delete<{ success: boolean; message?: string }>(`/admin/friendlinks/${id}`)
  }
}


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
  UploadResponse,
  PaginationParams
} from '../types/api'

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
  getDashboard(): Promise<AdminDashboardData> {
    return apiService.get<AdminDashboardData>('/admin/dashboard')
  },

  // ========== 用户管理 ==========
  /**
   * 获取所有用户
   */
  getAllUsers(params?: PaginationParams): Promise<{ items: User[]; total: number; page: number; pageSize: number }> {
    return apiService.get('/admin/users', { params })
  },

  /**
   * 更新用户角色
   */
  updateUserRole(id: number, data: RoleUpdateData): Promise<User> {
    return apiService.put<User>(`/admin/users/${id}/role`, data)
  },

  /**
   * 删除用户
   */
  deleteUser(id: number): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/admin/users/${id}`)
  },

  // ========== 博客管理 ==========
  /**
   * 获取所有博客（包括草稿）
   */
  getAllBlogs(params?: PaginationParams): Promise<{ items: Blog[]; total: number; page: number; pageSize: number }> {
    return apiService.get('/admin/blogs', { params })
  },

  /**
   * 创建博客
   */
  createBlog(data: BlogCreateData): Promise<Blog> {
    return apiService.post<Blog>('/admin/blogs', data)
  },

  /**
   * 获取单个博客详情
   */
  getBlogById(id: number): Promise<Blog> {
    return apiService.get<Blog>(`/admin/blogs/${id}`)
  },

  /**
   * 更新博客
   */
  updateBlog(id: number, data: BlogUpdateData): Promise<Blog> {
    return apiService.put<Blog>(`/admin/blogs/${id}`, data)
  },

  /**
   * 更新博客状态
   */
  updateBlogStatus(id: number, data: StatusUpdateData): Promise<Blog> {
    return apiService.put<Blog>(`/admin/blogs/${id}/status`, data)
  },

  /**
   * 删除博客
   */
  deleteBlog(id: number): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/admin/blogs/${id}`)
  },

  /**
   * 导入 Markdown（支持携带资源 zip/多文件）
   */
  importMarkdown(formData: FormData): Promise<ImportMarkdownResponse> {
    return apiService.upload<ImportMarkdownResponse>('/admin/blogs/import-markdown', formData)
  },

  // ========== 评论管理 ==========
  /**
   * 获取所有评论（包括未审核的）
   */
  getAllComments(params?: PaginationParams): Promise<{ items: Comment[]; total: number; page: number; pageSize: number }> {
    return apiService.get('/admin/comments', { params })
  },

  /**
   * 审核评论
   */
  moderateComment(id: number, data: ModerationData): Promise<Comment> {
    return apiService.put<Comment>(`/admin/comments/${id}/moderate`, data)
  },

  /**
   * 删除评论
   */
  deleteComment(id: number): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/admin/comments/${id}`)
  },

  /**
   * 更新评论公开状态
   */
  updateCommentVisibility(id: number, isPublic: boolean): Promise<Comment> {
    return apiService.put<Comment>(`/admin/comments/${id}/visibility`, { isPublic })
  },

  // ========== 图库管理 ==========
  /**
   * 获取所有图片（包括未发布的）
   */
  getAllImages(params?: PaginationParams): Promise<{ items: GalleryImage[]; total: number; page: number; pageSize: number }> {
    return apiService.get('/admin/gallery', { params })
  },

  /**
   * 上传图片
   */
  uploadImage(formData: FormData): Promise<GalleryImage> {
    return apiService.post<GalleryImage>('/admin/gallery/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * 更新图片信息
   */
  updateImage(id: number, data: Partial<GalleryImageCreateData>): Promise<GalleryImage> {
    return apiService.put<GalleryImage>(`/admin/gallery/${id}`, data)
  },

  /**
   * 删除图片
   */
  deleteImage(id: number): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/admin/gallery/${id}`)
  },

  // ========== 文档管理 ==========
  /**
   * 获取所有文档（包括未发布的）
   */
  getAllDocuments(params?: PaginationParams): Promise<{ items: Document[]; total: number; page: number; pageSize: number }> {
    return apiService.get('/admin/documents', { params })
  },

  /**
   * 创建文档
   */
  createDocument(data: DocumentCreateData): Promise<Document> {
    return apiService.post<Document>('/admin/documents', data)
  },

  /**
   * 更新文档
   */
  updateDocument(id: number, data: Partial<DocumentCreateData>): Promise<Document> {
    return apiService.put<Document>(`/admin/documents/${id}`, data)
  },

  /**
   * 删除文档
   */
  deleteDocument(id: number): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/admin/documents/${id}`)
  },

  /**
   * 上传文档文件
   */
  uploadDocumentFile(formData: FormData): Promise<UploadResponse> {
    return apiService.post<UploadResponse>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // ========== 友链管理 ==========
  /**
   * 获取所有友链
   */
  getAllFriendLinks(params?: PaginationParams): Promise<{ items: FriendLink[]; total: number; page: number; pageSize: number }> {
    return apiService.get('/admin/friendlinks', { params })
  },

  /**
   * 添加友链
   */
  createFriendLink(data: FriendLinkCreateData): Promise<FriendLink> {
    return apiService.post<FriendLink>('/admin/friendlinks', data)
  },

  /**
   * 更新友链状态
   */
  updateFriendLinkStatus(id: number, data: StatusUpdateData): Promise<FriendLink> {
    return apiService.put<FriendLink>(`/admin/friendlinks/${id}/status`, data)
  },

  /**
   * 删除友链
   */
  deleteFriendLink(id: number): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/admin/friendlinks/${id}`)
  }
}


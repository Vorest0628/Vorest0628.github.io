/*
API 通用类型定义
类型一览：
User 用户
Blog 博客
Comment 评论
Document 文档
FriendLink 友情链接
GalleryImage 图库图片
LoginCredentials 登录凭证
RegisterData 注册数据
PasswordChangeData 修改密码数据
PasswordResetData 重置密码数据
ForgotPasswordData 忘记密码数据
ProfileUpdateData 更新用户资料数据
BlogCreateData 创建博客数据
BlogUpdateData 更新博客数据
CommentCreateData 创建评论数据
DocumentCreateData 创建文档数据
FriendLinkCreateData 创建友情链接数据
FriendLinkApplyData 申请友情链接数据
GalleryImageCreateData 创建图库图片数据
PaginationParams 分页参数
SearchParams 搜索参数
BlogListParams 博客列表参数
CommentListParams 评论列表参数
DocumentListParams 文档列表参数
FriendLinkListParams 友情链接列表参数
GalleryListParams 图库列表参数
LoginResponse 登录响应
AuthResponse 认证响应
BlogListResponse 博客列表响应
CommentListResponse 评论列表响应
DocumentListResponse 文档列表响应
FriendLinkListResponse 友情链接列表响应
GalleryListResponse 图库列表响应
UploadResponse 上传响应
StatsResponse 统计响应
AdminDashboardData 管理员控制台数据
WeatherData 天气数据
WeatherForecast 天气预报
CityInfo 城市信息
WeatherParams 天气参数
FileUploadConfig 文件上传配置
ReviewData 审核数据
ModerationData 管理数据
VisibilityUpdateData 公开状态更新数据
StatusUpdateData 状态更新数据
RoleUpdateData 角色更新数据
ReportData 举报数据
LikeStatusResponse 点赞状态响应
ApiError API 错误响应
ApiSuccess API 成功响应
ApiResponse API 响应
*/

// 基础实体类型
export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  role: 'user' | 'admin'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Blog {
  id: number
  title: string
  content: string
  summary?: string
  category: string
  tags: string[]
  status: 'published' | 'draft'
  viewCount: number
  likeCount: number
  commentCount: number
  authorId: number
  author?: User
  coverImage?: string
  isTop: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: number
  content: string
  targetType: 'blog' | 'gallery' | 'document' | 'playlist'
  targetId: number
  authorId?: number
  author?: User
  authorName?: string
  authorEmail?: string
  parentId?: number
  parent?: Comment
  replies?: Comment[]
  status: 'approved' | 'pending' | 'rejected'
  likeCount: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: number
  title: string
  description?: string
  fileName: string
  filePath: string
  fileType: string
  fileSize: number
  category: string
  tags: string[]
  viewCount: number
  downloadCount: number
  isPublic: boolean
  uploaderId: number
  uploader?: User
  createdAt: string
  updatedAt: string
}

export interface FriendLink {
  id: number
  name: string
  url: string
  description: string
  logo?: string
  category: string
  status: 'approved' | 'pending' | 'rejected'
  contactEmail?: string
  contactName?: string
  clickCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface GalleryImage {
  id: number
  title: string
  description?: string
  imageUrl: string
  thumbnailUrl?: string
  tags: string[]
  category: string
  isPublic: boolean
  viewCount: number
  likeCount: number
  uploaderId: number
  uploader?: User
  createdAt: string
  updatedAt: string
}

// 请求参数类型
export interface LoginCredentials {
  email?: string
  username?: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
}

export interface PasswordResetData {
  token: string
  password: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ProfileUpdateData {
  username?: string
  email?: string
  avatar?: string
}

export interface BlogCreateData {
  title: string
  content: string
  summary?: string
  category: string
  tags: string[]
  status: 'published' | 'draft'
  coverImage?: string
  isTop?: boolean
}

export interface BlogUpdateData extends Partial<BlogCreateData> {}

export interface CommentCreateData {
  content: string
  targetType: 'blog' | 'gallery' | 'document' | 'playlist'
  targetId: number
  parentId?: number
  authorName?: string
  authorEmail?: string
}

export interface DocumentCreateData {
  title: string
  description?: string
  category: string
  tags: string[]
  isPublic: boolean
}

export interface FriendLinkCreateData {
  name: string
  url: string
  description: string
  logo?: string
  category: string
  contactEmail?: string
  contactName?: string
}

export interface FriendLinkApplyData {
  name: string
  url: string
  description: string
  logo?: string
  category: string
  contactEmail: string
  contactName: string
}

export interface GalleryImageCreateData {
  title: string
  description?: string
  tags: string[]
  category: string
  isPublic: boolean
}

// 查询参数类型
export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface SearchParams extends PaginationParams {
  keyword?: string
  q?: string
}

export interface BlogListParams extends PaginationParams {
  keyword?: string
  category?: string
  tag?: string
  status?: 'published' | 'draft'
}

export interface CommentListParams extends PaginationParams {
  targetType?: 'blog' | 'gallery' | 'document' | 'playlist'
  targetId?: number
  status?: 'approved' | 'pending' | 'rejected'
}

export interface DocumentListParams extends PaginationParams {
  keyword?: string
  category?: string
  fileType?: string
}

export interface FriendLinkListParams extends PaginationParams {
  keyword?: string
  category?: string
  status?: 'approved' | 'pending' | 'rejected'
}

export interface GalleryListParams extends PaginationParams {
  keyword?: string
  category?: string
  tag?: string
}

// 响应类型
export interface LoginResponse {
  token: string
  user: User
}

export interface AuthResponse {
  user: User
}

export interface BlogListResponse {
  items: Blog[]
  total: number
  page: number
  pageSize: number
}

export interface CommentListResponse {
  items: Comment[]
  total: number
  page: number
  pageSize: number
}

export interface DocumentListResponse {
  items: Document[]
  total: number
  page: number
  pageSize: number
}

export interface FriendLinkListResponse {
  items: FriendLink[]
  total: number
  page: number
  pageSize: number
}

export interface GalleryListResponse {
  items: GalleryImage[]
  total: number
  page: number
  pageSize: number
}

export interface UploadResponse {
  url: string
  width?: number
  height?: number
  contentType?: string
}

export interface StatsResponse {
  totalBlogs: number
  totalComments: number
  totalUsers: number
  totalViews: number
  totalLikes: number
}

export interface AdminDashboardData {
  stats: StatsResponse
  recentBlogs: Blog[]
  recentComments: Comment[]
  recentUsers: User[]
}

// 天气相关类型
export interface WeatherData {
  location: string
  temperature: number
  humidity: number
  description: string
  icon: string
  windSpeed: number
  pressure: number
}

export interface WeatherForecast {
  date: string
  temperature: {
    min: number
    max: number
  }
  description: string
  icon: string
}

export interface CityInfo {
  id: string
  name: string
  country: string
  lat: number
  lon: number
}

export interface WeatherParams {
  city?: string
  lat?: number
  lon?: number
  days?: number
}

// 文件上传相关
export interface FileUploadConfig {
  maxSize?: number
  allowedTypes?: string[]
  multiple?: boolean
}

// 审核相关
export interface ReviewData {
  status: 'approved' | 'rejected'
  reason?: string
}

export interface ModerationData {
  status: 'approved' | 'rejected' | 'pending'
  reason?: string
}

// 公开状态更新
export interface VisibilityUpdateData {
  isPublic: boolean
}

// 状态更新
export interface StatusUpdateData {
  status: string
}

// 角色更新
export interface RoleUpdateData {
  role: 'user' | 'admin'
}

// 举报相关
export interface ReportData {
  reason: string
  description?: string
}

// 点赞状态
export interface LikeStatusResponse {
  isLiked: boolean
  likeCount: number
}

// API 错误响应
export interface ApiError {
  success: false
  message: string
  code?: string
  details?: any
}

// API 成功响应
export interface ApiSuccess<T = any> {
  success: true
  message?: string
  data: T
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError


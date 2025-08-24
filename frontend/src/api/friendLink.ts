import { apiService } from '../services/api'
import type { 
  FriendLink, 
  FriendLinkListParams, 
  FriendLinkListResponse,
  FriendLinkCreateData,
  FriendLinkApplyData,
  UploadResponse,
  ReviewData,
  ReportData
} from '../types/api'

/*
FriendLinkApi输出函数一览：
getFriendLinks 获取友情链接列表
getFriendLinkById 获取友情链接详情
previewFavicon 预览网站favicon
applyFriendLink 申请友情链接
createFriendLink 创建友情链接（管理员）
updateFriendLink 更新友情链接
deleteFriendLink 删除友情链接
reviewFriendLink 审核友情链接申请（管理员）
checkFriendLinkStatus 检查友情链接状态
checkAllFriendLinks 批量检查友情链接状态
getPendingApplications 获取待审核的友情链接申请
getApprovedFriendLinks 获取已通过的友情链接
getCategories 获取友情链接分类列表
createCategory 创建友情链接分类
uploadLogo 上传友情链接Logo
searchFriendLinks 搜索友情链接
getStats 获取友情链接统计信息
clickFriendLink 点击友情链接（记录访问）
reportFriendLink 举报友情链接
*/

/**
 * Favicon 预览响应
 */
export interface FaviconPreviewResponse {
  faviconUrl: string
  title?: string
  description?: string
}

/**
 * 友链分类响应
 */
export interface FriendLinkCategoriesResponse {
  categories: string[]
}

/**
 * 友链分类创建数据
 */
export interface CategoryCreateData {
  name: string
  description?: string
  sortOrder?: number
}

/**
 * 友链统计信息
 */
export interface FriendLinkStats {
  totalLinks: number
  approvedLinks: number
  pendingLinks: number
  rejectedLinks: number
  totalClicks: number
  activeLinks: number
}

/**
 * 友链搜索参数
 */
export interface FriendLinkSearchParams {
  keyword: string
  page?: number
  pageSize?: number
  category?: string
  status?: 'approved' | 'pending' | 'rejected'
}

/**
 * 友情链接相关的API请求
 */
export const friendLinkApi = {
  /**
   * 获取友情链接列表
   */
  getFriendLinks(params?: FriendLinkListParams): Promise<FriendLinkListResponse> {
    return apiService.get<FriendLinkListResponse>('/friend-links', { params })
  },

  /**
   * 获取友情链接详情
   */
  getFriendLinkById(id: string): Promise<FriendLink> {
    return apiService.get<FriendLink>(`/friend-links/${id}`)
  },

  /**
   * 预览网站favicon
   */
  previewFavicon(url: string): Promise<FaviconPreviewResponse> {
    return apiService.get<FaviconPreviewResponse>('/friend-links/preview-favicon', { params: { url } })
  },

  /**
   * 申请友情链接
   */
  applyFriendLink(data: FriendLinkApplyData): Promise<FriendLink> {
    return apiService.post<FriendLink>('/friend-links/apply', data)
  },

  /**
   * 创建友情链接（管理员）
   */
  createFriendLink(data: FriendLinkCreateData): Promise<FriendLink> {
    return apiService.post<FriendLink>('/friend-links', data)
  },

  /**
   * 更新友情链接
   */
  updateFriendLink(id: string, data: Partial<FriendLinkCreateData>): Promise<FriendLink> {
    return apiService.put<FriendLink>(`/friend-links/${id}`, data)
  },

  /**
   * 删除友情链接
   */
  deleteFriendLink(id: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/friend-links/${id}`)
  },

  /**
   * 审核友情链接申请（管理员）
   */
  reviewFriendLink(id: string, data: ReviewData): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>(`/friend-links/${id}/review`, data)
  },

  /**
   * 检查友情链接状态
   */
  checkFriendLinkStatus(id: string): Promise<{ status: 'online' | 'offline'; responseTime?: number }> {
    return apiService.post<{ status: 'online' | 'offline'; responseTime?: number }>(`/friend-links/${id}/check`)
  },

  /**
   * 批量检查友情链接状态
   */
  checkAllFriendLinks(): Promise<{ checkedCount: number; onlineCount: number; offlineCount: number }> {
    return apiService.post<{ checkedCount: number; onlineCount: number; offlineCount: number }>('/friend-links/check-all')
  },

  /**
   * 获取待审核的友情链接申请
   */
  getPendingApplications(params?: FriendLinkListParams): Promise<FriendLinkListResponse> {
    return apiService.get<FriendLinkListResponse>('/friend-links/pending', { params })
  },

  /**
   * 获取已通过的友情链接
   */
  getApprovedFriendLinks(params?: FriendLinkListParams): Promise<FriendLinkListResponse> {
    return apiService.get<FriendLinkListResponse>('/friend-links/approved', { params })
  },

  /**
   * 获取友情链接分类列表
   */
  getCategories(): Promise<FriendLinkCategoriesResponse> {
    return apiService.get<FriendLinkCategoriesResponse>('/friend-links/categories')
  },

  /**
   * 创建友情链接分类
   */
  createCategory(data: CategoryCreateData): Promise<{ success: boolean; category: string }> {
    return apiService.post<{ success: boolean; category: string }>('/friend-links/categories', data)
  },

  /**
   * 上传友情链接Logo
   */
  uploadLogo(formData: FormData): Promise<UploadResponse> {
    return apiService.upload<UploadResponse>('/friend-links/upload/logo', formData)
  },

  /**
   * 搜索友情链接
   */
  searchFriendLinks(keyword: string, params: Omit<FriendLinkSearchParams, 'keyword'> = {}): Promise<FriendLinkListResponse> {
    return apiService.get<FriendLinkListResponse>('/friend-links/search', { 
      params: { keyword, ...params } 
    })
  },

  /**
   * 获取友情链接统计信息
   */
  getStats(): Promise<FriendLinkStats> {
    return apiService.get<FriendLinkStats>('/friend-links/stats')
  },

  /**
   * 点击友情链接（记录访问）
   */
  clickFriendLink(id: string): Promise<{ success: boolean; clickCount: number }> {
    return apiService.post<{ success: boolean; clickCount: number }>(`/friend-links/${id}/click`)
  },

  /**
   * 举报友情链接
   */
  reportFriendLink(id: string, data: ReportData): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>(`/friend-links/${id}/report`, data)
  }
}


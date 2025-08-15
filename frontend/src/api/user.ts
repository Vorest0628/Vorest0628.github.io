import { apiService } from '../services/api'
import type { 
  Comment, 
  PasswordChangeData, 
  ProfileUpdateData, 
  User 
} from '../types/api'

/**
 * 用户统计数据
 */
export interface UserStats {
  totalComments: number
  totalRecommendations: number
  totalLikes: number
  joinDate: string
}

/**
 * 用户推荐
 */
export interface UserRecommendation {
  id: number
  title: string
  description: string
  url?: string
  category: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 推荐创建/更新数据
 */
export interface RecommendationData {
  title: string
  description: string
  url?: string
  category: string
  isPublic: boolean
}

/**
 * 密码重置数据（通过邮箱）
 */
export interface EmailPasswordResetData {
  email: string
  newPassword: string
  confirmPassword: string
}

/**
 * 普通用户相关的API请求
 */
export const userApi = {
  /**
   * 获取当前用户的统计数据
   */
  getMyStats(): Promise<UserStats> {
    return apiService.get<UserStats>('/user/stats')
  },

  /**
   * 获取当前用户的评论
   */
  getMyComments(): Promise<Comment[]> {
    return apiService.get<Comment[]>('/user/comments')
  },

  /**
   * 获取当前用户的推荐
   */
  getMyRecommendations(): Promise<UserRecommendation[]> {
    return apiService.get<UserRecommendation[]>('/user/recommendations')
  },

  /**
   * 更新用户评论
   */
  updateMyComment(commentId: number, data: Partial<Comment>): Promise<Comment> {
    return apiService.put<Comment>(`/user/comments/${commentId}`, data)
  },

  /**
   * 删除用户评论
   */
  deleteMyComment(commentId: number): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/user/comments/${commentId}`)
  },

  /**
   * 更新用户推荐
   */
  updateMyRecommendation(recommendationId: number, data: RecommendationData): Promise<UserRecommendation> {
    return apiService.put<UserRecommendation>(`/user/recommendations/${recommendationId}`, data)
  },

  /**
   * 删除用户推荐
   */
  deleteMyRecommendation(recommendationId: number): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/user/recommendations/${recommendationId}`)
  },

  /**
   * 更新用户资料
   */
  updateProfile(data: ProfileUpdateData): Promise<{ user: User }> {
    return apiService.put<{ user: User }>('/user/profile', data)
  },

  /**
   * 修改密码
   */
  changePassword(data: PasswordChangeData): Promise<{ success: boolean; message: string }> {
    return apiService.put<{ success: boolean; message: string }>('/user/password', data)
  },

  /**
   * 重置密码（通过邮箱）
   */
  resetPassword(data: EmailPasswordResetData): Promise<{ success: boolean; message: string }> {
    return apiService.post<{ success: boolean; message: string }>('/user/reset-password', data)
  }
}


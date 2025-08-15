import { apiService } from '../services/api'
import type { StatsResponse } from '../types/api'

/**
 * 页面访问记录数据
 */
export interface VisitData {
  page: string
  userAgent: string
}

/**
 * 热门内容数据
 */
export interface PopularContent {
  blogs: Array<{ id: number; title: string; viewCount: number }>
  images: Array<{ id: number; title: string; viewCount: number }>
  documents: Array<{ id: number; title: string; viewCount: number }>
}

/**
 * 统计相关的API请求
 */
export const statsApi = {
  /**
   * 获取网站基础统计数据
   */
  getWebsiteStats(): Promise<StatsResponse> {
    return apiService.get<StatsResponse>('/stats')
  },

  /**
   * 获取热门内容统计
   */
  getPopularContent(): Promise<PopularContent> {
    return apiService.get<PopularContent>('/stats/popular')
  },

  /**
   * 记录页面访问
   */
  recordVisit(visitData: VisitData): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>('/stats/visit', visitData)
  }
}


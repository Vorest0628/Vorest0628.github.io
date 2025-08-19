import { apiService } from '../services/api'
import type { StatsResponse } from '../types/api'

/*
StatsApi输出函数一览：
getWebsiteStats 获取网站基础统计数据
getPopularContent 获取热门内容统计
recordVisit 记录页面访问
getStats 获取统计数据
getPopularBlogs 获取热门博客
getLatestBlogs 获取最新博客
getPopularImages 获取热门图片
getLatestImages 获取最新图片
getPopularDocuments 获取热门文档
getLatestDocuments 获取最新文档
getPopularComments 获取热门评论
getLatestComments 获取最新评论
getPopularFriendLinks 获取热门友情链接
getLatestFriendLinks 获取最新友情链接
getPopularUsers 获取热门用户
getLatestUsers 获取最新用户
*/

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


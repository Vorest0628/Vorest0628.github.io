import { apiService } from '../services/api'
import type { 
  Comment, 
  CommentListParams, 
  CommentListResponse,
  CommentCreateData,
  LikeStatusResponse,
  ReportData,
  ReviewData
} from '../types/api'

/*
CommentApi输出函数一览：
getComments 获取评论列表
getCommentById 获取评论详情
createComment 创建评论
updateComment 更新评论
deleteComment 删除评论
replyComment 回复评论
likeComment 点赞评论
unlikeComment 取消点赞评论
checkLikeStatus 检查点赞状态
reportComment 举报评论
getTargetComments 获取指定目标的评论
getPopularComments 获取热门评论
getLatestComments 获取最新评论
getMyComments 获取我的评论
reviewComment 审核评论（管理员）
getStats 获取评论统计信息
searchComments 搜索评论
updateCommentVisibility 更新评论公开状态
*/

/**
 * 评论回复数据
 */
export interface CommentReplyData {
  content: string
  authorName?: string
  authorEmail?: string
}

/**
 * 评论搜索参数
 */
export interface CommentSearchParams {
  keyword: string
  page?: number
  pageSize?: number
  targetType?: 'blog' | 'gallery' | 'document' | 'playlist'
  targetId?: number
}

/**
 * 热门评论查询参数
 */
export interface PopularCommentsParams {
  limit?: number
  targetType?: 'blog' | 'gallery' | 'document' | 'playlist'
  targetId?: number
}

/**
 * 最新评论查询参数
 */
export interface LatestCommentsParams {
  limit?: number
  targetType?: 'blog' | 'gallery' | 'document' | 'playlist'
}

/**
 * 评论统计信息
 */
export interface CommentStats {
  totalComments: number
  approvedComments: number
  pendingComments: number
  rejectedComments: number
  totalLikes: number
}

/**
 * 评论相关的API请求
 */
export const commentApi = {
  /**
   * 获取评论列表
   */
  getComments(params?: CommentListParams): Promise<CommentListResponse> {
    return apiService.get<CommentListResponse>('/comments', { params })
  },

  /**
   * 获取评论详情
   */
  getCommentById(id: number): Promise<Comment> {
    return apiService.get<Comment>(`/comments/${id}`)
  },

  /**
   * 创建评论
   */
  createComment(data: CommentCreateData): Promise<Comment> {
    return apiService.post<Comment>('/comments', data)
  },

  /**
   * 更新评论
   */
  updateComment(id: number, data: Partial<CommentCreateData>): Promise<Comment> {
    return apiService.put<Comment>(`/comments/${id}`, data)
  },

  /**
   * 删除评论
   */
  deleteComment(id: number): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/comments/${id}`)
  },

  /**
   * 回复评论
   */
  replyComment(parentId: number, data: CommentReplyData): Promise<Comment> {
    return apiService.post<Comment>(`/comments/${parentId}/reply`, data)
  },

  /**
   * 点赞评论
   */
  likeComment(id: number): Promise<{ success: boolean; likeCount: number }> {
    return apiService.post<{ success: boolean; likeCount: number }>(`/comments/${id}/like`)
  },

  /**
   * 取消点赞评论
   */
  unlikeComment(id: number): Promise<{ success: boolean; likeCount: number }> {
    return apiService.delete<{ success: boolean; likeCount: number }>(`/comments/${id}/like`)
  },

  /**
   * 检查点赞状态
   */
  checkLikeStatus(id: number): Promise<LikeStatusResponse> {
    return apiService.get<LikeStatusResponse>(`/comments/${id}/like-status`)
  },

  /**
   * 举报评论
   */
  reportComment(id: number, data: ReportData): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>(`/comments/${id}/report`, data)
  },

  /**
   * 获取指定目标的评论
   */
  getTargetComments(
    targetType: 'blog' | 'gallery' | 'document' | 'playlist', 
    targetId: number, 
    params: CommentListParams = {}
  ): Promise<CommentListResponse> {
    return apiService.get<CommentListResponse>(`/comments/${targetType}/${targetId}`, { params })
  },

  /**
   * 获取热门评论
   */
  getPopularComments(params: PopularCommentsParams = {}): Promise<Comment[]> {
    return apiService.get<Comment[]>('/comments/popular', { params })
  },

  /**
   * 获取最新评论
   */
  getLatestComments(params: LatestCommentsParams = {}): Promise<Comment[]> {
    return apiService.get<Comment[]>('/comments/latest', { params })
  },

  /**
   * 获取我的评论
   */
  getMyComments(params: CommentListParams = {}): Promise<CommentListResponse> {
    return apiService.get<CommentListResponse>('/comments/my', { params })
  },

  /**
   * 审核评论（管理员）
   */
  reviewComment(id: number, data: ReviewData): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>(`/comments/${id}/review`, data)
  },

  /**
   * 获取评论统计信息
   */
  getStats(params: Record<string, any> = {}): Promise<CommentStats> {
    return apiService.get<CommentStats>('/comments/stats', { params })
  },

  /**
   * 搜索评论
   */
  searchComments(keyword: string, params: Omit<CommentSearchParams, 'keyword'> = {}): Promise<CommentListResponse> {
    return apiService.get<CommentListResponse>('/comments/search', { 
      params: { keyword, ...params } 
    })
  },

  /**
   * 更新评论公开状态
   */
  updateCommentVisibility(id: number, isPublic: boolean): Promise<Comment> {
    return apiService.put<Comment>(`/comments/${id}`, { isPublic })
  }
}


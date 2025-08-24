import { apiService } from '../services/api'
import type { Document, DocumentListParams, DocumentListResponse, ApiResponse } from '../types/api'

/**
 * 文档预览内容响应
 */
export interface DocumentContentResponse { content: Blob }

/**
 * 文档下载响应
 */
export interface DocumentDownloadResponse { blob: Blob }

/**
 * 文档分类响应
 */
export interface DocumentCategoriesResponse { categories: string[] }

/*
DocumentApi输出函数一览：
getDocuments 获取文档列表
getCategories 获取文档分类列表
recordView 记录文档查看次数
downloadDocument 下载文档
getDocumentContent 获取文档原始内容用于预览
*/


/**
 * 文档相关的API请求
 */
export const documentApi = {
  /**
   * 获取文档列表
   */
  getDocuments(params: DocumentListParams = {}): Promise<DocumentListResponse> {
    const { page, pageSize, limit, ...rest } = params || {}
    // 后端使用 limit，这里做映射；优先使用显式 limit
    const query = { page, limit: limit ?? pageSize, ...rest }
    return apiService.get<DocumentListResponse>('/documents', { params: query })
  },

  /**
   * 获取文档分类列表
   */
  getCategories(): Promise<ApiResponse<{ categories: string[]; allTags?: string[]; tagsByCategory?: Record<string, string[]> }>> {
    return apiService.get<ApiResponse<{ categories: string[]; allTags?: string[]; tagsByCategory?: Record<string, string[]> }>>('/documents/categories')
  },

  /**
   * 记录文档查看次数
   */
  recordView(id: string): Promise<{ success: boolean; message?: string }> {
    return apiService.post<{ success: boolean; message?: string }>(`/documents/${id}/view`, {})
  },

  /**
   * 下载文档（需要认证）
   */
  downloadDocument(id: string): Promise<Blob> {
    return apiService.get<Blob>(`/documents/${id}/download`, {
      responseType: 'blob',
    })
  },

  /**
   * 获取文档原始内容用于预览
   */
  getDocumentContent(id: string): Promise<Blob> {
    return apiService.get<Blob>(`/documents/${id}/content`, {
      responseType: 'blob',
    })
  },
}


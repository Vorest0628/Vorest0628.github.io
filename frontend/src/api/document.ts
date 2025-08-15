import { apiService } from '../services/api'
import type { Document, DocumentListParams, DocumentListResponse } from '../types/api'

/**
 * 文档预览内容响应
 */
export interface DocumentContentResponse {
  content: Blob
}

/**
 * 文档下载响应
 */
export interface DocumentDownloadResponse {
  blob: Blob
}

/**
 * 文档分类响应
 */
export interface DocumentCategoriesResponse {
  categories: string[]
}

/**
 * 文档相关的API请求
 */
export const documentApi = {
  /**
   * 获取文档列表
   */
  getDocuments(params?: DocumentListParams): Promise<DocumentListResponse> {
    return apiService.get<DocumentListResponse>('/documents', { params })
  },

  /**
   * 获取文档分类列表
   */
  getCategories(): Promise<DocumentCategoriesResponse> {
    return apiService.get<DocumentCategoriesResponse>('/documents/categories')
  },

  /**
   * 记录文档查看次数
   */
  recordView(id: number): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>(`/documents/${id}/view`, {})
  },

  /**
   * 下载文档（需要认证）
   */
  downloadDocument(id: number): Promise<Blob> {
    return apiService.get<Blob>(`/documents/${id}/download`, {
      responseType: 'blob',
    })
  },

  /**
   * 获取文档原始内容用于预览
   */
  getDocumentContent(id: number): Promise<Blob> {
    return apiService.get<Blob>(`/documents/${id}/content`, {
      responseType: 'blob',
    })
  },
}


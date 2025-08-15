import { apiService } from '../services/api'
import type { AxiosProgressEvent } from 'axios'
import type { 
  GalleryImage, 
  GalleryListParams, 
  GalleryListResponse,
  GalleryImageCreateData 
} from '../types/api'

/**
 * 图库标签响应
 */
export interface GalleryTagsResponse {
  tags: string[]
}

/**
 * 图库分类响应
 */
export interface GalleryCategoriesResponse {
  categories: string[]
}

/**
 * 图片上传进度回调函数类型
 */
export type UploadProgressCallback = (progressEvent: AxiosProgressEvent) => void

/**
 * 图库相关的API请求
 */
export const galleryApi = {
  /**
   * ADMIN: 获取所有图片 (用于管理后台)
   */
  getAllImages(): Promise<GalleryListResponse> {
    return apiService.get<GalleryListResponse>('/gallery/all')
  },

  /**
   * 获取图片列表
   */
  getImages(params?: GalleryListParams): Promise<GalleryListResponse> {
    return apiService.get<GalleryListResponse>('/gallery', { params })
  },

  /**
   * 获取图片详情
   */
  getImageById(id: number): Promise<GalleryImage> {
    return apiService.get<GalleryImage>(`/gallery/${id}`)
  },

  /**
   * 上传图片 (ADMIN)
   */
  uploadImage(formData: FormData, onUploadProgress?: UploadProgressCallback): Promise<GalleryImage> {
    // 注意：后端的路由是 /gallery, 而不是 /gallery/upload
    return apiService.post<GalleryImage>('/gallery', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    })
  },

  /**
   * 更新图片信息 (ADMIN)
   */
  updateImage(id: number, data: Partial<GalleryImageCreateData>): Promise<GalleryImage> {
    return apiService.put<GalleryImage>(`/gallery/${id}`, data)
  },

  /**
   * 删除图片 (ADMIN)
   */
  deleteImage(id: number): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/gallery/${id}`)
  },

  /**
   * 获取所有唯一的公开标签
   */
  getTags(): Promise<GalleryTagsResponse> {
    return apiService.get<GalleryTagsResponse>('/gallery/tags')
  },

  /**
   * 获取所有公开的分类
   */
  getCategories(): Promise<GalleryCategoriesResponse> {
    return apiService.get<GalleryCategoriesResponse>('/gallery/categories')
  }
}

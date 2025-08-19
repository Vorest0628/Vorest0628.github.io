import { apiService } from '../services/api'
import type { UploadResponse } from '../types/api'

//上传图片
export async function uploadImage(file: File): Promise<UploadResponse> {
  const form = new FormData()
  form.append('image', file)
  const response = await apiService.post<{ success: boolean; message?: string; data: UploadResponse }>('/uploads/images', form, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  })
  if (!response?.success) throw new Error(response?.message || '上传失败')
  return response.data
}
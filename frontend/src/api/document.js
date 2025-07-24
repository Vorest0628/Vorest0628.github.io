import { apiService } from '../services/api'

export const documentApi = {
  getDocuments(params) {
    return apiService.get('/documents', { params })
  },

  getCategories() {
    return apiService.get('/documents/categories')
  },

  recordView(id) {
    return apiService.post(`/documents/${id}/view`, {})
  },

  // New function to handle authenticated downloads
  downloadDocument(id) {
    return apiService.get(`/documents/${id}/download`, {
      responseType: 'blob',
    })
  },

  // New function to get raw content for preview
  getDocumentContent(id) {
    return apiService.get(`/documents/${id}/preview`, {
      responseType: 'blob',
    })
  },
}
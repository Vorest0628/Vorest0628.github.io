import api from '@/services/api'

export async function uploadImage(file) {
  const form = new FormData()
  form.append('image', file)
  const { data } = await api.post('/uploads/images', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  if (!data?.success) throw new Error(data?.message || '上传失败')
  return data.data // { url, width, height, contentType }
}
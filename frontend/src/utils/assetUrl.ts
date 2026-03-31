const trimTrailingSlash = (value?: string): string => String(value || '').trim().replace(/\/+$/, '')

const trimApiSuffix = (value?: string): string => trimTrailingSlash(value).replace(/\/api$/i, '')

export const getApiBaseUrl = (): string => {
  const envUrl = trimTrailingSlash(import.meta.env.VITE_APP_API_URL)
  return envUrl || '/api'
}

export const getApiOrigin = (): string => {
  const envOrigin = trimTrailingSlash(import.meta.env.VITE_APP_API_ORIGIN)
  if (envOrigin) return envOrigin

  const derivedOrigin = trimApiSuffix(import.meta.env.VITE_APP_API_URL)
  if (derivedOrigin) return derivedOrigin

  if (typeof window !== 'undefined') {
    return trimTrailingSlash(window.location.origin)
  }

  return ''
}

export const getAssetBase = (): string => {
  const envAssetBase = trimTrailingSlash(import.meta.env.VITE_ASSET_BASE_URL)
  if (envAssetBase) return envAssetBase

  const apiOrigin = getApiOrigin()
  return apiOrigin ? `${apiOrigin}/uploads` : '/uploads'
}

export const resolveStoredAssetUrl = (href?: string): string => {
  const value = String(href || '').trim()
  if (!value) return ''

  if (/^(https?:|data:)/i.test(value)) {
    return value
  }

  const apiOrigin = getApiOrigin()
  if (/^\/api\//i.test(value) || /^\/uploads\//i.test(value)) {
    return apiOrigin ? `${apiOrigin}${value}` : value
  }

  const assetBase = getAssetBase()
  return assetBase
    ? `${assetBase.replace(/\/$/, '')}/${value.replace(/^\//, '')}`
    : value
}

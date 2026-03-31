const trimTrailingSlash = (value?: string): string => String(value || '').trim().replace(/\/+$/, '')

const trimApiSuffix = (value?: string): string => trimTrailingSlash(value).replace(/\/api$/i, '')

const isAbsoluteHttpUrl = (value?: string): boolean => /^https?:\/\//i.test(String(value || ''))

const isLocalHost = (hostname?: string): boolean => ['localhost', '127.0.0.1', '::1'].includes(String(hostname || ''))

const shouldAllowCrossOriginApi = (): boolean => String(import.meta.env.VITE_ALLOW_CROSS_ORIGIN_API || '').toLowerCase() === 'true'

const getRuntimeOrigin = (): string => (
  typeof window !== 'undefined' ? trimTrailingSlash(window.location.origin) : ''
)

const shouldPreferRuntimeOrigin = (): boolean => {
  if (typeof window === 'undefined') return false
  if (shouldAllowCrossOriginApi()) return false
  return !isLocalHost(window.location.hostname)
}

const shouldUseConfiguredAbsoluteUrl = (value?: string): boolean => {
  if (!value || !isAbsoluteHttpUrl(value)) return true

  if (!shouldPreferRuntimeOrigin()) return true

  const runtimeOrigin = getRuntimeOrigin()
  if (!runtimeOrigin) return true

  try {
    return new URL(value).origin === runtimeOrigin
  } catch {
    return true
  }
}

export const getApiBaseUrl = (): string => {
  const envUrl = trimTrailingSlash(import.meta.env.VITE_APP_API_URL)
  if (envUrl && shouldUseConfiguredAbsoluteUrl(envUrl)) {
    return envUrl
  }

  return '/api'
}

export const getApiOrigin = (): string => {
  const envOrigin = trimTrailingSlash(import.meta.env.VITE_APP_API_ORIGIN)
  const derivedOrigin = trimApiSuffix(import.meta.env.VITE_APP_API_URL)
  const configuredOrigin = envOrigin || derivedOrigin

  if (configuredOrigin && shouldUseConfiguredAbsoluteUrl(configuredOrigin)) {
    return configuredOrigin
  }

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

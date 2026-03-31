const DEFAULT_API_ORIGIN = 'https://api.shirakawananase.top'

export const getAssetBase = (): string => (
  import.meta.env.PROD ? (import.meta.env.VITE_ASSET_BASE_URL || '') : '/uploads/'
)

export const getApiOrigin = (): string => (
  import.meta.env.PROD ? (import.meta.env.VITE_APP_API_ORIGIN || DEFAULT_API_ORIGIN) : ''
)

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

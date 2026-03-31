/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_URL?: string
  readonly VITE_APP_API_ORIGIN?: string
  readonly VITE_ASSET_BASE_URL?: string
  readonly VITE_ALLOW_CROSS_ORIGIN_API?: string
  readonly NODE_ENV?: string
  readonly MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

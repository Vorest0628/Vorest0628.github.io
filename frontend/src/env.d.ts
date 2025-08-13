/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_URL?: string
  readonly NODE_ENV?: string
  readonly MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}



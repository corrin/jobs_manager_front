/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_ALLOWED_HOSTS: string
  readonly VITE_WEEKEND_TIMESHEETS_ENABLED: string
  readonly VITE_AUTH_METHOD: 'cookie' | 'bearer'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

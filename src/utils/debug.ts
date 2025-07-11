/**
 * @deprecated Use generated types from src/api/generated instead
 * This interface will be removed after migration to openapi-zod-client generated types
 */
interface ViteImportMeta {
  env: {
    MODE?: string
    VITE_DEBUG?: string
  }
}

const isDevelopment = (import.meta as unknown as ViteImportMeta).env?.MODE === 'development'
const debugEnabled =
  (import.meta as unknown as ViteImportMeta).env?.VITE_DEBUG === 'true' || isDevelopment

export function debugLog(...args: unknown[]): void {
  if (debugEnabled) {
    console.log('[DEBUG]', ...args)
  }
}

export const debug = {
  log: (...args: unknown[]) => {
    if (debugEnabled) {
      debugLog('[DEBUG]', ...args)
    }
  },

  warn: (...args: unknown[]) => {
    if (debugEnabled) {
      debugLog('[DEBUG-WARN]', ...args)
    }
  },

  error: (...args: unknown[]) => {
    if (debugEnabled) {
      debugLog('[DEBUG-ERROR]', ...args)
    }
  },

  group: (label: string) => {
    if (debugEnabled) {
      console.group(`[DEBUG] ${label}`)
    }
  },

  groupEnd: () => {
    if (debugEnabled) {
      console.groupEnd()
    }
  },

  table: (data: Record<string, unknown> | unknown[]) => {
    if (debugEnabled) {
      console.table(data)
    }
  },
}

export const isDebugEnabled = () => debugEnabled

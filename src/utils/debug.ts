/**
 * Debug utility for controlled logging in development/production
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

export const debug = {
  log: (...args: unknown[]) => {
    if (debugEnabled) {
      console.log('[DEBUG]', ...args)
    }
  },

  warn: (...args: unknown[]) => {
    if (debugEnabled) {
      console.warn('[DEBUG-WARN]', ...args)
    }
  },

  error: (...args: unknown[]) => {
    if (debugEnabled) {
      console.error('[DEBUG-ERROR]', ...args)
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

/**
 * Simple debug log function for backward compatibility with console.log replacements
 */
export function debugLog(...args: unknown[]): void {
  if (debugEnabled) {
    console.log('[DEBUG]', ...args)
  }
}

export const isDebugEnabled = () => debugEnabled

import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable para auto-sync de dados do job
 * Mantém os dados sincronizados automaticamente em intervalos regulares
 */
export function useJobAutoSync(
  jobId: string,
  reloadFunction: () => Promise<void>,
  options: {
    interval?: number // em ms, default 30 segundos
    enabled?: boolean
    onError?: (error: Error) => void
  } = {}
) {
  const {
    interval = 30000,
    enabled = true,
    onError
  } = options

  const isAutoSyncEnabled = ref(enabled)
  const lastSyncTime = ref<Date | null>(null)
  const syncError = ref<Error | null>(null)
  const isSyncing = ref(false)

  let intervalId: number | null = null

  const performSync = async () => {
    if (!isAutoSyncEnabled.value || isSyncing.value) {
      return
    }

    try {
      isSyncing.value = true
      syncError.value = null

      console.log(`🔄 Auto-sync: Reloading job ${jobId} data...`)
      await reloadFunction()

      lastSyncTime.value = new Date()
      console.log(`✅ Auto-sync: Job ${jobId} data reloaded successfully`)
    } catch (error) {
      const syncErr = error instanceof Error ? error : new Error('Unknown sync error')
      syncError.value = syncErr

      console.error(`❌ Auto-sync error for job ${jobId}:`, syncErr)

      if (onError) {
        onError(syncErr)
      }
    } finally {
      isSyncing.value = false
    }
  }

  const startAutoSync = () => {
    if (intervalId) {
      clearInterval(intervalId)
    }

    if (isAutoSyncEnabled.value && interval > 0) {
      console.log(`🚀 Auto-sync: Starting for job ${jobId} (interval: ${interval}ms)`)
      intervalId = setInterval(performSync, interval)
    }
  }

  const stopAutoSync = () => {
    if (intervalId) {
      console.log(`⏹️ Auto-sync: Stopping for job ${jobId}`)
      clearInterval(intervalId)
      intervalId = null
    }
  }

  const enableAutoSync = () => {
    isAutoSyncEnabled.value = true
    startAutoSync()
  }

  const disableAutoSync = () => {
    isAutoSyncEnabled.value = false
    stopAutoSync()
  }

  const manualSync = async () => {
    await performSync()
  }

  // Lifecycle hooks
  onMounted(() => {
    if (isAutoSyncEnabled.value) {
      startAutoSync()
    }
  })

  onUnmounted(() => {
    stopAutoSync()
  })

  // Watch for enabled state changes
  const toggleAutoSync = (enabled: boolean) => {
    if (enabled) {
      enableAutoSync()
    } else {
      disableAutoSync()
    }
  }

  return {
    isAutoSyncEnabled,
    lastSyncTime,
    syncError,
    isSyncing,
    enableAutoSync,
    disableAutoSync,
    toggleAutoSync,
    manualSync,
    performSync
  }
}

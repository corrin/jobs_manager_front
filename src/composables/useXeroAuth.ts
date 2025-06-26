import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export function useXeroAuth() {
  const router = useRouter()

  // State
  const entities = ref<string[]>([])
  const entityStats = reactive<
    Record<string, { status: string; lastSync: string; recordsUpdated: number }>
  >({})
  const log = ref<
    Array<{
      datetime: string
      message: string
      severity: string
      entity?: string
      progress?: number
      recordsUpdated?: number
    }>
  >([])
  const logOpen = ref(false)
  const isAuthenticated = ref(false)
  const syncing = ref(false)
  const loading = ref(true)
  const error = ref('')
  const eventSource = ref<EventSource | null>(null)
  const overallProgress = ref(0)
  const entityProgress = ref(0)
  const currentEntity = ref('')

  // Utils
  function formatEntityName(entity: string) {
    return entity
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }
  function formatLastSync(lastSync: string) {
    if (!lastSync || lastSync === '2000-01-01T00:00:00Z') return '-'
    return new Date(lastSync).toLocaleString()
  }
  function formatTime(dt: string) {
    if (!dt) return ''
    return new Date(dt).toLocaleTimeString()
  }
  function statusClass(status: string) {
    switch (status) {
      case 'In Progress':
        return 'text-blue-600 font-medium'
      case 'Completed':
        return 'text-green-600 font-medium'
      case 'Error':
        return 'text-red-600 font-medium'
      default:
        return 'text-gray-500'
    }
  }
  function logClass(severity: string) {
    switch (severity) {
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-700'
      case 'info':
        return 'text-gray-700'
      default:
        return ''
    }
  }
  function toggleLog() {
    logOpen.value = !logOpen.value
  }
  const currentEntityLabel = computed(() =>
    currentEntity.value ? formatEntityName(currentEntity.value) : 'None',
  )

  // Auth
  function loginXero() {
    // Usa o endpoint correto e next como URL do front-end
    const frontendUrl = window.location.origin + router.currentRoute.value.fullPath
    const next = encodeURIComponent(frontendUrl)
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    const url = `${apiBase}/api/xero/authenticate/?next=${next}`
    window.location.href = url
  }
  function logoutXero() {
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    const url = `${apiBase}/api/xero/disconnect/`
    window.location.href = url
  }

  async function ensureAuth(): Promise<boolean> {
    try {
      await axios.get('/api/xero/ping', { withCredentials: true })
      return true
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { data?: { redirect_to_auth?: boolean } } }).response?.data
          ?.redirect_to_auth
      ) {
        loginXero()
      }
      return false
    }
  }

  async function guard(): Promise<boolean> {
    return await ensureAuth()
  }

  // Data fetch & sync
  async function fetchEntitiesAndStatus() {
    loading.value = true
    error.value = ''
    try {
      const res = await fetch('/api/xero/sync-info/')
      if (res.status === 401) {
        isAuthenticated.value = false
        loading.value = false
        return
      }
      const data = await res.json()
      isAuthenticated.value = true
      entities.value = data.entities || Object.keys(data.last_syncs || {})
      for (const entity of entities.value) {
        entityStats[entity] = {
          status: 'Pending',
          lastSync: data.last_syncs?.[entity] || '-',
          recordsUpdated: 0,
        }
      }
      if (data.sync_in_progress) {
        startSSE()
      } else {
        overallProgress.value = 0
        entityProgress.value = 0
        currentEntity.value = ''
        syncing.value = false
      }
    } catch {
      error.value = 'Failed to load Xero sync status.'
    } finally {
      loading.value = false
    }
  }

  async function startSync() {
    error.value = ''
    try {
      const res = await fetch('/api/xero/sync/', { method: 'POST' })
      if (res.status === 401) {
        isAuthenticated.value = false
        return
      }
      if (!res.ok) throw new Error('Failed to start sync')
      startSSE()
    } catch {
      error.value = 'Failed to start Xero sync.'
    }
  }

  function startSSE(_event?: unknown, closeOnly = false) {
    if (eventSource.value) {
      eventSource.value.close()
      if (closeOnly) return
    }
    if (closeOnly) return
    syncing.value = true
    log.value = []
    overallProgress.value = 0
    entityProgress.value = 0
    currentEntity.value = ''
    for (const entity of entities.value) {
      entityStats[entity].status = 'Pending'
      entityStats[entity].recordsUpdated = 0
    }
    eventSource.value = new EventSource('/api/xero/sync-stream/')
    eventSource.value.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data)
      log.value.push(data)
      if (!data) return
      if (data.severity === 'error') {
        error.value = data.message
        if (data.entity && entityStats[data.entity]) {
          entityStats[data.entity].status = 'Error'
        }
        return
      }
      if (data.message === 'Sync stream ended') {
        syncing.value = false
        eventSource.value?.close()
        overallProgress.value = 1
        entityProgress.value = 1
        currentEntity.value = ''
        fetchEntitiesAndStatus()
        return
      }
      if (data.entity && data.entity !== 'sync') {
        currentEntity.value = data.entity
        if (typeof data.progress === 'number') {
          entityProgress.value = data.progress
          entityStats[data.entity].status = 'In Progress'
        }
        if (typeof data.progress === 'number') {
          entityStats[data.entity].recordsUpdated =
            data.recordsUpdated ?? entityStats[data.entity].recordsUpdated
        }
        if (data.message?.includes('Completed sync of')) {
          entityStats[data.entity].status = 'Completed'
          entityStats[data.entity].lastSync = data.datetime
          entityProgress.value = 1
          return
        }
      }
      const completed = entities.value.filter((e) => entityStats[e].status === 'Completed').length
      overallProgress.value = completed / entities.value.length
    }
    eventSource.value.onerror = () => {
      error.value = 'Connection to sync stream lost.'
      syncing.value = false
      eventSource.value?.close()
    }
  }

  onMounted(() => {
    fetchEntitiesAndStatus()
  })
  onUnmounted(() => {
    if (eventSource.value) {
      eventSource.value.close()
    }
  })

  return {
    entities,
    entityStats,
    log,
    logOpen,
    isAuthenticated,
    syncing,
    loading,
    error,
    overallProgress,
    entityProgress,
    currentEntity,
    currentEntityLabel,
    fetchEntitiesAndStatus,
    loginXero,
    logoutXero,
    startSync,
    toggleLog,
    logClass,
    statusClass,
    formatEntityName,
    formatLastSync,
    formatTime,
    startSSE,
    guard,
  }
}

<template>
  <AppLayout>
    <div class="max-w-3xl mx-auto py-8 px-4">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Xero Sync Progress</h1>
        <div class="flex gap-2">
          <Button v-if="!isAuthenticated && !loading" @click="loginXero" variant="default"
            >Login with Xero</Button
          >
          <Button
            v-if="isAuthenticated && !syncing && !loading"
            @click="startSync"
            variant="default"
            >Start Sync</Button
          >
          <Button v-if="isAuthenticated && !loading" @click="logoutXero" variant="ghost"
            >Disconnect</Button
          >
        </div>
      </div>
      <div v-if="loading" class="flex justify-center items-center h-40">
        <span class="text-lg">Loading...</span>
      </div>
      <div v-else>
        <div v-if="!isAuthenticated" class="text-center text-red-600 font-medium py-8">
          <span>Your Xero session has expired or is not connected.</span>
        </div>
        <div v-else>
          <div class="mb-6">
            <div class="flex items-center justify-between mb-1">
              <span class="font-medium">Overall Progress</span>
              <span class="text-sm">{{ Math.round(overallProgress * 100) }}%</span>
            </div>
            <div class="w-full h-3 bg-gray-200 rounded">
              <div
                class="h-3 bg-indigo-600 rounded transition-all"
                :style="{ width: overallProgress * 100 + '%' }"
              ></div>
            </div>
          </div>
          <div class="mb-6">
            <div class="flex items-center justify-between mb-1">
              <span class="font-medium"
                >Current Entity: <span class="font-semibold">{{ currentEntityLabel }}</span></span
              >
              <span class="text-sm">{{ Math.round(entityProgress * 100) }}%</span>
            </div>
            <div class="w-full h-3 bg-gray-200 rounded">
              <div
                class="h-3 bg-teal-500 rounded transition-all"
                :style="{ width: entityProgress * 100 + '%' }"
              ></div>
            </div>
          </div>
          <div class="mb-6">
            <table class="w-full text-sm border rounded overflow-hidden">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left">Entity</th>
                  <th class="px-3 py-2 text-left">Last Sync</th>
                  <th class="px-3 py-2 text-left">Status</th>
                  <th class="px-3 py-2 text-right">Records Updated</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entity in entities" :key="entity" :class="'border-b last:border-b-0'">
                  <td class="px-3 py-2">{{ formatEntityName(entity) }}</td>
                  <td class="px-3 py-2">{{ formatLastSync(entityStats[entity]?.lastSync) }}</td>
                  <td class="px-3 py-2">
                    <span :class="statusClass(entityStats[entity]?.status)">{{
                      entityStats[entity]?.status
                    }}</span>
                  </td>
                  <td class="px-3 py-2 text-right">
                    {{ entityStats[entity]?.recordsUpdated ?? 0 }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mb-6">
            <div class="flex items-center cursor-pointer select-none" @click="toggleLog">
              <span class="font-medium mr-2">Sync Log</span>
              <svg
                :class="[logOpen ? 'rotate-180' : '', 'transition-transform']"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
            <div
              v-show="logOpen"
              class="bg-gray-50 border rounded p-2 mt-2 max-h-64 overflow-y-auto"
            >
              <div v-for="(msg, i) in log" :key="i" :class="logClass(msg.severity)">
                [{{ formatTime(msg.datetime) }}] {{ msg.message }}
              </div>
            </div>
          </div>
          <div v-if="error" class="text-red-600 font-medium mb-4">{{ error }}</div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import Button from '@/components/ui/button/Button.vue'

const entities = ref<string[]>([])
const entityStats = reactive<
  Record<string, { status: string; lastSync: string; recordsUpdated: number }>
>({})
const log = ref<
  {
    datetime: string
    message: string
    severity: string
    entity?: string
    progress?: number
    recordsUpdated?: number
  }[]
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

function loginXero() {
  window.location.href = '/api/xero/auth/'
}
function logoutXero() {
  window.location.href = '/api/xero/disconnect/'
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
function startSSE() {
  if (eventSource.value) {
    eventSource.value.close()
  }
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
    if (data.entity && data.entity !== 'sync') {
      currentEntity.value = data.entity
      if (typeof data.progress === 'number') {
        entityProgress.value = data.progress
        entityStats[data.entity].status = 'In Progress'
      }
    }
    if (typeof data.progress === 'number' && data.entity && data.entity !== 'sync') {
      entityStats[data.entity].recordsUpdated =
        data.recordsUpdated ?? entityStats[data.entity].recordsUpdated
    }
    if (data.message?.includes('Completed sync of')) {
      if (data.entity && entityStats[data.entity]) {
        entityStats[data.entity].status = 'Completed'
        entityStats[data.entity].lastSync = data.datetime
        entityProgress.value = 1
      }
    }
    if (data.severity === 'error') {
      error.value = data.message
      if (data.entity && entityStats[data.entity]) {
        entityStats[data.entity].status = 'Error'
      }
    }
    if (data.message === 'Sync stream ended') {
      syncing.value = false
      eventSource.value?.close()
      overallProgress.value = 1
      entityProgress.value = 1
      currentEntity.value = ''
      fetchEntitiesAndStatus()
    } else {
      const completed = entities.value.filter((e) => entityStats[e].status === 'Completed').length
      overallProgress.value = completed / entities.value.length
    }
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
  eventSource.value?.close()
})
</script>

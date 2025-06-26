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
import { onMounted, onUnmounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import Button from '../components/ui/button/Button.vue'
import { useXeroAuth } from '../composables/useXeroAuth'

const {
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
} = useXeroAuth()

onMounted(() => {
  fetchEntitiesAndStatus()
})
onUnmounted(() => {
  if (typeof window !== 'undefined' && window.EventSource) {
    startSSE(null, true)
  }
})
</script>

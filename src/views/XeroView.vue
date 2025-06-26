<template>
  <AppLayout>
    <div class="max-w-6xl mx-auto py-8 px-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Coluna Esquerda: Progresso -->
        <section>
          <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold tracking-tight text-indigo-400 flex items-center gap-2">
              <svg
                class="w-7 h-7 text-indigo-500 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" stroke-width="2" />
                <path d="M12 6v6l4 2" stroke-width="2" />
              </svg>
              Xero Sync Progress
            </h1>
            <div class="flex gap-2">
              <Button v-if="!isAuthenticated && !loading" @click="loginXero" variant="default">
                Login with Xero
              </Button>
              <Button
                v-if="isAuthenticated && !syncing && !loading"
                @click="startSync"
                variant="default"
                :disabled="syncing || loading"
              >
                Start Sync
              </Button>
              <Button v-if="isAuthenticated && !loading" @click="logoutXero" variant="ghost">
                Disconnect
              </Button>
            </div>
          </div>
          <div v-if="loading" class="flex justify-center items-center h-40">
            <span class="text-lg animate-pulse text-indigo-400">Loading...</span>
          </div>
          <div v-else>
            <div v-if="!isAuthenticated" class="text-center text-red-600 font-medium py-8">
              <span>Your Xero session has expired or is not connected.</span>
            </div>
            <div v-else>
              <div class="mb-6">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-zinc-200">Overall Progress</span>
                  <span class="text-sm text-zinc-400"
                    >{{ Math.round(overallProgress * 100) }}%</span
                  >
                </div>
                <Progress :value="overallProgress * 100" class="mt-1" />
              </div>
              <div class="mb-6">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-zinc-200">
                    Current Entity:
                    <span class="font-semibold text-indigo-300">{{ currentEntityLabel }}</span>
                  </span>
                  <span class="text-sm text-zinc-400">{{ Math.round(entityProgress * 100) }}%</span>
                </div>
                <Progress :value="entityProgress * 100" color="teal" class="mt-1" />
              </div>
              <div class="mb-6">
                <table class="w-full text-sm border rounded overflow-hidden bg-zinc-800/60 shadow">
                  <thead class="bg-zinc-900/80">
                    <tr>
                      <th class="px-3 py-2 text-left text-zinc-300">Entity</th>
                      <th class="px-3 py-2 text-left text-zinc-300">Last Sync</th>
                      <th class="px-3 py-2 text-left text-zinc-300">Status</th>
                      <th class="px-3 py-2 text-right text-zinc-300">Records Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="entity in entities"
                      :key="entity"
                      :class="'border-b border-zinc-700 last:border-b-0'"
                    >
                      <td class="px-3 py-2 text-zinc-100">{{ formatEntityName(entity) }}</td>
                      <td class="px-3 py-2 text-zinc-200">
                        <template v-if="entityStats[entity]?.lastSync === '-'">
                          <svg
                            class="animate-spin w-4 h-4 inline text-indigo-400"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              class="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              stroke-width="4"
                            ></circle>
                            <path
                              class="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            ></path>
                          </svg>
                        </template>
                        <template v-else>
                          {{ formatLastSync(entityStats[entity]?.lastSync) }}
                        </template>
                      </td>
                      <td class="px-3 py-2">
                        <span :class="statusClass(entityStats[entity]?.status)">{{
                          entityStats[entity]?.status
                        }}</span>
                      </td>
                      <td class="px-3 py-2 text-right text-zinc-100">
                        {{ entityStats[entity]?.recordsUpdated ?? 0 }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="error" class="text-red-600 font-medium mb-4">{{ error }}</div>
            </div>
          </div>
        </section>
        <!-- Coluna Direita: Log -->
        <aside>
          <h2 class="text-lg font-bold mb-2 text-indigo-400 flex items-center gap-2">
            <svg
              class="w-5 h-5 text-green-400 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke-width="2" />
              <path d="M7 9l5-5 5 5" stroke-width="2" />
              <path d="M12 4v12" stroke-width="2" />
            </svg>
            Sync Log
          </h2>
          <div
            class="bg-zinc-900 rounded-lg p-4 h-[32rem] max-h-[40vh] min-h-[16rem] overflow-y-auto font-mono text-sm shadow-inner border border-zinc-800 animate-fade-in"
          >
            <transition-group name="fade" tag="div">
              <div
                v-for="(msg, i) in log"
                :key="i"
                :class="logClass(msg.severity) + ' flex items-center gap-2'"
              >
                <span class="text-zinc-500">[{{ formatTime(msg.datetime) }}]</span>
                <span>{{ msg.message }}</span>
              </div>
            </transition-group>
          </div>
        </aside>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import Button from '../components/ui/button/Button.vue'
import Progress from '../components/ui/progress/Progress.vue'
import { useXeroAuth } from '../composables/useXeroAuth'

const {
  entities,
  entityStats,
  log,
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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.animate-fade-in {
  animation: fadeIn 0.7s;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>

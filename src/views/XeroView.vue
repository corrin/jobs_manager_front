<template>
  <AppLayout>
    <div class="max-w-6xl mx-auto py-12 px-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
        <!-- Left Column: Progress Section with improved contrast and larger elements -->
        <section>
          <div class="flex items-center justify-between mb-8">
            <h1
              class="text-4xl font-extrabold tracking-tight text-indigo-100 flex items-center gap-3 drop-shadow-lg"
            >
              <svg
                class="w-10 h-10 text-indigo-400 animate-pulse drop-shadow"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" stroke-width="2" />
                <path d="M12 6v6l4 2" stroke-width="2" />
              </svg>
              Xero Sync Progress
            </h1>
            <div class="flex gap-3">
              <Button
                v-if="!isAuthenticated && !loading"
                @click="loginXero"
                variant="default"
                class="text-lg px-6 py-3"
              >
                Login with Xero
              </Button>
              <Button
                v-if="isAuthenticated && !syncing && !loading"
                @click="startSync"
                variant="default"
                :disabled="syncing || loading"
                class="text-lg px-6 py-3"
              >
                Start Sync
              </Button>
              <Button
                v-if="isAuthenticated && !loading"
                @click="logoutXero"
                variant="ghost"
                class="text-lg px-6 py-3"
              >
                Disconnect
              </Button>
            </div>
          </div>
          <div v-if="loading" class="flex justify-center items-center h-52">
            <span class="text-2xl animate-pulse text-indigo-200">Loading...</span>
          </div>
          <div v-else>
            <div
              v-if="!isAuthenticated"
              class="text-center text-red-500 font-semibold py-12 text-xl bg-zinc-900/80 rounded-lg shadow-lg"
            >
              <span>Your Xero session has expired or is not connected.</span>
            </div>
            <div v-else>
              <div class="mb-8">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-zinc-100 text-lg">Overall Progress</span>
                  <span class="text-lg text-zinc-300"
                    >{{ Math.round(overallProgress * 100) }}%</span
                  >
                </div>
                <Progress
                  :value="overallProgress * 100"
                  class="mt-2 h-6 bg-zinc-800/90 rounded-xl shadow-inner"
                />
              </div>
              <div class="mb-8">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold text-zinc-100 text-lg">
                    Current Entity:
                    <span class="font-bold text-indigo-200">{{ currentEntityLabel }}</span>
                  </span>
                  <span class="text-lg text-zinc-300">{{ Math.round(entityProgress * 100) }}%</span>
                </div>
                <Progress
                  :value="entityProgress * 100"
                  color="teal"
                  class="mt-2 h-6 bg-zinc-800/90 rounded-xl shadow-inner"
                />
              </div>
              <div class="mb-8">
                <table
                  class="w-full text-lg border rounded-xl overflow-hidden bg-zinc-900/90 shadow-xl"
                >
                  <thead class="bg-zinc-950/90">
                    <tr>
                      <th class="px-5 py-4 text-left text-zinc-200">Entity</th>
                      <th class="px-5 py-4 text-left text-zinc-200">Last Sync</th>
                      <th class="px-5 py-4 text-left text-zinc-200">Status</th>
                      <th class="px-5 py-4 text-right text-zinc-200">Records Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="entity in entities"
                      :key="entity"
                      :class="'border-b border-zinc-800 last:border-b-0'"
                    >
                      <td class="px-5 py-4 text-zinc-100">{{ formatEntityName(entity) }}</td>
                      <td class="px-5 py-4 text-zinc-100">
                        <template v-if="entityStats[entity]?.lastSync === '-'">
                          <svg
                            class="animate-spin w-5 h-5 inline text-indigo-300"
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
                      <td class="px-5 py-4">
                        <span :class="statusClass(entityStats[entity]?.status) + ' text-lg'">{{
                          entityStats[entity]?.status
                        }}</span>
                      </td>
                      <td class="px-5 py-4 text-right text-zinc-100">
                        {{ entityStats[entity]?.recordsUpdated ?? 0 }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="error" class="text-red-500 font-semibold mb-6 text-lg">{{ error }}</div>
            </div>
          </div>
        </section>
        <!-- Right Column: Log (unchanged) -->
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

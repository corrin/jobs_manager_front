<template>
  <AppLayout>
    <div class="kpi-layout">
      <!-- Sidebar -->
      <nav class="sidebar">
        <div class="user-card">
          <div class="avatar">
            <BarChart3 class="w-10 h-10 text-white" />
          </div>
          <div class="user-name">KPI Reports</div>
          <div class="user-date">{{ today }}</div>
        </div>
        <ul class="tab-list">
          <li v-for="tab in tabs" :key="tab.name">
            <button
              @click="activeTab = tab.key"
              class="tab-link"
              :class="activeTab === tab.key ? 'tab-link--active' : ''"
            >
              <span v-if="tab.icon" class="tab-icon">
                <component :is="tab.icon" />
              </span>
              {{ tab.label }}
            </button>
          </li>
        </ul>
        <div class="sidebar-footer text-white bold">Business Intelligence</div>
      </nav>

      <!-- Main Content -->
      <main class="kpi-main">
        <div class="w-full h-full flex flex-col overflow-hidden">
          <!-- Header Navigation -->
          <div
            class="hidden lg:flex items-center h-16 px-6 pt-4 bg-slate-900/80 border-b border-blue-500/10"
          >
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <BarChart3 class="h-8 w-8 text-blue-400" />
                <h1 class="text-white font-semibold text-lg">KPI Reports</h1>
              </div>
            </div>

            <div class="flex items-center space-x-2 mx-6">
              <Button
                variant="ghost"
                size="sm"
                @click="navigateDate(-1)"
                class="text-white hover:bg-blue-500/20"
              >
                <ChevronLeft class="h-4 w-4" />
              </Button>

              <div
                class="text-white font-semibold px-4 py-2 bg-slate-800/50 rounded-md border border-blue-500/30"
              >
                {{ formatDisplayDate(currentDate) }}
              </div>

              <Button
                variant="ghost"
                size="sm"
                @click="navigateDate(1)"
                class="text-white hover:bg-blue-500/20"
              >
                <ChevronRight class="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                @click="goToToday"
                class="text-white hover:bg-blue-500/20 ml-2"
              >
                Today
              </Button>
            </div>

            <div class="flex items-center space-x-2 ml-auto">
              <div class="text-xs text-blue-200 mr-4">
                <span class="font-semibold">{{ activeTab }}</span> View
              </div>

              <Button
                @click="exportData"
                size="sm"
                variant="default"
                class="bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
              >
                <Download class="h-4 w-4 mr-1" />
                Export
              </Button>

              <Button
                @click="refreshData"
                variant="ghost"
                size="sm"
                :disabled="loading"
                class="text-white hover:bg-blue-500/20"
              >
                <RefreshCw :class="['h-4 w-4', { 'animate-spin': loading }]" />
              </Button>

              <Button
                @click="showSettingsModal = true"
                variant="ghost"
                size="sm"
                class="text-white hover:bg-blue-500/20"
              >
                <Settings class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <!-- Mobile Header -->
          <div class="block lg:hidden pt-4">
            <div
              class="flex items-center justify-between p-3 border-b border-blue-500/10 bg-slate-900/80"
            >
              <div class="flex items-center space-x-2">
                <BarChart3 class="h-6 w-6 text-blue-400" />
                <h1 class="text-white font-semibold">KPI Reports</h1>
              </div>
              <div class="text-xs text-blue-200">
                <span class="font-semibold">{{ activeTab }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between p-3 bg-slate-900/80">
              <div class="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  @click="navigateDate(-1)"
                  class="h-7 w-7 p-0 text-white hover:bg-blue-500/20"
                >
                  <ChevronLeft class="h-3 w-3" />
                </Button>

                <div
                  class="text-white font-medium text-xs px-2 py-1 bg-slate-800/50 rounded border border-blue-500/30"
                >
                  {{ formatShortDate(currentDate) }}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  @click="navigateDate(1)"
                  class="h-7 w-7 p-0 text-white hover:bg-blue-500/20"
                >
                  <ChevronRight class="h-3 w-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  @click="goToToday"
                  class="h-7 text-xs px-2 text-white hover:bg-blue-500/20"
                >
                  Today
                </Button>
              </div>

              <div class="flex items-center space-x-1">
                <Button
                  @click="exportData"
                  size="sm"
                  variant="default"
                  class="h-7 text-xs px-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
                >
                  <Download class="h-3 w-3" />
                </Button>

                <Button
                  @click="refreshData"
                  variant="ghost"
                  size="sm"
                  :disabled="loading"
                  class="h-7 w-7 p-0 text-white hover:bg-blue-500/20"
                >
                  <RefreshCw :class="['h-3 w-3', { 'animate-spin': loading }]" />
                </Button>

                <Button
                  @click="showSettingsModal = true"
                  variant="ghost"
                  size="sm"
                  class="h-7 w-7 p-0 text-white hover:bg-blue-500/20"
                >
                  <Settings class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-0">
            <div class="max-w-6xl mx-auto py-8 px-2 md:px-8 h-full flex flex-col gap-8">
              <!-- Overview Section -->
              <div v-if="activeTab === 'overview'" class="space-y-6">
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h1 class="text-2xl font-bold text-gray-900 mb-2">Performance Overview</h1>
                  <p class="text-gray-600">
                    Key Performance Indicators and business metrics dashboard
                  </p>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div class="text-center py-12">
                    <BarChart3 class="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 class="text-lg font-medium text-gray-900 mb-2">
                      KPI Dashboard Coming Soon
                    </h3>
                    <p class="text-gray-500 max-w-md mx-auto">
                      This section will display comprehensive KPI metrics including revenue, profit
                      margins, billable hours, and other key business indicators.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Financial Section -->
              <div v-if="activeTab === 'financial'" class="space-y-6">
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h1 class="text-2xl font-bold text-gray-900 mb-2">Financial Reports</h1>
                  <p class="text-gray-600">
                    Revenue, profit margins, and financial performance metrics
                  </p>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div class="text-center py-12">
                    <DollarSign class="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Financial Analytics</h3>
                    <p class="text-gray-500 max-w-md mx-auto">
                      Financial KPIs including revenue trends, profit margins, and cost analysis.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Time Tracking Section -->
              <div v-if="activeTab === 'time'" class="space-y-6">
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h1 class="text-2xl font-bold text-gray-900 mb-2">Time Tracking Reports</h1>
                  <p class="text-gray-600">
                    Billable hours, productivity metrics, and time allocation analysis
                  </p>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div class="text-center py-12">
                    <Clock class="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Time Analytics</h3>
                    <p class="text-gray-500 max-w-md mx-auto">
                      Track billable vs non-billable hours, staff productivity, and time
                      utilization.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Projects Section -->
              <div v-if="activeTab === 'projects'" class="space-y-6">
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h1 class="text-2xl font-bold text-gray-900 mb-2">Project Reports</h1>
                  <p class="text-gray-600">
                    Job completion rates, project profitability, and workflow metrics
                  </p>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div class="text-center py-12">
                    <Briefcase class="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Project Analytics</h3>
                    <p class="text-gray-500 max-w-md mx-auto">
                      Monitor project completion rates, profitability per job, and workflow
                      efficiency.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import Button from '@/components/ui/button/Button.vue'
import {
  BarChart3,
  DollarSign,
  Clock,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Settings,
} from 'lucide-vue-next'

const activeTab = ref('overview')
const currentDate = ref(new Date())
const loading = ref(false)
const showSettingsModal = ref(false)

const today = new Date().toLocaleDateString('en-NZ', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const tabs = computed(() => [
  {
    name: 'Overview',
    key: 'overview',
    label: 'Overview',
    icon: BarChart3,
  },
  {
    name: 'Financial',
    key: 'financial',
    label: 'Financial',
    icon: DollarSign,
  },
  {
    name: 'Time',
    key: 'time',
    label: 'Time Tracking',
    icon: Clock,
  },
  {
    name: 'Projects',
    key: 'projects',
    label: 'Projects',
    icon: Briefcase,
  },
])

// Date navigation functions
function navigateDate(direction: number) {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + direction)
  currentDate.value = newDate
}

function goToToday() {
  currentDate.value = new Date()
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString('en-NZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-NZ', {
    month: 'short',
    day: 'numeric',
  })
}

// Action functions
function exportData() {
  // TODO: Implement export functionality
  console.log('Exporting KPI data for', activeTab.value)
}

function refreshData() {
  loading.value = true
  // TODO: Implement data refresh
  setTimeout(() => {
    loading.value = false
  }, 1000)
}

// TODO: Implement KPI data fetching using existing KPIService
// TODO: Add KPI charts and visualizations
// TODO: Add date range selector for historical data
// TODO: Add export functionality
</script>

<style scoped>
.kpi-layout {
  display: flex;
  max-height: 100vh;
  height: auto;
  background: #f4f4f5;
  overflow: hidden;
}

.sidebar {
  width: 18rem;
  min-width: 15rem;
  background: linear-gradient(to bottom, #e0e7ff, #c7d2fe 60%, #a5b4fc 100%);
  color: #3730a3;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  gap: 2rem;
  box-shadow: 0 8px 32px 0 rgba(49, 46, 129, 0.12);
  border-top-right-radius: 1.5rem;
  border-bottom-right-radius: 1.5rem;
  align-self: stretch;
  height: 100vh;
  margin-top: 8vh;
}

.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  background: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px 0 rgba(99, 102, 241, 0.18);
  margin-bottom: 0.5rem;
  animation: bounce 1.2s infinite alternate;
}

@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-8px);
  }
}

.user-name {
  font-size: 1.125rem;
  font-weight: bold;
  margin-top: 0.25rem;
  color: #3730a3;
}

.user-date {
  font-size: 0.95rem;
  color: #6366f1;
}

.tab-list {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  color: #3730a3;
  background: transparent;
  transition: all 0.15s;
  box-shadow: none;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.tab-link--active {
  background: #6366f1;
  color: #fff;
  box-shadow: 0 2px 8px 0 rgba(99, 102, 241, 0.12);
  transform: scale(1.04);
}

.tab-link:not(.tab-link--active):hover {
  background: #a5b4fc;
  color: #3730a3;
}

.tab-icon {
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-footer {
  margin-top: auto;
  font-size: 1.1rem;
  text-align: center;
  opacity: 1;
  padding-bottom: 0.5rem;
  margin-bottom: 4rem;
  font-weight: bold;
  color: #3730a3;
  text-decoration: underline overline;
  text-underline-offset: 6px;
  text-decoration-thickness: 3px;
  letter-spacing: 1px;
}

.kpi-main {
  flex: 1 1 0;
  min-height: 0;
  height: auto;
  overflow-y: auto;
  background: #f4f4f5;
  padding: 0;
  min-width: 0;
}
</style>

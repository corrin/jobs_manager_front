<template>
  <AppLayout>
    <!-- Modern Header with Navigation -->
    <div
      class="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 backdrop-blur-md border-b border-blue-500/20">
      <div class="px-6 py-1">
        <!-- Title and Date Navigation -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-bold text-white">Daily Timesheet Overview</h1>
            <div class="flex items-center space-x-2 text-white/80">
              <Calendar class="h-5 w-5" />
              <span class="text-sm">{{ formatDisplayDate(selectedDate) }}</span>
            </div>
          </div>
          <!-- Actions -->
          <div class="flex items-center space-x-3">
            <!-- Metrics Toggle Button -->
            <Button @click="showMetrics = !showMetrics" variant="ghost" size="sm"
              class="text-white hover:bg-blue-500/20" :class="{ 'bg-blue-500/20': showMetrics }">
              <BarChart3 class="h-4 w-4 mr-2" />
              Metrics
            </Button>

            <Button @click="refreshData" variant="ghost" size="sm" class="text-white hover:bg-blue-500/20"
              :disabled="loading">
              <RefreshCw class="h-4 w-4 mr-2" :class="{ 'animate-spin': loading }" />
              Refresh
            </Button>
            <Button @click="goToToday" variant="default" size="sm"
              class="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 font-medium">
              <Home class="h-4 w-4 mr-2" />
              Today
            </Button>
          </div>
        </div>

        <!-- Date Navigation -->
        <div class="flex items-center justify-center space-x-4">
          <Button @click="navigateDate(-1)" variant="ghost" size="sm" class="text-white hover:bg-blue-500/20">
            <ChevronLeft class="h-5 w-5" />
            Previous Day
          </Button>

          <div class="flex items-center space-x-2">
            <input type="date" v-model="selectedDate" @change="loadData"
              class="px-3 py-2 bg-slate-800/50 border border-blue-500/30 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <Button @click="navigateDate(1)" variant="ghost" size="sm" class="text-white hover:bg-blue-500/20">
            Next Day
            <ChevronRight class="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 px-6 py-1 space-y-6">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading timesheet data...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-center space-x-3">
          <AlertCircle class="h-6 w-6 text-red-600" />
          <div>
            <h3 class="text-lg font-semibold text-red-900">Error Loading Data</h3>
            <p class="text-red-700">{{ error }}</p>
            <Button @click="refreshData" class="mt-3" variant="outline">
              <RefreshCw class="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div> <!-- Data Content -->
      <div v-else-if="summary" class="space-y-4">
        <!-- Summary Cards - Conditional -->
        <div v-if="showMetrics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard title="Total Hours" :value="formatHours(summary.daily_totals.total_actual_hours)"
            :subtitle="`${formatHours(summary.daily_totals.total_scheduled_hours)} scheduled`"
            :progress="summary.daily_totals.completion_percentage" icon="Clock" color="blue" />

          <SummaryCard title="Billable Hours" :value="formatHours(summary.daily_totals.total_billable_hours)"
            :subtitle="`${formatPercentage(summary.daily_totals.billable_percentage)} of total`"
            :progress="summary.daily_totals.billable_percentage" icon="TrendingUp" color="green" />

          <SummaryCard title="Revenue" :value="formatCurrency(summary.daily_totals.total_revenue)"
            :subtitle="`${summary.daily_totals.total_entries} entries`" icon="DollarSign" color="emerald" />

          <SummaryCard title="Staff Completion"
            :value="`${summary.summary_stats.complete_staff}/${summary.summary_stats.total_staff}`"
            :subtitle="`${formatPercentage(summary.summary_stats.completion_rate)} complete`"
            :progress="summary.summary_stats.completion_rate" icon="Users" color="purple" />
        </div>
        <!-- Staff Overview Table - Compact and Scrollable -->
        <div
          class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-10rem)]">

          <div class="flex-1 overflow-y-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <StaffRow v-for="staff in summary.staff_data" :key="staff.staff_id" :staff="staff" :date="selectedDate"
                  @view-details="openStaffModal" />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Staff Detail Modal -->
    <StaffDetailModal v-if="selectedStaff" :staff="selectedStaff" :date="selectedDate" :open="showStaffModal"
      @close="closeStaffModal" />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Home,
  AlertCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3
} from 'lucide-vue-next'

// Components
import SummaryCard from './components/SummaryCard.vue'
import StaffRow from './components/StaffRow.vue'
import StaffDetailModal from './components/StaffDetailModal.vue'

// Services and Types
import {
  getDailyTimesheetSummary,
  formatHours,
  formatCurrency,
  type DailyTimesheetSummary,
  type StaffDailyData
} from '@/services/daily-timesheet.service'

// State
const router = useRouter()
const loading = ref(false)
const error = ref<string | null>(null)
const summary = ref<DailyTimesheetSummary | null>(null)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const selectedStaff = ref<StaffDailyData | null>(null)
const showStaffModal = ref(false)
const showMetrics = ref(false)

// Computed
const formatDisplayDate = (date: string): string => {
  // Parse the date string as local date to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number)
  const localDate = new Date(year, month - 1, day) // month is 0-indexed

  return localDate.toLocaleDateString('en-NZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

// Methods
const loadData = async (): Promise<void> => {
  if (!selectedDate.value) return

  try {
    loading.value = true
    error.value = null

    console.log('Loading daily timesheet data for:', selectedDate.value)

    summary.value = await getDailyTimesheetSummary(selectedDate.value)

    console.log('Loaded summary:', summary.value)

  } catch (err) {
    console.error('Error loading timesheet data:', err)
    error.value = 'Failed to load timesheet data. Please try again.'
  } finally {
    loading.value = false
  }
}

const refreshData = (): void => {
  loadData()
}

const navigateDate = (days: number): void => {
  const currentDate = new Date(selectedDate.value)
  currentDate.setDate(currentDate.getDate() + days)
  selectedDate.value = currentDate.toISOString().split('T')[0]
  loadData()
}

const goToToday = (): void => {
  selectedDate.value = new Date().toISOString().split('T')[0]
  loadData()
}

const openStaffModal = (staff: StaffDailyData): void => {
  selectedStaff.value = staff
  showStaffModal.value = true
}

const closeStaffModal = (): void => {
  selectedStaff.value = null
  showStaffModal.value = false
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

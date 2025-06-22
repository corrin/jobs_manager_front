<template>
  <AppLayout>
    <div class="flex flex-col min-h-screen">
      <!-- Modern Header with Navigation - Mobile First -->
      <div
        class="sticky top-0 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 backdrop-blur-md border-b border-purple-500/20 p-1"
      >
        <div class="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div class="space-y-3 lg:space-y-0 py-0.5">
            <!-- Title Row -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-center sm:text-left"
              >
                <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  Weekly Timesheet Overview
                </h1>
                <div
                  class="flex items-center justify-center sm:justify-start space-x-2 text-white/80 mt-1 sm:mt-0"
                >
                  <Calendar class="h-4 w-4 sm:h-5 sm:w-5" />
                  <span class="text-xs sm:text-sm">{{ formatDisplayDateRange() }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div
                class="flex items-center justify-center sm:justify-end space-x-2 sm:space-x-3 mt-2 sm:mt-0"
              >
                <!-- IMS Toggle -->
                <div class="flex items-center space-x-2">
                  <Switch
                    v-model:checked="imsMode"
                    @update:checked="toggleIMSMode"
                    class="group inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition data-[checked]:bg-blue-600"
                  >
                    <span
                      class="size-4 translate-x-1 rounded-full bg-white transition group-data-[checked]:translate-x-6"
                    ></span>
                  </Switch>
                  <Label class="text-white text-xs sm:text-sm font-medium">IMS Export</Label>
                </div>

                <!-- Job Metrics Button -->
                <Button
                  @click="openJobMetricsModal"
                  variant="ghost"
                  size="sm"
                  class="text-white hover:bg-purple-500/20 text-xs sm:text-sm"
                >
                  <BarChart3 class="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span class="hidden sm:inline">Job Metrics</span>
                </Button>

                <Button
                  @click="refreshData"
                  variant="ghost"
                  size="sm"
                  class="text-white hover:bg-purple-500/20 text-xs sm:text-sm"
                  :disabled="loading"
                >
                  <RefreshCw
                    class="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2"
                    :class="{ 'animate-spin': loading }"
                  />
                  <span class="hidden sm:inline">Refresh</span>
                </Button>

                <Button
                  @click="goToCurrentWeek"
                  variant="default"
                  size="sm"
                  class="bg-purple-600 hover:bg-purple-700 text-white border-purple-500 font-medium text-xs sm:text-sm"
                >
                  <Home class="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span class="hidden sm:inline">This Week</span>
                </Button>
              </div>
            </div>

            <!-- Week Navigation -->
            <div class="flex items-center justify-center space-x-2 sm:space-x-4">
              <Button
                @click="navigateWeek(-1)"
                variant="ghost"
                size="sm"
                class="text-white hover:bg-purple-500/20 px-2 sm:px-4"
              >
                <ChevronLeft class="h-4 w-4 sm:h-5 sm:w-5" />
                <span class="hidden sm:inline ml-1">Previous</span>
              </Button>

              <Button
                @click="openWeekPicker"
                variant="ghost"
                size="sm"
                class="text-white hover:bg-purple-500/20 px-3 sm:px-4"
              >
                <CalendarDays class="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span class="text-xs sm:text-sm">Change Week</span>
              </Button>

              <Button
                @click="navigateWeek(1)"
                variant="ghost"
                size="sm"
                class="text-white hover:bg-purple-500/20 px-2 sm:px-4"
              >
                <span class="hidden sm:inline mr-1">Next</span>
                <ChevronRight class="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 p-2 sm:p-4 lg:p-1 space-y-3 sm:space-y-4 lg:space-y-6">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-8 sm:py-12">
          <div class="text-center">
            <div
              class="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-purple-600 mx-auto mb-4"
            ></div>
            <p class="text-gray-600 text-sm sm:text-base">Loading weekly timesheet data...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
          <div class="flex items-start space-x-3">
            <AlertCircle class="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="text-base sm:text-lg font-semibold text-red-900">Error Loading Data</h3>
              <p class="text-red-700 text-sm sm:text-base mt-1">{{ error }}</p>
              <Button @click="refreshData" class="mt-3" variant="outline" size="sm">
                <RefreshCw class="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>

        <!-- Data Content -->
        <div v-else-if="weeklyData" class="space-y-4">
          <!-- Staff Overview Table - Compact and Scrollable -->
          <div
            class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-18rem)] lg:h-[calc(100vh-10rem)]"
          >
            <div class="flex-1 overflow-y-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th
                      class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Staff Member
                    </th>
                    <th
                      v-for="day in displayDays"
                      :key="day.date"
                      class="px-1 py-1 text-center text-xs font-medium text-blue-700 uppercase tracking-wider"
                    >
                      <button
                        @click="goToDailyViewHeader(day.date)"
                        class="transition text-blue-700 hover:text-white hover:bg-blue-600 px-1 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
                        style="min-width: 36px"
                      >
                        <div class="flex flex-col items-center">
                          <span>{{ day.name }}</span>
                          <span class="text-xs text-gray-400 normal-case">{{ day.short }}</span>
                        </div>
                      </button>
                    </th>
                    <th
                      class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total
                    </th>
                    <th
                      class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Billable %
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <StaffWeekRow
                    v-for="staff in weeklyData.staff_data"
                    :key="staff.staff_id"
                    :staff="staff"
                    :ims-mode="imsMode"
                    :week-days="displayDays"
                    class="hover:bg-gray-50 transition-colors duration-150"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Job Metrics Modal -->
      <JobMetricsModal
        v-if="weeklyData?.job_metrics"
        :metrics="weeklyData.job_metrics"
        :total-hours="weeklyData.weekly_summary.total_hours"
        :billable-percentage="weeklyData.weekly_summary.billable_percentage"
        :staff-count="weeklyData.staff_data.length"
        :completed-staff="completedStaff"
        :open="showJobMetricsModal"
        @close="closeJobMetricsModal"
      />

      <!-- Week Picker Modal -->
      <WeekPickerModal
        :is-open="showWeekPicker"
        :initial-week-start="selectedWeekStart.toISOString().split('T')[0]"
        @close="closeWeekPicker"
        @week-selected="handleWeekSelect"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Home,
  AlertCircle,
  BarChart3,
} from 'lucide-vue-next'

// Components
import StaffWeekRow from '@/components/timesheet/StaffWeekRow.vue'
import JobMetricsModal from '@/components/timesheet/JobMetricsModal.vue'
import WeekPickerModal from '@/components/timesheet/WeekPickerModal.vue'

// Services and Types
import {
  getWeeklyTimesheetOverview,
  type WeeklyTimesheetData,
  type IMSWeeklyData,
} from '@/services/weekly-timesheet.service'
import {
  dateService,
  createLocalDate,
  formatToLocalString,
  getCurrentWeekStart,
  navigateWeek as navigateWeekDate,
} from '@/services/date.service'
import { useRouter, useRoute } from 'vue-router'

// State
const loading = ref(false)
const error = ref<string | null>(null)
const weeklyData = ref<WeeklyTimesheetData | IMSWeeklyData | null>(null)

// Initialize from URL params or use current week as default
const router = useRouter()
const route = useRoute()

// Parse week start from URL params or default to current week
const initialWeekStart = route.query.week ? createLocalDate(route.query.week as string) : new Date()
const selectedWeekStart = ref(initialWeekStart)

const imsMode = ref(false)

// Modal states
const showJobMetricsModal = ref(false)
const showWeekPicker = ref(false)

console.log('🔗 WeeklyTimesheetView URL params:', { week: route.query.week })
console.log('📊 Using initial week start:', formatToLocalString(selectedWeekStart.value))

// Computed
const displayDays = computed(() => {
  if (!weeklyData.value) return []

  // IMS mode usa ims_week, normal usa week_days
  const days = imsMode.value
    ? (weeklyData.value as IMSWeeklyData).ims_week || []
    : (weeklyData.value as WeeklyTimesheetData).week_days || []

  // Para modo normal, garantir Monday-Friday usando dateService
  if (!imsMode.value) {
    console.log('displayDays raw:', days)
    return days
      .map((dateStr) => {
        return {
          date: dateStr,
          name: dateService.getDayName(dateStr, true),
          short: dateService.getDayNumber(dateStr),
          dayOfWeek: createLocalDate(dateStr).getDay(),
        }
      })
      .filter((day) => day.dayOfWeek >= 1 && day.dayOfWeek <= 5) // Monday-Friday only
  } else {
    // IMS: mostrar todos os dias retornados
    return days.map((dateStr) => {
      return {
        date: dateStr,
        name: dateService.getDayName(dateStr, true),
        short: dateService.getDayNumber(dateStr),
      }
    })
  }
})

const completedStaff = computed(() => {
  if (!weeklyData.value) return 0
  return weeklyData.value.staff_data.filter(
    (staff) => staff.total_hours >= 35, // Assuming 35+ hours is "complete"
  ).length
})

const formatDisplayDateRange = (): string => {
  if (!weeklyData.value) return ''
  return dateService.formatDateRange(weeklyData.value.start_date, weeklyData.value.end_date)
}

// Methods
const loadData = async (): Promise<void> => {
  try {
    loading.value = true
    error.value = null

    const weekRange = dateService.getWeekRange(selectedWeekStart.value)
    console.log(
      'Loading weekly timesheet data for:',
      weekRange.startDate,
      'IMS Mode:',
      imsMode.value,
    )

    weeklyData.value = await getWeeklyTimesheetOverview(weekRange.startDate, imsMode.value)

    console.log('Loaded weekly data:', weeklyData.value)
  } catch (err) {
    console.error('Error loading weekly timesheet data:', err)
    error.value = 'Failed to load weekly timesheet data. Please try again.'
  } finally {
    loading.value = false
  }
}

const refreshData = (): void => {
  loadData()
}

const navigateWeek = (direction: number): void => {
  const newWeekStart = navigateWeekDate(formatToLocalString(selectedWeekStart.value), direction)
  selectedWeekStart.value = createLocalDate(newWeekStart)
  updateRoute()
  loadData()
}

const goToCurrentWeek = (): void => {
  const currentWeekStart = getCurrentWeekStart()
  selectedWeekStart.value = createLocalDate(currentWeekStart)
  updateRoute()
  loadData()
}

// Route management
const updateRoute = () => {
  router.push({
    query: {
      week: formatToLocalString(selectedWeekStart.value),
    },
  })
}

const toggleIMSMode = async (checked: boolean): Promise<void> => {
  imsMode.value = checked
  await loadData()
}

// Navegação para o cabeçalho do dia
const goToDailyViewHeader = (date: string) => {
  console.log('🔗 Navigating to daily view for date:', date)
  router.push({ name: 'timesheet-daily', query: { date } })
}

// Modal handlers
const openJobMetricsModal = (): void => {
  showJobMetricsModal.value = true
}

const closeJobMetricsModal = (): void => {
  showJobMetricsModal.value = false
}

// Week Picker Modal
const openWeekPicker = (): void => {
  showWeekPicker.value = true
}

const closeWeekPicker = (): void => {
  showWeekPicker.value = false
}

const handleWeekSelect = (date: string): void => {
  selectedWeekStart.value = createLocalDate(date)
  updateRoute()
  loadData()
  closeWeekPicker()
}

// Lifecycle Hooks
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* Custom animations and transitions */
.group:hover .transform {
  transform: scale(1.05);
}

/* Table enhancements */
tbody tr:hover {
  background-color: rgba(249, 250, 251, 0.5);
  transition: background-color 0.15s ease-in-out;
}

/* Loading animation enhancement */
@keyframes pulse-glow {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.7);
  }
  50% {
    opacity: 0.5;
    box-shadow: 0 0 0 10px rgba(147, 51, 234, 0);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s infinite;
}
</style>

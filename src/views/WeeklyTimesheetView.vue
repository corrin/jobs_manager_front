<template>
  <AppLayout>
    <div class="flex flex-col min-h-screen">
      <div class="sticky top-0 bg-white backdrop-blur-md border-b border-gray-200 p-1">
        <div class="px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2">
          <div class="space-y-1 lg:space-y-0 pt-1 lg:pt-2">
            <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between">
              <div
                class="flex flex-col sm:flex-row sm:items-end sm:space-x-3 lg:space-x-4 text-center sm:text-left"
              >
                <h1 class="text-base sm:text-lg lg:text-2xl xl:text-3xl font-bold text-gray-900">
                  Weekly Timesheet Overview
                </h1>
                <div
                  class="flex items-center justify-center sm:justify-start space-x-1 lg:space-x-2 text-gray-600 mt-1 sm:mt-0"
                >
                  <Calendar class="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                  <span class="text-xs sm:text-sm lg:text-base">{{
                    formatDisplayDateRange()
                  }}</span>
                </div>
              </div>

              <div
                class="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2 lg:space-x-3 mt-1 sm:mt-0 lg:mt-2"
              >
                <div v-if="weekendEnabled" class="flex items-center space-x-1 lg:space-x-2">
                  <button
                    @click="toggleIMSMode(!imsMode)"
                    :class="[
                      'relative inline-flex h-4 w-8 sm:h-5 sm:w-9 lg:h-6 lg:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
                      imsMode ? 'bg-blue-600' : 'bg-gray-200',
                    ]"
                  >
                    <span
                      :class="[
                        'inline-block h-2 w-2 sm:h-3 sm:w-3 lg:h-4 lg:w-4 transform rounded-full bg-white transition-transform',
                        imsMode
                          ? 'translate-x-4 sm:translate-x-5 lg:translate-x-6'
                          : 'translate-x-0.5',
                      ]"
                    ></span>
                  </button>
                  <Label class="text-gray-700 text-xs sm:text-sm lg:text-base font-medium">
                    {{ imsMode ? 'IMS Mode (Mon-Fri)' : 'Standard Mode (Mon-Sun)' }}
                  </Label>
                </div>
                <div v-else class="text-xs text-gray-500">Weekend timesheets disabled</div>

                <Button
                  @click="openWeeklyMetricsModal"
                  variant="ghost"
                  size="sm"
                  class="text-gray-600 hover:bg-gray-100 text-xs sm:text-sm lg:text-base h-8 lg:h-10 px-2 lg:px-3"
                >
                  <BarChart3 class="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 sm:mr-2 lg:mr-2" />
                  <span class="hidden sm:inline">Job Metrics</span>
                </Button>

                <Button
                  @click="refreshData"
                  variant="ghost"
                  size="sm"
                  class="text-gray-600 hover:bg-gray-100 text-xs sm:text-sm lg:text-base h-8 lg:h-10 px-2 lg:px-3"
                  :disabled="loading"
                >
                  <RefreshCw
                    class="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 sm:mr-2 lg:mr-2"
                    :class="{ 'animate-spin': loading }"
                  />
                  <span class="hidden sm:inline">Refresh</span>
                </Button>

                <Button
                  @click="goToCurrentWeek"
                  variant="default"
                  size="sm"
                  class="bg-gray-600 hover:bg-gray-700 text-white border-gray-500 font-medium text-xs sm:text-sm lg:text-base h-8 lg:h-10 px-2 lg:px-4"
                >
                  <Home class="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 sm:mr-2 lg:mr-2" />
                  <span class="hidden sm:inline">This Week</span>
                </Button>
              </div>
            </div>

            <div class="flex items-center justify-center space-x-1 sm:space-x-2 lg:space-x-4">
              <Button
                @click="navigateWeek(-1)"
                variant="ghost"
                size="sm"
                class="text-gray-600 hover:bg-gray-100 px-1.5 sm:px-2 lg:px-3 h-8 lg:h-10"
              >
                <ChevronLeft class="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <span class="hidden sm:inline ml-1 text-xs sm:text-sm lg:text-base">Previous</span>
              </Button>

              <Button
                @click="openWeekPicker"
                variant="ghost"
                size="sm"
                class="text-gray-600 hover:bg-gray-100 px-2 sm:px-3 lg:px-4 h-8 lg:h-10"
              >
                <CalendarDays class="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2" />
                <span class="text-xs sm:text-sm lg:text-base">Change Week</span>
              </Button>

              <Button
                @click="navigateWeek(1)"
                variant="ghost"
                size="sm"
                class="text-gray-600 hover:bg-gray-100 px-1.5 sm:px-2 lg:px-3 h-8 lg:h-10"
              >
                <span class="hidden sm:inline mr-1 text-xs sm:text-sm lg:text-base">Next</span>
                <ChevronRight class="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 p-1 sm:p-2 lg:p-3 space-y-2 sm:space-y-3 lg:space-y-4">
        <!-- Loading Spinner -->
        <div v-if="loading" class="flex-1 flex items-center justify-center bg-gray-50">
          <div class="text-center space-y-3 lg:space-y-4 p-6 lg:p-8">
            <div
              class="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 mx-auto rounded-full border-4 border-gray-300 border-t-gray-600 animate-spin"
            ></div>
            <p class="text-gray-600 text-base sm:text-lg lg:text-xl font-medium">
              Loading weekly timesheet data...
            </p>
          </div>
        </div>
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 lg:p-6">
          <div class="flex items-start space-x-2 lg:space-x-3">
            <AlertCircle
              class="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-red-600 flex-shrink-0 mt-0.5"
            />
            <div class="flex-1">
              <h3 class="text-sm sm:text-base lg:text-lg font-semibold text-red-900">
                Error Loading Data
              </h3>
              <p class="text-red-700 text-xs sm:text-sm lg:text-base mt-1">{{ error }}</p>
              <Button @click="refreshData" class="mt-2 lg:mt-3" variant="outline" size="sm">
                <RefreshCw class="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>

        <div v-else-if="weeklyData" class="space-y-2 lg:space-y-3">
          <div
            class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-14rem)] lg:h-[calc(100vh-8rem)] xl:h-[calc(100vh-6rem)]"
          >
            <div class="flex-1 overflow-y-auto">
              <table class="min-w-full divide-y divide-gray-200 table-fixed">
                <thead class="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th
                      class="w-48 px-1.5 py-1.5 lg:py-2 text-left text-xs sm:text-sm lg:text-base font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Staff Member
                    </th>
                    <th
                      v-for="day in displayDays"
                      :key="day.date"
                      :class="[
                        'w-20 px-1 py-1.5 lg:py-2 text-center text-xs sm:text-sm lg:text-base font-medium uppercase tracking-wider',
                        day.isWeekend ? 'bg-blue-50 text-blue-700' : 'text-gray-700',
                      ]"
                    >
                      <button
                        @click="goToDailyViewHeader(day.date)"
                        :class="[
                          'transition px-1 py-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 text-xs w-full',
                          day.isWeekend
                            ? 'text-blue-700 hover:text-white hover:bg-blue-600'
                            : 'text-gray-700 hover:text-white hover:bg-gray-600',
                        ]"
                      >
                        <div class="flex flex-col items-center">
                          <span class="font-semibold">{{ day.name }}</span>
                          <span
                            class="text-xs normal-case"
                            :class="day.isWeekend ? 'text-blue-500' : 'text-gray-400'"
                          >
                            {{ day.short }}
                          </span>
                        </div>
                      </button>
                    </th>
                    <th
                      class="w-24 px-1.5 py-1.5 lg:py-2 text-center text-xs sm:text-sm lg:text-base font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {{ imsMode ? 'Weekly Total' : 'Total' }}
                    </th>
                    <th
                      class="w-28 px-1.5 py-1.5 lg:py-2 text-center text-xs sm:text-sm lg:text-base font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {{ imsMode ? 'Billable Hours' : 'Billable %' }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-100">
                  <StaffWeekRow
                    v-for="staff in sortedStaffData"
                    :key="staff.staff_id"
                    :staff="staff"
                    :ims-mode="imsMode"
                    :week-days="displayDays"
                    :visible-indexes="displayDays.map((d) => d.idx)"
                    class="hover:bg-blue-50/50 transition-colors duration-150 border-b border-gray-100"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <WeeklyMetricsModal
        :is-open="showWeeklyMetricsModal"
        :weekly-data="weeklyData"
        :week-date="formatToLocalString(selectedWeekStart)"
        @close="closeWeeklyMetricsModal"
      />

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
import { useRouter, useRoute } from 'vue-router'
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

import AppLayout from '@/components/AppLayout.vue'
import Button from '@/components/ui/button/Button.vue'
import Label from '@/components/ui/label/Label.vue'
import StaffWeekRow from '@/components/timesheet/StaffWeekRow.vue'
import WeeklyMetricsModal from '@/components/timesheet/WeeklyMetricsModal.vue'
import WeekPickerModal from '@/components/timesheet/WeekPickerModal.vue'

import {
  dateService,
  createLocalDate,
  formatToLocalString,
  navigateWeek as navigateWeekDate,
} from '@/services/date.service'
import { fetchWeeklyOverview, fetchIMSOverview } from '@/services/weekly-timesheet.service'
import type { WeeklyTimesheetData, IMSWeeklyTimesheetData } from '@/api/generated/api'
import { debugLog } from '../utils/debug'
import { useTimesheetStore } from '@/stores/timesheet'

const loading = ref(false)
const error = ref<string | null>(null)
const weeklyData = ref<WeeklyTimesheetData | IMSWeeklyTimesheetData | null>(null)

const router = useRouter()
const route = useRoute()

const initialWeekStart = route.query.week ? createLocalDate(route.query.week as string) : new Date()
const selectedWeekStart = ref(initialWeekStart)

const imsMode = ref(false)
const showWeeklyMetricsModal = ref(false)
const showWeekPicker = ref(false)

// Use timesheet store for weekend functionality
const timesheetStore = useTimesheetStore()
const weekendEnabled = computed(() => {
  timesheetStore.initializeFeatureFlags()
  return import.meta.env.VITE_WEEKEND_TIMESHEETS_ENABLED === 'true'
})

const visibleDayIndexes = computed(() => {
  if (!weeklyData.value?.week_days) return []
  const raw = weeklyData.value.week_days.map((d, idx) => ({
    idx,
    dow: createLocalDate(d).getDay(),
    date: d,
  }))

  if (imsMode.value) {
    return raw
      .filter((d) => d.dow >= 1 && d.dow <= 5)
      .sort((a, b) => a.dow - b.dow)
      .map((d) => d.idx)
  }

  if (!weekendEnabled.value) {
    return raw.filter((d) => d.dow >= 1 && d.dow <= 5).map((d) => d.idx)
  }

  return raw.map((d) => d.idx)
})

// Sort staff data alphabetically by first name for consistent display
const sortedStaffData = computed(() => {
  if (!weeklyData.value?.staff_data) return []

  return [...weeklyData.value.staff_data].sort((a, b) => {
    const nameA = a.staff_name || ''
    const nameB = b.staff_name || ''
    return nameA.localeCompare(nameB)
  })
})
const displayDays = computed(() => {
  if (!weeklyData.value?.week_days || !Array.isArray(weeklyData.value.week_days)) {
    debugLog('⚠️ No valid weekly data available for displayDays computation')
    return []
  }

  return visibleDayIndexes.value.map((idx) => {
    const d = weeklyData.value!.week_days[idx]
    const date = createLocalDate(d)
    const dow = date.getDay()
    return {
      idx,
      date: d,
      name: dateService.getDayName(d, true),
      short: dateService.getDayNumber(d),
      dow,
      isWeekend: dow === 0 || dow === 6,
    }
  })
})

// Format the header's date range
function formatDisplayDateRange(): string {
  if (!weeklyData.value) return ''
  return dateService.formatDateRange(weeklyData.value.start_date, weeklyData.value.end_date)
}

// Core data loader with enhanced error handling
async function loadData(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const { startDate } = dateService.getWeekRange(selectedWeekStart.value)

    if (imsMode.value) {
      weeklyData.value = await fetchIMSOverview(startDate)
    } else {
      weeklyData.value = await fetchWeeklyOverview(startDate)
    }

    // Validate response structure
    if (!weeklyData.value?.week_days || !Array.isArray(weeklyData.value.week_days)) {
      throw new Error('Invalid response structure: missing or invalid week_days array')
    }

    // Log successful load with weekend information
    const dayCount = weeklyData.value.week_days.length
    const expectedDays = weekendEnabled.value ? 7 : 5
    debugLog(`✅ Weekly data loaded successfully: ${dayCount} days (expected: ${expectedDays})`)

    // Warn if day count doesn't match expectation
    if (dayCount !== expectedDays) {
      console.warn(
        `Day count mismatch: received ${dayCount} days, expected ${expectedDays} (weekend: ${weekendEnabled.value})`,
      )
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    error.value = `Failed to load weekly timesheet data. Please try again. ${errorMessage}`

    debugLog('❌ Error while loading weekly timesheet data:', {
      error: err,
      imsMode: imsMode.value,
      weekendEnabled: weekendEnabled.value,
      selectedWeekStart: selectedWeekStart.value,
    })

    // Provide fallback: show empty state instead of crashing
    weeklyData.value = null
  } finally {
    loading.value = false
  }
}

// Helpers
function refreshData() {
  loadData()
}
function navigateWeek(direction: number) {
  const newDate = navigateWeekDate(formatToLocalString(selectedWeekStart.value), direction)
  selectedWeekStart.value = createLocalDate(newDate)
  router.push({ query: { week: formatToLocalString(selectedWeekStart.value) } })
  loadData()
}
function goToCurrentWeek() {
  selectedWeekStart.value = createLocalDate(dateService.getCurrentWeekStart())
  router.push({ query: { week: formatToLocalString(selectedWeekStart.value) } })
  loadData()
}
async function toggleIMSMode(checked: boolean) {
  imsMode.value = checked
  await loadData()

  debugLog(`Switched to ${imsMode.value ? 'IMS' : 'Standard'} mode`)
}
function goToDailyViewHeader(date: string) {
  router.push({ name: 'timesheet-daily', query: { date } })
}
function openWeeklyMetricsModal() {
  showWeeklyMetricsModal.value = true
}
function closeWeeklyMetricsModal() {
  showWeeklyMetricsModal.value = false
}
function openWeekPicker() {
  showWeekPicker.value = true
}
function closeWeekPicker() {
  showWeekPicker.value = false
}
function handleWeekSelect(date: string) {
  selectedWeekStart.value = createLocalDate(date)
  router.push({ query: { week: formatToLocalString(selectedWeekStart.value) } })
  loadData()
  closeWeekPicker()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.group:hover .transform {
  transform: scale(1.05);
}

tbody tr:hover {
  background-color: rgba(249, 250, 251, 0.5);
  transition: background-color 0.15s ease-in-out;
}

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

.ims-data-cell {
  min-width: 120px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fafafa;
}

.ims-data-cell .border-t {
  border-top: 1px solid #d1d5db;
}

.text-amber-600 {
  color: #d97706;
}

.text-red-600 {
  color: #dc2626;
}

.text-blue-600 {
  color: #2563eb;
}

.text-green-600 {
  color: #059669;
}

.text-orange-600 {
  color: #ea580c;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

.bg-green-50 {
  background-color: #f0fdf4;
}

.bg-orange-100 {
  background-color: #fed7aa;
}

.text-orange-800 {
  color: #9a3412;
}
</style>

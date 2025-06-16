<template>
  <div class="calendar-grid-view h-full flex flex-col">
    <!-- Week header -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-3">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Calendar View
            <span v-if="props.imsExportMode" class="ml-2 text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded">
              IMS Mode
            </span>
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatWeekRange(weekStart) }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- IMS Export Toggle -->
          <div class="flex items-center gap-2">
            <Label for="ims-export" class="text-sm font-medium">IMS Export</Label>
            <Switch
              id="ims-export"
              :checked="props.imsExportMode"
              @click="() => handleImsToggle(!props.imsExportMode)"
            />
            <span class="text-xs text-gray-500">({{ props.imsExportMode ? 'ON' : 'OFF' }})</span>
          </div>

          <!-- View toggle -->
          <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Button
              v-for="view in calendarViews"
              :key="view.value"
              :variant="currentView === view.value ? 'default' : 'ghost'"
              size="sm"
              @click="currentView = view.value"
            >
              <component :is="view.icon" class="h-4 w-4 mr-1" />
              {{ view.label }}
            </Button>
          </div>

          <!-- Statistics -->
          <div class="text-right">
            <div class="text-sm text-gray-500 dark:text-gray-400">Week Total</div>
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ totalWeekHours.toFixed(1) }}h
            </div>
            <div class="text-xs text-gray-500">
              {{ activeStaffCount }} staff
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar grid or IMS Table -->
    <div class="flex-1 min-h-0">
      <!-- IMS Table View -->
      <div v-if="props.imsExportMode">
        <IMSTableView
          :staff-list="imsStaffList"
          :week-days="displayDays"
          :loading="false"
          :error="imsError"
        />
      </div>

      <!-- Normal Calendar Grid View -->
      <div v-else class="h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <!-- Day headers -->
      <div class="calendar-header border-b border-gray-200 dark:border-gray-700">
        <!-- Staff column -->
        <div class="staff-column p-2 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
          Staff Member
        </div>

        <!-- Day columns -->
        <div
          v-for="day in displayDays"
          :key="day.dateStr"
          class="day-column p-2 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0"
          :class="{
            'bg-blue-50 dark:bg-blue-900/20': isToday(day.date),
            'bg-amber-50 dark:bg-amber-900/20': props.imsExportMode && day.isNextWeek
          }"
        >
          <div class="text-sm font-medium text-gray-900 dark:text-white">
            {{ day.dayName }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ day.dayNum }}
          </div>
          <div v-if="day.isNextWeek" class="text-xs text-amber-600 dark:text-amber-400">
            (Next Week)
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {{ day.totalHours.toFixed(1) }}h
          </div>
        </div>
      </div>

      <!-- Scrollable content -->
      <div class="h-[calc(100%-50px)] overflow-y-auto">
        <!-- Row for each staff member -->
        <div
          v-for="staffData in staffEntries"
          :key="staffData.staff.id"
          class="calendar-row border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          <!-- Staff column -->
          <div class="staff-column p-2 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div class="flex items-center gap-2">
              <Avatar class="h-5 w-5">
                <AvatarImage :src="staffData.staff.avatarUrl || ''" />
                <AvatarFallback class="text-xs">
                  {{ (staffData.staff.firstName?.[0] || '') + (staffData.staff.lastName?.[0] || '') }}
                </AvatarFallback>
              </Avatar>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {{ staffData.staff.name || 'Unknown' }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ (staffData.totalHours || 0).toFixed(1) }}h
                </div>
              </div>
            </div>
          </div>

          <!-- Day columns -->
          <div
            v-for="(day, dayIndex) in displayDays"
            :key="`${staffData.staff.id}-${dayIndex}`"
            class="day-column day-cell p-1 border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-h-[60px]"
            :class="{
              'bg-blue-50/50 dark:bg-blue-900/10': isToday(day.date),
              'bg-amber-50/50 dark:bg-amber-900/10': props.imsExportMode && day.isNextWeek
            }"
            @dragover.prevent
            @dragenter.prevent
            @drop="handleDrop(staffData.staff.id, day.date, $event)"
          >
            <!-- Get day data for this specific day -->
            <template v-if="getDayData(staffData, day)">
              <!-- IMS Mode Display -->
              <div v-if="props.imsExportMode" class="min-h-[120px] text-xs">
                <div v-if="getIMSDayData(getDayData(staffData, day))" class="flex flex-col gap-1 h-full">
                  <!-- Total hours -->
                  <div class="flex justify-between font-semibold p-1 bg-gray-100 dark:bg-gray-600 rounded mb-1">
                    <span>Total</span>
                    <span>{{ formatHourValue(getDayData(staffData, day)?.hours || 0) }}</span>
                  </div>

                  <!-- Work hours breakdown -->
                  <div v-if="hasWorkHours(getDayData(staffData, day))" class="bg-green-50 dark:bg-green-900/10 rounded p-1 border-l-2 border-green-500">
                    <div class="font-semibold text-xs mb-1 text-green-800 dark:text-green-200">Work Hours</div>
                    <div v-if="getIMSDayData(getDayData(staffData, day))?.standard_hours > 0" class="flex justify-between text-xs py-0.5">
                      <span>Standard</span>
                      <span>{{ formatHourValue(getIMSDayData(getDayData(staffData, day))?.standard_hours) }}</span>
                    </div>
                    <div v-if="getIMSDayData(getDayData(staffData, day))?.time_and_half_hours > 0" class="flex justify-between text-xs py-0.5">
                      <span class="text-gray-600 dark:text-gray-300">1.5x</span>
                      <span class="font-medium">{{ formatHourValue(getIMSDayData(getDayData(staffData, day))?.time_and_half_hours) }}</span>
                    </div>
                    <div v-if="getIMSDayData(getDayData(staffData, day))?.double_time_hours > 0" class="flex justify-between text-xs py-0.5">
                      <span class="text-gray-600 dark:text-gray-300">2x</span>
                      <span class="font-medium">{{ formatHourValue(getIMSDayData(getDayData(staffData, day))?.double_time_hours) }}</span>
                    </div>
                  </div>

                  <!-- Leave hours -->
                  <div v-if="getIMSDayData(getDayData(staffData, day))?.leave_hours > 0" class="bg-yellow-50 dark:bg-yellow-900/10 rounded p-1 border-l-2 border-yellow-500">
                    <div class="font-semibold text-xs mb-1 text-yellow-800 dark:text-yellow-200">{{ getLeaveTypeLabel(getIMSDayData(getDayData(staffData, day))?.leave_type) }} Leave</div>
                    <div class="flex justify-between text-xs py-0.5">
                      <span>Hours</span>
                      <span>{{ formatHourValue(getIMSDayData(getDayData(staffData, day))?.leave_hours) }}</span>
                    </div>
                  </div>

                  <!-- Status indicators -->
                  <div class="mt-auto flex flex-wrap gap-1 items-center">
                    <div
                      v-if="getIMSStatus(getDayData(staffData, day))"
                      :class="[
                        'text-xs px-2 py-1 rounded-md font-semibold border',
                        {
                          'text-gray-600 bg-gray-100 border-gray-200': getIMSStatus(getDayData(staffData, day))?.type === 'empty',
                          'text-orange-800 bg-orange-100 border-orange-200': getIMSStatus(getDayData(staffData, day))?.type === 'partial',
                          'text-red-800 bg-red-100 border-red-200': getIMSStatus(getDayData(staffData, day))?.type === 'overtime',
                          'text-green-800 bg-green-100 border-green-200': getIMSStatus(getDayData(staffData, day))?.type === 'complete',
                          'text-blue-800 bg-blue-100 border-blue-200': getIMSStatus(getDayData(staffData, day))?.type === 'leave'
                        }
                      ]"
                    >
                      {{ getIMSStatus(getDayData(staffData, day))?.label }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Normal Calendar Mode Display -->
              <div v-else>
                <!-- Compact view -->
                <div v-if="currentView === 'compact'" class="space-y-0.5">
                  <div
                    v-for="entry in (getDayData(staffData, day)?.entries || []).slice(0, 3)"
                    :key="entry.id"
                    class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 text-xs cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    @click="handleEntryClick(entry)"
                    draggable="true"
                    @dragstart="handleDragStart(entry, $event)"
                  >
                    <div class="flex items-center gap-1">
                      <div
                        class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        :class="getJobColor(entry.jobId)"
                      ></div>
                      <span class="font-medium truncate flex-1">{{ entry.jobNumber || '' }}</span>
                      <span class="text-gray-500 text-xs">{{ (entry.hours || 0).toFixed(1) }}h</span>
                    </div>
                  </div>

                  <div v-if="(getDayData(staffData, day)?.entries || []).length > 3" class="text-xs text-gray-500 text-center">
                    +{{ (getDayData(staffData, day)?.entries || []).length - 3 }}
                  </div>

                  <div v-if="(getDayData(staffData, day)?.entries || []).length === 0" class="text-xs text-gray-400 text-center py-1">
                    -
                  </div>
                </div>

                <!-- Detailed view -->
                <div v-else class="space-y-1">
                  <div
                    v-for="entry in (getDayData(staffData, day)?.entries || [])"
                    :key="entry.id"
                    class="calendar-entry detailed"
                    :class="getEntryClass(entry)"
                    @click="handleEntryClick(entry)"
                    draggable="true"
                    @dragstart="handleDragStart(entry, $event)"
                  >
                    <div class="flex items-center gap-2 mb-1">
                      <div
                        class="w-2 h-2 rounded-full flex-shrink-0"
                        :class="getJobColor(entry.jobId)"
                      ></div>
                      <span class="text-xs font-medium">{{ entry.jobNumber || '' }}</span>
                      <Badge
                        v-if="!entry.billable"
                        variant="secondary"
                        class="text-xs ml-auto"
                      >
                        NB
                      </Badge>
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-300 truncate mb-1">
                      {{ entry.description || '' }}
                    </div>
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-gray-500">
                        {{ entry.startTime || '' }}{{ entry.endTime ? ` - ${entry.endTime}` : '' }}
                      </span>
                      <span class="font-medium">{{ (entry.hours || 0).toFixed(1) }}h</span>
                    </div>
                  </div>

                  <!-- Add button -->
                  <Button
                    v-if="(getDayData(staffData, day)?.entries || []).length === 0"
                    variant="ghost"
                    size="sm"
                    class="w-full h-6 text-xs"
                    @click="handleAddEntry(staffData.staff, day.date)"
                  >
                    <Plus class="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>

                <!-- Day total indicator for normal mode -->
                <div v-if="(getDayData(staffData, day)?.hours || 0) > 0" class="mt-1 pt-1 border-t border-gray-200 dark:border-gray-600">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-gray-500">Total:</span>
                    <span class="font-medium" :class="getHoursClass(getDayData(staffData, day)?.hours || 0)">
                      {{ (getDayData(staffData, day)?.hours || 0).toFixed(1) }}h
                    </span>
                  </div>
                  <div v-if="(getDayData(staffData, day)?.overtime || 0) > 0" class="text-xs text-orange-500">
                    +{{ (getDayData(staffData, day)?.overtime || 0).toFixed(1) }}h extra
                  </div>
                </div>
              </div>
            </template>

            <!-- Fallback if no day data -->
            <template v-else>
              <div class="text-xs text-gray-400 text-center py-1">-</div>
            </template>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- Entry modal -->
    <TimeEntryModal
      v-model:open="showEntryModal"
      :entry="editingEntry"
      :staff="selectedStaff"
      :date="selectedDate"
      :available-jobs="availableJobs"
      @save="handleSaveEntry"
      @cancel="handleCancelEntry"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Grid, List } from 'lucide-vue-next'
// import IMSTableView from './IMSTableView.vue' // TODO: Create this component
import { imsService, type IMSExportData } from '@/services/ims.service'
import type { Staff, TimeEntry, Job, WeeklyStaffData } from '@/types/timesheet.types'

interface Props {
  weekStart: Date
  staffEntries: WeeklyStaffData[]
  staffList: Staff[]
  availableJobs: Job[]
  refreshKey?: number
  imsExportMode: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  entryMoved: [entryId: string, newDate: Date, newStaffId?: string]
  entryUpdated: [entry: TimeEntry]
  entryCreated: [entry: Omit<TimeEntry, 'id'>]
  imsToggle: [enabled: boolean]
}>()

const currentView = ref<'compact' | 'detailed'>('compact')
const imsData = ref<IMSExportData | null>(null)
const loadingIMS = ref(false)
const showEntryModal = ref(false)
const editingEntry = ref<TimeEntry | null>(null)
const selectedStaff = ref<Staff | null>(null)
const selectedDate = ref<Date>(new Date())
const draggedEntry = ref<TimeEntry | null>(null)

const calendarViews = [
  { value: 'compact' as const, label: 'Compact', icon: Grid },
  { value: 'detailed' as const, label: 'Detailed', icon: List }
]

// Helper function to get IMS week days (Tue-Fri + next Mon)
const getIMSWeekDays = (startDate: Date) => {
  const days = []

  // Find Tuesday based on the start date (which should be a Monday)
  const tuesday = new Date(startDate)

  // If startDate is Monday (getDay() === 1), we want the Tuesday of the previous week
  // Otherwise, calculate Tuesday relative to the current week
  if (startDate.getDay() === 1) { // Monday
    tuesday.setDate(startDate.getDate() - 6) // Go back to Tuesday of previous week
  } else {
    const daysToTuesday = startDate.getDay() - 2 // 0=Sun, 1=Mon, 2=Tue, etc.
    if (daysToTuesday < 0) {
      // If it's Sunday, go back to Tuesday (5 days back from Sunday)
      tuesday.setDate(startDate.getDate() - 5)
    } else {
      tuesday.setDate(startDate.getDate() - daysToTuesday)
    }
  }

  console.log('🗓️ IMS Week calculation:')
  console.log('- Start date (weekDate):', startDate.toDateString(), 'Day:', startDate.getDay())
  console.log('- Calculated Tuesday:', tuesday.toDateString(), 'Day:', tuesday.getDay())

  // Tuesday to Friday (4 days) - indices 0,1,2,3
  for (let i = 0; i < 4; i++) {
    const day = new Date(tuesday)
    day.setDate(tuesday.getDate() + i)
    days.push({
      date: day,
      isNextWeek: false
    })
  }

  // Next Monday (6 days after Tuesday) - index 4
  const nextMonday = new Date(tuesday)
  nextMonday.setDate(tuesday.getDate() + 6)
  days.push({
    date: nextMonday,
    isNextWeek: true
  })

  console.log('📅 IMS Week days:')
  days.forEach((d, i) => {
    console.log(`   ${i}: ${d.date.toDateString()} (${d.date.getDay()}) ${d.isNextWeek ? '(next week)' : ''}`)
  })

  return days
}

// Helper function to get normal week days (Mon-Fri)
const getWeekDays = (startDate: Date) => {
  const days = []
  for (let i = 0; i < 5; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    days.push({
      date,
      isNextWeek: false
    })
  }
  return days
}

// Helper function to get day data based on IMS or normal mode
const getDayData = (staffData: WeeklyStaffData, day: { date: Date; isNextWeek: boolean }) => {
  if (!staffData.weeklyHours || !Array.isArray(staffData.weeklyHours)) {
    return null
  }

  if (props.imsExportMode) {
    // In IMS mode, data comes via props in staffData.weeklyHours
    // Find the matching day by date string
    const targetDateStr = day.date.toISOString().split('T')[0]

    const foundData = staffData.weeklyHours.find(weeklyData => {
      // The date should be in weeklyData.date
      if (weeklyData.date) {
        const dataDateStr = weeklyData.date
        return dataDateStr === targetDateStr
      }
      return false
    })

    if (props.imsExportMode && staffData.staff.name === 'Charlie Baker') {
      console.log(`🔍 [${staffData.staff.name}] Looking for ${targetDateStr}`)
      console.log(`   Available dates in weeklyHours:`, staffData.weeklyHours.map(w => ({ date: w.date, hours: w.hours })))
      console.log(`   Found data:`, foundData ? 'YES' : 'NO')
      if (foundData) {
        console.log(`   ✅ Found data for ${targetDateStr}:`, foundData)
      } else {
        console.log(`   ❌ No data found for ${targetDateStr}`)
      }
    }

    return foundData
  } else {
    // In normal mode, use the display days array index
    const dayIndex = displayDays.value.findIndex(d => d.date.toDateString() === day.date.toDateString())
    return dayIndex >= 0 ? staffData.weeklyHours[dayIndex] : null
  }
}

const displayDays = computed(() => {
  const rawDays = props.imsExportMode
    ? getIMSWeekDays(props.weekStart)
    : getWeekDays(props.weekStart)

  const result = rawDays.map((dayInfo, index) => {
    const totalHours = (props.staffEntries || []).reduce((total, staff) => {
      return total + (staff.weeklyHours?.[index]?.hours || 0)
    }, 0)

    return {
      ...dayInfo,
      dateStr: dayInfo.date.toISOString().split('T')[0],
      dayName: dayInfo.date.toLocaleDateString('en-NZ', { weekday: 'short' }),
      dayNum: dayInfo.date.getDate().toString(),
      totalHours
    }
  })

  // Only log when switching modes for debugging
  if (props.imsExportMode) {
    console.log('📅 IMS Mode - Display days:', result.map(d => ({ day: d.dayName, date: d.dateStr, isNextWeek: d.isNextWeek })))
  }

  return result
})

const totalWeekHours = computed(() => {
  if (!props.staffEntries || !Array.isArray(props.staffEntries)) {
    return 0
  }
  return props.staffEntries.reduce((total, staff) => total + (staff.totalHours || 0), 0)
})

const activeStaffCount = computed(() => {
  if (!props.staffEntries || !Array.isArray(props.staffEntries)) {
    return 0
  }
  return props.staffEntries.filter(staff => (staff.totalHours || 0) > 0).length
})

const formatWeekRange = (startDate: Date) => {
  if (!startDate || !(startDate instanceof Date) || isNaN(startDate.getTime())) {
    return 'Invalid Date'
  }

  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)

  const startStr = startDate.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })
  const endStr = endDate.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })

  return `${startStr} - ${endStr}, ${startDate.getFullYear()}`
}

const isToday = (date: Date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return false
  }
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const getJobColor = (jobId: string | undefined) => {
  if (!jobId) return 'bg-gray-500'

  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ]
  const index = parseInt(jobId) % colors.length
  return colors[index] || 'bg-gray-500'
}

const getEntryClass = (entry: TimeEntry) => {
  return {
    'border-l-4': true,
    'border-blue-500': entry.billable,
    'border-gray-400': !entry.billable,
    'bg-blue-50 dark:bg-blue-900/20': entry.billable,
    'bg-gray-50 dark:bg-gray-700': !entry.billable
  }
}

const getHoursClass = (hours: number) => {
  if (hours >= 8) return 'text-green-600'
  if (hours >= 6) return 'text-yellow-600'
  return 'text-gray-600'
}

const handleEntryClick = (entry: TimeEntry) => {
  editingEntry.value = entry
  selectedStaff.value = props.staffList.find(s => s.id === entry.staffId) || null

  // Handle different date field possibilities
  let entryDate = entry.date || entry.timesheetDate
  if (entryDate) {
    selectedDate.value = new Date(entryDate)
  } else {
    selectedDate.value = new Date()
  }
  showEntryModal.value = true
}

const handleAddEntry = (staff: Staff, date: Date) => {
  editingEntry.value = null
  selectedStaff.value = staff
  selectedDate.value = date
  showEntryModal.value = true
}

const handleSaveEntry = (entry: TimeEntry | Omit<TimeEntry, 'id'>) => {
  if ('id' in entry) {
    emit('entryUpdated', entry)
  } else {
    emit('entryCreated', entry)
  }
  showEntryModal.value = false
}

const handleCancelEntry = () => {
  showEntryModal.value = false
  editingEntry.value = null
}

const handleImsToggle = async (enabled: boolean) => {
  console.log('🔄 IMS toggle triggered, enabled:', enabled)

  // Update the parent component - it will handle data loading and pass imsExportMode back via props
  emit('imsToggle', enabled)

  if (enabled) {
    console.log('🔄 IMS mode enabled - switching to Tuesday-Friday + Monday layout')
    imsService.updateURLForIMSMode(true)
    // Don't load IMS data internally - TimesheetView handles this via props
  } else {
    console.log('🔄 IMS mode disabled - switching back to Monday-Friday layout')
    imsService.updateURLForIMSMode(false)
    imsData.value = null
  }
}

// Check URL parameters on mount to set IMS mode
const checkUrlParams = () => {
  const isIMSMode = imsService.isIMSModeFromURL()

  if (isIMSMode) {
    // Emit to parent to enable IMS mode
    emit('imsToggle', true)
    console.log('🔄 IMS mode enabled from URL parameter')
    // Note: IMS data will be loaded by TimesheetView and passed via props
  }
}

// Call on component mount
checkUrlParams()

// Watch for week changes - no need to reload IMS data as it comes via props
watch(() => props.weekStart, () => {
  if (props.imsExportMode) {
    console.log('📅 Week changed in IMS mode - data will be updated via props')
  }
})

// Drag and Drop handlers
const handleDragStart = (entry: TimeEntry, event: DragEvent) => {
  draggedEntry.value = entry
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', entry.id)
  }
}

const handleDrop = (newStaffId: string, newDate: Date, event: DragEvent) => {
  event.preventDefault()

  if (draggedEntry.value && newDate) {
    const entryDateStr = draggedEntry.value.date || draggedEntry.value.timesheetDate
    if (entryDateStr) {
      const entryDate = new Date(entryDateStr)
      const isSameDate = entryDate.toDateString() === newDate.toDateString()
      const isSameStaff = draggedEntry.value.staffId === newStaffId

      if (!isSameDate || !isSameStaff) {
        emit('entryMoved', draggedEntry.value.id, newDate, newStaffId !== draggedEntry.value.staffId ? newStaffId : undefined)
      }
    }
  }

  draggedEntry.value = null
}

// IMS Helper functions for data display
const getIMSDayData = (dayData: any) => {
  if (!dayData) return null

  // Check if this is already IMS formatted data
  if (dayData.standard_hours !== undefined || dayData.time_and_half_hours !== undefined) {
    return dayData
  }

  // Check if there's IMS data in a nested structure
  if (dayData.ims_data) {
    return dayData.ims_data
  }

  // Check if there's daily_summary with IMS data
  if (dayData.daily_summary) {
    return dayData.daily_summary
  }

  return null
}

// Calculate proper IMS status based on hours worked vs scheduled
const getIMSStatus = (dayData: any) => {
  if (!dayData) return null

  const hours = dayData.hours || 0
  const scheduledHours = 8.0 // Standard work day (could be made configurable)
  const leaveHours = dayData.leaveHours || 0

  // If it's a leave day
  if (leaveHours > 0) {
    return {
      type: 'leave',
      label: `${getLeaveTypeLabel(dayData.leaveType)} Leave`,
      class: 'ims-status-leave'
    }
  }

  // If no hours worked
  if (hours === 0) {
    return {
      type: 'empty',
      label: 'No Time',
      class: 'ims-status-empty'
    }
  }

  // If full day worked (8+ hours)
  if (hours >= scheduledHours) {
    // Check for overtime
    if (hours > scheduledHours) {
      const overtime = hours - scheduledHours
      return {
        type: 'overtime',
        label: `OT +${formatHourValue(overtime)}h`,
        class: 'ims-status-overtime'
      }
    } else {
      return {
        type: 'complete',
        label: 'Full Day',
        class: 'ims-status-ok'
      }
    }
  }

  // If partial day (less than 8 hours)
  const missing = scheduledHours - hours
  return {
    type: 'partial',
    label: `-${formatHourValue(missing)}h`,
    class: 'ims-status-warning'
  }
}

const hasWorkHours = (dayData: any) => {
  const imsData = getIMSDayData(dayData)
  if (!imsData) return false

  return (imsData.standard_hours || 0) > 0 ||
         (imsData.time_and_half_hours || 0) > 0 ||
         (imsData.double_time_hours || 0) > 0
}

const formatHourValue = (hours: number | undefined | null) => {
  if (!hours || hours === 0) return '0.0'
  return hours.toFixed(1)
}

const getLeaveTypeLabel = (leaveType: string | undefined | null) => {
  if (!leaveType) return 'Leave'

  const leaveTypes: Record<string, string> = {
    'annual': 'Annual',
    'sick': 'Sick',
    'personal': 'Personal',
    'public_holiday': 'Public Holiday',
    'bereavement': 'Bereavement',
    'parental': 'Parental',
    'other': 'Other'
  }

  return leaveTypes[leaveType.toLowerCase()] || leaveType
}

// Computed properties for IMS Table View
const imsStaffList = computed(() => {
  if (!props.imsExportMode || !props.staffEntries) {
    return []
  }

  // Transform the staffEntries (which already contain IMS data when in IMS mode) to the format expected by IMSTableView
  return props.staffEntries.map(staffData => {
    // Convert weeklyHours array to days object keyed by date for IMSTableView
    const daysObject: Record<string, any> = {}

    if (staffData.weeklyHours && Array.isArray(staffData.weeklyHours)) {
      staffData.weeklyHours.forEach(dayData => {
        if (dayData.date) {
          daysObject[dayData.date] = {
            total_hours: dayData.hours || 0,
            standard_hours: (dayData as any).standard_hours || 0,
            time_and_half_hours: (dayData as any).time_and_half_hours || 0,
            double_time_hours: (dayData as any).double_time_hours || 0,
            leave_hours: dayData.leaveHours || 0,
            leave_type: dayData.leaveType,
            notes: dayData.status || ''
          }
        }
      })
    }

    return {
      staff_id: staffData.staff.id,
      staff_name: staffData.staff.name,
      total_work_hours: (staffData as any).totalStandardHours || 0,
      total_leave_hours: (staffData as any).totalLeaveHours || 0,
      total_billable_hours: staffData.totalHours || 0,
      billable_percentage: staffData.billablePercentage || 0,
      days: daysObject
    }
  })
})

const imsError = computed(() => {
  if (!props.imsExportMode) return undefined
  // No loading or error states needed since data comes via props
  return undefined
})

// Helper function to get normal week days (alias for compatibility)
const getNormalWeekDays = getWeekDays

// Watch for week changes to reload IMS data if in IMS mode
</script>

<style scoped>
.calendar-header {
  display: grid;
  grid-template-columns: 200px repeat(5, 1fr);
}

.calendar-row {
  display: grid;
  grid-template-columns: 200px repeat(5, 1fr);
}

.staff-column {
  min-width: 200px;
  max-width: 200px;
}

.day-column {
  min-width: 0;
}

.calendar-entry {
  padding: 0.375rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.calendar-entry.compact:hover {
  background-color: rgb(243 244 246);
}

.dark .calendar-entry.compact:hover {
  background-color: rgb(75 85 99);
}

.calendar-entry.detailed {
  border: 1px solid rgb(229 231 235);
}

.dark .calendar-entry.detailed {
  border-color: rgb(75 85 99);
}

.calendar-entry.detailed:hover {
  border-color: rgb(147 197 253);
}

.dark .calendar-entry.detailed:hover {
  border-color: rgb(59 130 246);
}

.calendar-entry:active {
  transform: scale(0.95);
}

.day-cell {
  transition: all 0.2s ease;
}

.day-cell:hover {
  background-color: rgb(249 250 251);
}

.dark .day-cell:hover {
  background-color: rgba(55, 65, 81, 0.3);
}

/* IMS-specific styling using Tailwind classes only */
</style>

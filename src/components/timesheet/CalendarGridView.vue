<template>
  <div class="calendar-grid-view h-full flex flex-col">
    <!-- Week header -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Calendar View
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatWeekRange(weekStart) }}
          </p>
        </div>

        <div class="flex items-center gap-4">
          <!-- View toggle -->
          <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Button
              v-for="view in calendarViews"
              :key="view.value"
              :variant="currentView === view.value ? 'default' : 'ghost'"
              size="sm"
              @click="currentView = view.value"
            >
              <component :is="view.icon" class="h-4 w-4 mr-2" />
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

    <!-- Calendar grid -->
    <div class="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <!-- Day headers -->
      <div class="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
        <!-- Staff column -->
        <div class="p-3 bg-gray-50 dark:bg-gray-700 font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
          Staff Member
        </div>

        <!-- Day columns -->
        <div
          v-for="day in weekDays"
          :key="day.dateStr"
          class="p-3 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0"
          :class="{ 'bg-blue-50 dark:bg-blue-900/20': isToday(day.date) }"
        >
          <div class="font-medium text-gray-900 dark:text-white">
            {{ day.dayName }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ day.dayNum }}
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {{ day.totalHours.toFixed(1) }}h
          </div>
        </div>
      </div>

      <!-- Scrollable content -->
      <div class="h-[calc(100%-60px)] overflow-y-auto">
        <!-- Row for each staff member -->
        <div
          v-for="staffData in staffEntries"
          :key="staffData.staff.id"
          class="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          <!-- Staff column -->
          <div class="p-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div class="flex items-center gap-2">
              <Avatar class="h-8 w-8">
                <AvatarImage :src="staffData.staff.avatarUrl || ''" />
                <AvatarFallback class="text-xs">
                  {{ (staffData.staff.firstName?.[0] || '') + (staffData.staff.lastName?.[0] || '') }}
                </AvatarFallback>
              </Avatar>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ staffData.staff.name || 'Unknown' }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ (staffData.totalHours || 0).toFixed(1) }}h total
                </div>
              </div>
            </div>
          </div>

          <!-- Day columns -->
          <div
            v-for="(dayData, dayIndex) in staffData.weeklyHours"
            :key="`${staffData.staff.id}-${dayIndex}`"
            class="day-cell p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-h-[120px]"
            :class="{ 'bg-blue-50/50 dark:bg-blue-900/10': isToday(weekDays[dayIndex]?.date) }"
            @dragover.prevent
            @dragenter.prevent
            @drop="handleDrop(staffData.staff.id, weekDays[dayIndex]?.date, $event)"
          >
            <!-- Compact view -->
            <div v-if="currentView === 'compact'" class="space-y-1">
              <div
                v-for="entry in (dayData?.entries || []).slice(0, 2)"
                :key="entry.id"
                class="calendar-entry compact"
                :class="getEntryClass(entry)"
                @click="handleEntryClick(entry)"
                draggable="true"
                @dragstart="handleDragStart(entry, $event)"
              >
                <div class="flex items-center gap-1">
                  <div
                    class="w-2 h-2 rounded-full"
                    :class="getJobColor(entry.jobId)"
                  ></div>
                  <span class="text-xs font-medium truncate">{{ entry.jobNumber || '' }}</span>
                  <span class="text-xs text-gray-500 ml-auto">{{ (entry.hours || 0).toFixed(1) }}h</span>
                </div>
              </div>

              <div v-if="(dayData?.entries || []).length > 2" class="text-xs text-gray-500 text-center">
                +{{ (dayData?.entries || []).length - 2 }}
              </div>

              <div v-if="(dayData?.entries || []).length === 0" class="text-xs text-gray-400 text-center py-2">
                -
              </div>
            </div>

            <!-- Detailed view -->
            <div v-else class="space-y-1">
              <div
                v-for="entry in (dayData?.entries || [])"
                :key="entry.id"
                class="calendar-entry detailed"
                :class="getEntryClass(entry)"
                @click="handleEntryClick(entry)"
                draggable="true"
                @dragstart="handleDragStart(entry, $event)"
              >
                <div class="flex items-center gap-2 mb-1">
                  <div
                    class="w-2 h-2 rounded-full"
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
                v-if="(dayData?.entries || []).length === 0"
                variant="ghost"
                size="sm"
                class="w-full h-8 text-xs"
                @click="handleAddEntry(staffData.staff, weekDays[dayIndex]?.date)"
              >
                <Plus class="h-3 w-3 mr-1" />
                Add Entry
              </Button>
            </div>

            <!-- Day total indicator -->
            <div v-if="(dayData?.hours || 0) > 0" class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500">Total:</span>
                <span class="font-medium" :class="getHoursClass(dayData?.hours || 0)">
                  {{ (dayData?.hours || 0).toFixed(1) }}h
                </span>
              </div>
              <div v-if="(dayData?.overtime || 0) > 0" class="text-xs text-orange-500">
                +{{ (dayData?.overtime || 0).toFixed(1) }}h extra
              </div>
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
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Grid, List } from 'lucide-vue-next'
import TimeEntryModal from './TimeEntryModal.vue'
import type { Staff, TimeEntry, Job, WeeklyStaffData } from '@/types/timesheet'

interface Props {
  weekStart: Date
  staffEntries: WeeklyStaffData[]
  staffList: Staff[]
  availableJobs: Job[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  entryMoved: [entryId: string, newDate: Date, newStaffId?: string]
  entryUpdated: [entry: TimeEntry]
  entryCreated: [entry: Omit<TimeEntry, 'id'>]
}>()

const currentView = ref<'compact' | 'detailed'>('detailed')
const showEntryModal = ref(false)
const editingEntry = ref<TimeEntry | null>(null)
const selectedStaff = ref<Staff | null>(null)
const selectedDate = ref<Date>(new Date())
const draggedEntry = ref<TimeEntry | null>(null)

const calendarViews = [
  { value: 'compact' as const, label: 'Compact', icon: Grid },
  { value: 'detailed' as const, label: 'Detailed', icon: List }
]

const weekDays = computed(() => {
  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(props.weekStart)
    date.setDate(date.getDate() + i)

    const totalHours = (props.staffEntries || []).reduce((total, staff) => {
      return total + (staff.weeklyHours?.[i]?.hours || 0)
    }, 0)

    days.push({
      date,
      dateStr: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-NZ', { weekday: 'short' }),
      dayNum: date.getDate(),
      totalHours
    })
  }
  return days
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
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)

  const startStr = startDate.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })
  const endStr = endDate.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })

  return `${startStr} - ${endStr}, ${startDate.getFullYear()}`
}

const isToday = (date: Date) => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const getJobColor = (jobId: string) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ]
  const index = parseInt(jobId) % colors.length
  return colors[index]
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
  selectedDate.value = new Date(entry.date)
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
    const entryDate = new Date(draggedEntry.value.date)
    const isSameDate = entryDate.toDateString() === newDate.toDateString()
    const isSameStaff = draggedEntry.value.staffId === newStaffId

    if (!isSameDate || !isSameStaff) {
      emit('entryMoved', draggedEntry.value.id, newDate, newStaffId !== draggedEntry.value.staffId ? newStaffId : undefined)
    }
  }

  draggedEntry.value = null
}
</script>

<style scoped>
.calendar-entry {
  padding: 0.5rem;
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
</style>

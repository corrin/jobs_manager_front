<template>
  <div class="weekly-kanban-view h-full flex flex-col">
    <!-- Week header -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Weekly Kanban View
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatWeekRange(weekStart) }}
          </p>
        </div>

        <div class="flex items-center gap-4">
          <!-- Week statistics -->
          <div class="text-right">
            <div class="text-sm text-gray-500 dark:text-gray-400">Week Total</div>
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ totalWeekHours.toFixed(1) }}h
            </div>
            <div class="text-xs text-gray-500">
              {{ weeklyBillablePercentage }}% billable
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Available Jobs and Staff Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
      <div class="grid grid-cols-2 gap-4">
        <!-- Available Jobs (Left Side) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-medium text-gray-900 dark:text-white text-sm">
              Available Jobs
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Drag jobs to days
            </p>
          </div>
          <JobAttachmentZone
            :attached-jobs="attachedJobs"
            :is-drag-over-job-zone="isDragOverJobZone"
            @job-attached="handleJobAttached"
            @job-removed="handleJobRemoved"
            @job-drag-start="handleJobDragStart"
            @job-drag-end="handleJobDragEnd"
          />
        </div>

        <!-- Staff Panel (Right Side) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-medium text-gray-900 dark:text-white text-sm">
              Team
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Drag to assign
            </p>
          </div>
          <StaffPanel
            :staff-list="staffList"
            :is-staff-dragging="isStaffDragging"
            @staff-drag-start="handleStaffDragStart"
            @staff-drag-end="handleStaffDragEnd"
          />
        </div>
      </div>
    </div>

    <!-- Weekly Kanban Grid -->
    <div class="flex-1 min-h-0">
      <div class="h-full overflow-x-auto">
        <div class="grid grid-cols-5 gap-2 h-full w-full min-w-max p-1">
          <!-- Column for each weekday -->
          <div
            v-for="day in weekDays"
            :key="day.dateStr"
            class="kanban-column"
          >
            <!-- Day header -->
            <div
              class="day-header bg-white dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700 p-3"
              :class="{ 'border-blue-500 bg-blue-50 dark:bg-blue-900/20': isToday(day.date) }"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    {{ day.dayName }}
                  </h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ day.dateStr }}
                  </p>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ day.totalHours.toFixed(1) }}h
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ day.staffCount }} staff
                  </div>
                </div>
              </div>
            </div>

            <!-- Staff list for the day -->
            <div class="day-content bg-gray-50 dark:bg-gray-900 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg">
              <div class="max-h-[calc(100vh-300px)] overflow-y-auto p-2 space-y-2">
                <div
                  v-for="staffEntry in day.staffEntries"
                  :key="`${day.dateStr}-${staffEntry.staff.id}`"
                  class="staff-day-card"
                >
                  <!-- Staff card container -->
                  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <!-- Staff entry -->
                    <div class="flex items-center gap-2 mb-2">
                      <Avatar class="h-6 w-6">
                        <AvatarImage :src="staffEntry.staff.avatarUrl || ''" />
                        <AvatarFallback class="text-xs">
                          {{ (staffEntry.staff.firstName?.[0] || '') + (staffEntry.staff.lastName?.[0] || '') }}
                        </AvatarFallback>
                      </Avatar>
                      <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ staffEntry.staff.name }}
                        </div>
                        <div class="text-xs text-gray-500">
                          {{ staffEntry.dayData.hours.toFixed(1) }}h
                          <span v-if="staffEntry.dayData.overtime > 0" class="text-orange-500">
                            (+{{ staffEntry.dayData.overtime.toFixed(1) }}h extra)
                          </span>
                        </div>
                      </div>
                      <Badge
                        :variant="getStatusVariant(staffEntry.dayData.status)"
                        class="text-xs"
                      >
                        {{ getStatusLabel(staffEntry.dayData.status) }}
                      </Badge>
                    </div>

                    <!-- Staff entries -->
                    <div class="space-y-1">
                      <div
                        v-for="entry in staffEntry.dayData.entries.slice(0, 3)"
                        :key="entry.id"
                        class="kanban-entry bg-gray-50 dark:bg-gray-700 rounded p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        @click="handleEntryClick(entry)"
                        draggable="true"
                        @dragstart="handleDragStart(entry, $event)"
                        @dragend="handleDragEnd"
                      >
                        <div class="flex items-center gap-2">
                          <div
                            class="w-2 h-2 rounded-full flex-shrink-0"
                            :class="getJobColor(entry.jobId)"
                          ></div>
                          <div class="flex-1 min-w-0">
                            <div class="text-xs font-medium text-gray-900 dark:text-white truncate">
                              {{ entry.jobNumber }}
                            </div>
                            <div class="text-xs text-gray-500 truncate">
                              {{ entry.description }}
                            </div>
                          </div>
                          <div class="text-xs text-gray-600 dark:text-gray-300">
                            {{ entry.hours.toFixed(1) }}h
                          </div>
                        </div>
                      </div>

                      <!-- Show indicator if there are more entries -->
                      <div
                        v-if="staffEntry.dayData.entries.length > 3"
                        class="text-xs text-gray-500 text-center py-1"
                      >
                        +{{ staffEntry.dayData.entries.length - 3 }} more entries
                      </div>
                    </div>

                    <!-- Add entry button -->
                    <Button
                      variant="ghost"
                      size="sm"
                      class="w-full mt-2 text-xs"
                      @click="handleAddEntry(staffEntry.staff, day.date)"
                    >
                      <Plus class="h-3 w-3 mr-1" />
                      Add Entry
                    </Button>

                    <!-- Drop zone for staff + job assignment -->
                    <div
                      class="staff-drop-zone min-h-[60px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center transition-colors mt-2"
                      :class="{
                        'border-blue-500 bg-blue-50 dark:bg-blue-900/20': isDragOver === `${day.dateStr}-${staffEntry.staff.id}` && !draggedJob,
                        'border-green-500 bg-green-50 dark:bg-green-900/20': draggedJob && isDragOver === `${day.dateStr}-${staffEntry.staff.id}`
                      }"
                      @dragover.prevent="event => event.preventDefault()"
                      @dragenter.prevent="event => handleStaffDragEnter(day.dateStr, staffEntry.staff.id, event)"
                      @dragleave="event => handleStaffDragLeave(event)"
                      @drop.prevent="event => handleStaffDrop(staffEntry.staff, day.date, event)"
                    >
                      <span class="text-xs text-gray-500">
                        <template v-if="draggedJob">
                          Drop job to create time entry
                        </template>
                        <template v-else>
                          Drop here to move
                        </template>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Pending Jobs for this day -->
                <div 
                  v-for="pendingJob in getPendingJobsForDay(day.dateStr)" 
                  :key="pendingJob.id"
                  class="pending-job-card bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-600 rounded-lg p-2 mt-2"
                  :class="{
                    'animate-pulse border-orange-500 bg-orange-100': pendingJob.id === activePendingJobId,
                    'border-green-500 bg-green-50': isDragOver === pendingJob.id && draggedStaff
                  }"
                  @dragover.prevent
                  @dragenter.prevent="event => handlePendingJobDragEnter(pendingJob.id, event)"
                  @dragleave="event => handlePendingJobDragLeave(event)"
                  @drop.prevent="event => handlePendingJobDrop(pendingJob, event)"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="text-xs font-medium text-orange-800 dark:text-orange-200">
                        {{ pendingJob.job.jobNumber }} - {{ pendingJob.job.name || pendingJob.job.jobName }}
                      </div>
                      <div class="text-xs text-orange-600 dark:text-orange-400">
                        Waiting for staff assignment
                      </div>
                      <div v-if="pendingJob.id === activePendingJobId" class="text-xs text-orange-600 font-medium mt-1">
                        👆 Drag a staff member here
                      </div>
                    </div>
                    <Button
                      @click="removePendingJob(pendingJob.id)"
                      variant="ghost"
                      size="sm"
                      class="h-4 w-4 p-0 text-orange-400 hover:text-red-500"
                    >
                      <X class="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <!-- Global drop zone for the day -->
                <div
                  class="day-drop-zone min-h-[40px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center mt-2"
                  :class="{ 
                    'border-blue-500 bg-blue-50 dark:bg-blue-900/20': isDragOver === day.dateStr,
                    'border-green-500 bg-green-50 dark:bg-green-900/20': draggedJob && isDragOver === day.dateStr
                  }"
                  @dragover.prevent="event => event.preventDefault()"
                  @dragenter.prevent="event => handleDayDragEnter(day.dateStr, event)"
                  @dragleave="event => handleDayDragLeave(event)"
                  @drop.prevent="event => handleDrop(day.date, event)"
                >
                  <span class="text-xs text-gray-500">
                    <template v-if="draggedJob">
                      Drop job here (will ask for staff)
                    </template>
                    <template v-else>
                      Drop here to move
                    </template>
                  </span>
                </div>
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

    <!-- Time Entry Creation Modal -->
    <TimeEntryCreationModal
      :is-open="showTimeEntryCreationModal"
      :staff="selectedStaff"
      :job="selectedJob"
      :date="selectedDate"
      @close="showTimeEntryCreationModal = false"
      @entry-created="handleTimeEntryCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, X } from 'lucide-vue-next'
import TimeEntryModal from './TimeEntryModal.vue'
import JobAttachmentZone from './JobAttachmentZone.vue'
import StaffPanel from './StaffPanel.vue'
import TimeEntryCreationModal from './TimeEntryCreationModal.vue'
import { createSafeDate } from '@/utils/safetyUtils'
import { getJobColor } from '@/utils/statusUtils'
import type { Staff, TimeEntry, Job, WeeklyStaffData, DayData } from '@/types/timesheet'

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
  jobAttached: [job: Job]
  jobRemoved: [jobId: string]
  timeEntryFromJob: [staffId: string, jobId: string, date: Date]
}>()

// State variables
const showEntryModal = ref(false)
const showTimeEntryCreationModal = ref(false)
const editingEntry = ref<TimeEntry | null>(null)
const selectedStaff = ref<Staff | null>(null)
const selectedDate = ref<Date>(new Date())
const selectedJob = ref<Job | null>(null)
const isDragOver = ref<string | null>(null)
const isDragOverJobZone = ref(false)
const draggedEntry = ref<TimeEntry | null>(null)
const draggedJob = ref<Job | null>(null)
const draggedStaff = ref<Staff | null>(null)
const isStaffDragging = ref(false)
const attachedJobs = ref<Job[]>([])

// Pending jobs state - jobs dropped on days waiting for staff assignment
const pendingJobs = ref<Array<{
  job: Job
  date: Date
  dateStr: string
  id: string // unique identifier for this pending job
}>>([])

const activePendingJobId = ref<string | null>(null)

const weekDays = computed(() => {
  const days = []
  // Show only weekdays (Monday to Friday) - skip weekends
  for (let i = 0; i < 5; i++) {
    const date = new Date(props.weekStart)
    date.setDate(date.getDate() + i)

    const dayData = {
      date,
      dateStr: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-NZ', { weekday: 'short' }),
      staffEntries: [] as Array<{ staff: Staff; dayData: DayData }>,
      totalHours: 0,
      staffCount: 0
    }

    // Aggregate staff data for this day
    if (props.staffEntries && Array.isArray(props.staffEntries)) {
      props.staffEntries.forEach(staffData => {
        // Safely access weeklyHours with proper checks
        if (staffData.weeklyHours && Array.isArray(staffData.weeklyHours)) {
          const dayEntry = staffData.weeklyHours[i]
          if (dayEntry && dayEntry.entries && dayEntry.entries.length > 0) {
            dayData.staffEntries.push({
              staff: staffData.staff,
              dayData: dayEntry
            })
            dayData.totalHours += dayEntry.hours || 0
          }
        }
      })
    }

    dayData.staffCount = dayData.staffEntries.length
    days.push(dayData)
  }
  return days
})

const totalWeekHours = computed(() => {
  if (!props.staffEntries || !Array.isArray(props.staffEntries)) {
    return 0
  }
  return props.staffEntries.reduce((total, staff) => {
    const staffTotal = staff?.totalHours || 0
    return total + staffTotal
  }, 0)
})

const weeklyBillablePercentage = computed(() => {
  if (!props.staffEntries || !Array.isArray(props.staffEntries)) {
    return 0
  }
  const totalBillable = props.staffEntries.reduce((total, staff) => {
    if (!staff.weeklyHours || !Array.isArray(staff.weeklyHours)) {
      return total
    }
    return total + staff.weeklyHours.reduce((dayTotal, day) => dayTotal + (day?.billableHours || 0), 0)
  }, 0)
  return totalWeekHours.value > 0 ? Math.round((totalBillable / totalWeekHours.value) * 100) : 0
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

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Complete': return 'default'
    case 'Partial': return 'secondary'
    case 'Leave': return 'outline'
    default: return 'destructive'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Complete': return 'Complete'
    case 'Partial': return 'Partial'
    case 'Leave': return 'Leave'
    case 'Empty': return 'Empty'
    default: return status
  }
}

const getJobColor = (jobId: string) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ]
  const index = parseInt(jobId) % colors.length
  return colors[index]
}

const handleEntryClick = (entry: TimeEntry) => {
  editingEntry.value = entry
  selectedStaff.value = props.staffList.find(s => s.id === entry.staffId) || null
  selectedDate.value = createSafeDate(entry.date)
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

const handleDragEnd = () => {
  draggedEntry.value = null
  isDragOver.value = null
}

const handleDrop = (newDate: Date, event: DragEvent) => {
  event.preventDefault()
  console.log('Day drop handler called:', { newDate, draggedJob: draggedJob.value, draggedEntry: draggedEntry.value })
  isDragOver.value = null

  // Try to get drag data
  let dragData = null
  try {
    const dataText = event.dataTransfer?.getData('text/plain')
    if (dataText) {
      dragData = JSON.parse(dataText)
    }
  } catch (e) {
    console.log('Could not parse drag data in day drop:', e)
  }

  // Handle job drag - create pending job that waits for staff assignment
  if (draggedJob.value || (dragData && dragData.type === 'job')) {
    const jobToDrop = draggedJob.value || dragData.job
    console.log('Job dropped on day:', jobToDrop, 'Date:', newDate)
    
    // Create pending job entry
    const pendingJobId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const dateStr = newDate.toISOString().split('T')[0]
    
    pendingJobs.value.push({
      job: jobToDrop,
      date: newDate,
      dateStr,
      id: pendingJobId
    })
    
    // Set as active pending job to trigger visual indicators
    activePendingJobId.value = pendingJobId
    
    console.log('Created pending job:', pendingJobId, 'Total pending:', pendingJobs.value.length)
    
    // Clear dragged job
    draggedJob.value = null
    return
  }

  // Handle time entry drag (existing functionality)
  if (draggedEntry.value) {
    const entryDate = createSafeDate(draggedEntry.value.date)
    if (entryDate.toDateString() !== newDate.toDateString()) {
      emit('entryMoved', draggedEntry.value.id, newDate)
    }
  }

  draggedEntry.value = null
  draggedJob.value = null
}

// Job attachment handlers
const handleJobAttached = (job: Job) => {
  console.log('Job attached:', job)
  attachedJobs.value.push(job)
  emit('jobAttached', job)
}

const handleJobRemoved = (jobId: string) => {
  console.log('Job removed:', jobId)
  attachedJobs.value = attachedJobs.value.filter(job => job.id !== jobId)
  emit('jobRemoved', jobId)
}

const handleJobDragStart = (job: Job) => {
  console.log('Job drag start:', job)
  draggedJob.value = job
}

const handleJobDragEnd = () => {
  console.log('Job drag end')
  draggedJob.value = null
  isDragOverJobZone.value = false
}

// Staff drag handlers
const handleStaffDragStart = (staff: Staff) => {
  console.log('Staff drag start:', staff)
  draggedStaff.value = staff
  isStaffDragging.value = true
}

const handleStaffDragEnd = () => {
  console.log('Staff drag end')
  draggedStaff.value = null
  isStaffDragging.value = false
}

// Staff drop zone handlers
const handleStaffDragEnter = (dateStr: string, staffId: string, event: DragEvent) => {
  event.preventDefault()
  console.log('Staff drag enter:', { dateStr, staffId, draggedJob: draggedJob.value })
  
  // Check if we have a job being dragged or a time entry
  if (draggedJob.value || event.dataTransfer?.types.includes('text/plain')) {
    isDragOver.value = `${dateStr}-${staffId}`
  }
}

const handleStaffDragLeave = (event: DragEvent) => {
  // Only clear drag over if we're actually leaving the drop zone
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const isOutside = event.clientX < rect.left || event.clientX > rect.right || 
                   event.clientY < rect.top || event.clientY > rect.bottom
  
  if (isOutside) {
    console.log('Staff drag leave')
    isDragOver.value = null
  }
}

// Day drop zone handlers
const handleDayDragEnter = (dateStr: string, event: DragEvent) => {
  event.preventDefault()
  console.log('Day drag enter:', { dateStr, draggedJob: draggedJob.value })
  
  // Check if we have a job being dragged or a time entry
  if (draggedJob.value || draggedEntry.value || event.dataTransfer?.types.includes('text/plain')) {
    isDragOver.value = dateStr
  }
}

const handleDayDragLeave = (event: DragEvent) => {
  // Only clear drag over if we're actually leaving the drop zone
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const isOutside = event.clientX < rect.left || event.clientX > rect.right || 
                   event.clientY < rect.top || event.clientY > rect.bottom
  
  if (isOutside) {
    console.log('Day drag leave')
    isDragOver.value = null
  }
}

const handleStaffDrop = (staff: Staff, date: Date, event: DragEvent) => {
  event.preventDefault()
  console.log('Staff drop:', { staff: staff.name, date, draggedJob: draggedJob.value })
  isDragOver.value = null

  // Try to get drag data
  let dragData = null
  try {
    const dataText = event.dataTransfer?.getData('text/plain')
    if (dataText) {
      dragData = JSON.parse(dataText)
    }
  } catch (e) {
    console.log('Could not parse drag data:', e)
  }

  // Handle job drag
  if (draggedJob.value || (dragData && dragData.type === 'job')) {
    const jobToDrop = draggedJob.value || dragData.job
    console.log('Creating time entry from job drop:', jobToDrop)
    
    // Create time entry when job is dropped on staff
    selectedStaff.value = staff
    selectedJob.value = jobToDrop
    selectedDate.value = date
    showTimeEntryCreationModal.value = true
    
    // Emit event for parent component
    emit('timeEntryFromJob', staff.id, jobToDrop.id, date)
  }
  // Handle time entry drag (existing functionality)
  else if (draggedEntry.value) {
    const entryDate = new Date(draggedEntry.value.date)
    if (entryDate.toDateString() !== date.toDateString() || draggedEntry.value.staffId !== staff.id) {
      emit('entryMoved', draggedEntry.value.id, date, staff.id)
    }
  }

  draggedJob.value = null
  draggedEntry.value = null
}

// Pending jobs management
const getPendingJobsForDay = (dateStr: string) => {
  return pendingJobs.value.filter(pj => pj.dateStr === dateStr)
}

const removePendingJob = (pendingJobId: string) => {
  console.log('Removing pending job:', pendingJobId)
  pendingJobs.value = pendingJobs.value.filter(pj => pj.id !== pendingJobId)
  
  if (activePendingJobId.value === pendingJobId) {
    activePendingJobId.value = null
  }
}

// Pending job drop handlers
const handlePendingJobDragEnter = (pendingJobId: string, event: DragEvent) => {
  event.preventDefault()
  console.log('Pending job drag enter:', pendingJobId, 'draggedStaff:', draggedStaff.value)
  
  if (draggedStaff.value) {
    isDragOver.value = pendingJobId
  }
}

const handlePendingJobDragLeave = (event: DragEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const isOutside = event.clientX < rect.left || event.clientX > rect.right || 
                   event.clientY < rect.top || event.clientY > rect.bottom
  
  if (isOutside) {
    console.log('Pending job drag leave')
    isDragOver.value = null
  }
}

const handlePendingJobDrop = (pendingJob: any, event: DragEvent) => {
  event.preventDefault()
  console.log('Staff dropped on pending job:', { pendingJob, draggedStaff: draggedStaff.value })
  
  // Try to get drag data
  let dragData = null
  try {
    const dataText = event.dataTransfer?.getData('text/plain')
    if (dataText) {
      dragData = JSON.parse(dataText)
    }
  } catch (e) {
    console.log('Could not parse drag data in pending job drop:', e)
  }

  // Handle staff drop on pending job
  if (draggedStaff.value || (dragData && dragData.type === 'staff')) {
    const staffToDrop = draggedStaff.value || dragData.staff
    console.log('Creating time entry from staff + pending job:', { staff: staffToDrop, job: pendingJob.job })
    
    // Set data for time entry creation modal
    selectedStaff.value = staffToDrop
    selectedJob.value = pendingJob.job
    selectedDate.value = pendingJob.date
    showTimeEntryCreationModal.value = true
    
    // Remove the pending job since it's now being processed
    removePendingJob(pendingJob.id)
    
    // Clear dragged staff
    draggedStaff.value = null
    isStaffDragging.value = false
    isDragOver.value = null
    
    // Emit event for parent component
    emit('timeEntryFromJob', staffToDrop.id, pendingJob.job.id, pendingJob.date)
  }
}

// Time entry creation handler
const handleTimeEntryCreated = (entry: Omit<TimeEntry, 'id'>) => {
  emit('entryCreated', entry)
  showTimeEntryCreationModal.value = false
  selectedStaff.value = null
  selectedJob.value = null
}
</script>

<style scoped>
.kanban-column {
  min-height: calc(100vh - 300px);
}

.day-header {
  position: sticky;
  top: 0;
  z-index: 10;
}

.kanban-entry {
  cursor: grab;
}

.kanban-entry:active {
  cursor: grabbing;
}

/* Pending job animations */
.pending-job-card {
  transition: all 0.3s ease;
}

.pending-job-card.animate-pulse {
  animation: pulse-orange 2s infinite;
}

@keyframes pulse-orange {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
}

/* Staff dragging visual feedback */
.staff-drop-zone,
.day-drop-zone,
.pending-job-card {
  transition: all 0.2s ease;
}

.staff-day-card {
  transition: all 0.2s ease;
}

.staff-day-card:hover {
  transform: translateY(-1px);
}

/* Ensure full width usage */
.weekly-kanban-view {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .weekly-kanban-view {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
  }
  
  .grid-cols-5 {
    grid-template-columns: repeat(5, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .grid-cols-5 {
    grid-template-columns: repeat(5, minmax(180px, 1fr));
  }
}
</style>

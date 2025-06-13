<template>
  <AppLayout>
    <div class="h-screen flex flex-col">
      <!-- Main header with controls -->
      <TimesheetHeader v-if="currentStaff" v-model:current-date="currentDate" v-model:current-staff="currentStaff"
        v-model:view-mode="viewMode" :staff-list="staffList" @export-ims="handleExportIMS"
        @previous-staff="handlePreviousStaff" @next-staff="handleNextStaff" class="flex-shrink-0" />

      <!-- Main content area -->
      <div class="flex-1 min-h-0 p-4">
        <!-- Staff Day Sheet View -->
        <StaffDaySheet v-if="viewMode === 'staff-day' && currentStaff" :staff="currentStaff" :date="currentDate"
          :time-entries="currentDayEntries" :available-jobs="availableJobs" @entry-updated="handleEntryUpdated"
          @entry-created="handleEntryCreated" @entry-deleted="handleEntryDeleted" />

        <!-- Kanban Weekly View -->
        <WeeklyKanbanView v-else-if="viewMode === 'weekly-kanban'" :week-start="weekStart"
          :staff-entries="weeklyEntries" :staff-list="staffList" :available-jobs="availableJobs"
          @entry-moved="handleEntryMoved" @entry-updated="handleEntryUpdated" @entry-created="handleEntryCreated"
          @job-attached="handleJobAttached" @job-removed="handleJobRemoved" @time-entry-from-job="handleTimeEntryFromJob" />

        <!-- Calendar Grid View -->
        <CalendarGridView v-else-if="viewMode === 'calendar-grid'" :week-start="weekStart"
          :staff-entries="weeklyEntries" :staff-list="staffList" :available-jobs="availableJobs"
          @entry-moved="handleEntryMoved" @entry-updated="handleEntryUpdated" @entry-created="handleEntryCreated" />
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import TimesheetHeader from '@/components/timesheet/TimesheetHeader.vue'
import StaffDaySheet from '@/components/timesheet/StaffDaySheet.vue'
import WeeklyKanbanView from '@/components/timesheet/WeeklyKanbanView.vue'
import CalendarGridView from '@/components/timesheet/CalendarGridView.vue'
import { useTimesheetStore } from '@/stores/timesheet'
import type { Staff, TimeEntry, Job } from '@/types/timesheet'

type ViewMode = 'staff-day' | 'weekly-kanban' | 'calendar-grid'

const route = useRoute()
const router = useRouter()
const timesheetStore = useTimesheetStore()

// Reactive state
const currentDate = ref(new Date())
const currentStaff = ref<Staff | null>(null)
const viewMode = ref<ViewMode>('staff-day')

// Computed data - using new store structure
const weekStart = computed(() => {
  const date = new Date(currentDate.value)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
  return new Date(date.setDate(diff))
})

const staffList = computed(() => timesheetStore.staff || [])
const availableJobs = computed(() => timesheetStore.jobs || [])

const currentDayEntries = computed(() => {
  if (!currentStaff.value) return []

  return timesheetStore.timeEntries.filter(entry =>
    entry.staffId === currentStaff.value?.id &&
    entry.timesheetDate === currentDate.value.toISOString().split('T')[0]
  )
})

const weeklyEntries = computed(() => {
  // Use current week data from store
  return timesheetStore.currentWeekData?.staffData || []
})

// Event handlers with guard clauses
const handleEntryUpdated = async (entry: TimeEntry) => {
  if (!entry.id) {
    console.error('Cannot update entry without ID')
    return
  }

  try {
    await timesheetStore.updateTimeEntry(entry.id, {
      description: entry.description,
      hours: entry.hours,
      isBillable: entry.isBillable,
      notes: entry.notes
    })
  } catch (error) {
    console.error('Failed to update entry:', error)
  }
}

const handleEntryCreated = async (entryData: {
  description: string
  jobPricingId: string
  hours: number
  isBillable: boolean
  notes?: string
}) => {
  if (!currentStaff.value) {
    console.error('No staff selected for creating entry')
    return
  }

  try {
    await timesheetStore.createTimeEntry(entryData)
  } catch (error) {
    console.error('Failed to create entry:', error)
  }
}

const handleEntryDeleted = async (entryId: string) => {
  if (!entryId) {
    console.error('Cannot delete entry without ID')
    return
  }

  try {
    await timesheetStore.deleteTimeEntry(entryId)
  } catch (error) {
    console.error('Failed to delete entry:', error)
  }
}

const handleEntryMoved = async (entryId: string, newDate: Date, newStaffId?: string) => {
  if (!entryId) {
    console.error('Cannot move entry without ID')
    return
  }

  // For now, just update the date
  try {
    await timesheetStore.updateTimeEntry(entryId, {
      // Note: Backend API needs to support date changes
    })
  } catch (error) {
    console.error('Failed to move entry:', error)
  }
}

// Job attachment handlers
const handleJobAttached = async (job: Job) => {
  try {
    console.log('Job attached to timesheet:', job.name)
    // Add job to attached jobs in timesheet store
    timesheetStore.addAttachedJob(job)
  } catch (error) {
    console.error('Failed to attach job:', error)
  }
}

const handleJobRemoved = async (jobId: string) => {
  try {
    console.log('Job removed from timesheet:', jobId)
    // Remove job from attached jobs in timesheet store
    timesheetStore.removeAttachedJob(jobId)
  } catch (error) {
    console.error('Failed to remove job:', error)
  }
}

const handleTimeEntryFromJob = async (staffId: string, jobId: string, date: Date) => {
  try {
    console.log('Creating time entry from job:', { staffId, jobId, date })
    // This event is triggered when a job is dropped onto a staff member
    // The actual time entry creation will be handled by the TimeEntryCreationModal
    // This handler can be used for logging or additional business logic
  } catch (error) {
    console.error('Failed to handle time entry from job:', error)
  }
}

const handleExportIMS = () => {
  // TODO: Implement IMS export
  console.log('IMS export for week starting:', weekStart.value)
}

const handlePreviousStaff = () => {
  if (staffList.value.length === 0) return

  const currentIndex = staffList.value.findIndex(s => s.id === currentStaff.value?.id)

  if (currentIndex > 0) {
    setCurrentStaff(staffList.value[currentIndex - 1])
  } else {
    setCurrentStaff(staffList.value[staffList.value.length - 1])
  }
}

const handleNextStaff = () => {
  if (staffList.value.length === 0) return

  const currentIndex = staffList.value.findIndex(s => s.id === currentStaff.value?.id)

  if (currentIndex < staffList.value.length - 1) {
    setCurrentStaff(staffList.value[currentIndex + 1])
  } else {
    setCurrentStaff(staffList.value[0])
  }
}

// Helper functions
const setCurrentStaff = (staff: Staff) => {
  currentStaff.value = staff
  timesheetStore.setSelectedStaff(staff.id)
}

const setCurrentDate = (date: Date) => {
  currentDate.value = date
  timesheetStore.setSelectedDate(date.toISOString().split('T')[0])
}

// Initialization with proper error handling
onMounted(async () => {
  try {
    // Initialize store with data
    await timesheetStore.initialize()

    // Set staff from route params or default to first
    const staffId = route.params.staffId as string
    if (staffId && staffList.value.length > 0) {
      const staff = staffList.value.find(s => s.id === staffId)
      if (staff) {
        setCurrentStaff(staff)
      } else {
        setCurrentStaff(staffList.value[0])
      }
    } else if (staffList.value.length > 0) {
      setCurrentStaff(staffList.value[0])
    }

    // Set date from route params or default to today
    const dateParam = route.params.date as string
    if (dateParam) {
      setCurrentDate(new Date(dateParam))
    }

    // Set initial view mode
    timesheetStore.setCurrentView(viewMode.value)

  } catch (error) {
    console.error('Failed to initialize timesheet:', error)
  }
})

// Watch for route changes
watch(() => route.params, (newParams) => {
  if (newParams.staffId && staffList.value.length > 0) {
    const staff = staffList.value.find(s => s.id === newParams.staffId)
    if (staff) {
      setCurrentStaff(staff)
    }
  }

  if (newParams.date) {
    setCurrentDate(new Date(newParams.date as string))
  }
})

// Watch for view mode changes
watch(viewMode, (newMode) => {
  timesheetStore.setCurrentView(newMode)
})
</script>

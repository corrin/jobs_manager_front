<template>
  <AppLayout>
    <div class="h-screen flex flex-col">
      <!-- Main header with controls -->
      <TimesheetHeader 
        v-if="currentStaff" 
        v-model:current-date="currentDate" 
        v-model:current-staff="currentStaff"
        v-model:view-mode="viewMode" 
        :staff-list="staffList" 
        @previous-staff="handlePreviousStaff" 
        @next-staff="handleNextStaff" 
        class="flex-shrink-0" 
      />

      <!-- Main content area -->
      <div class="flex-1 min-h-0 p-4">
        <!-- Staff Day Sheet View -->
        <StaffDaySheet v-if="viewMode === 'staff-day' && currentStaff" :staff="currentStaff" :date="currentDate"
          :time-entries="currentDayEntries" :available-jobs="availableJobs" @entry-updated="handleEntryUpdated"
          @entry-created="handleEntryCreated" @entry-deleted="handleEntryDeleted" />

        <!-- Kanban Weekly View -->
        <WeeklyKanbanView v-else-if="viewMode === 'weekly-kanban'" :week-start="weekStart"
          :staff-entries="weeklyEntries" :staff-list="staffList" :available-jobs="availableJobs"
          :refresh-key="refreshTrigger"
          @entry-moved="handleEntryMoved" @entry-updated="handleEntryUpdated" @entry-created="handleEntryCreated"
          @job-attached="handleJobAttached" @job-removed="handleJobRemoved" @time-entry-from-job="handleTimeEntryFromJob" />

        <!-- Calendar Grid View -->
        <CalendarGridView 
          v-else-if="viewMode === 'calendar-grid'" 
          :week-start="weekStart"
          :staff-entries="weeklyEntries" 
          :staff-list="staffList" 
          :available-jobs="availableJobs"
          :refresh-key="refreshTrigger"
          :ims-export-mode="imsExportMode"
          @entry-moved="handleEntryMoved" 
          @entry-updated="handleEntryUpdated" 
          @entry-created="handleEntryCreated"
          @ims-toggle="handleImsToggle" 
        />
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
import { imsService, type IMSStaffData, type IMSExportData } from '@/services/ims.service'
import type { Staff, TimeEntry, Job, DayData } from '@/types/timesheet'

type ViewMode = 'staff-day' | 'weekly-kanban' | 'calendar-grid'

const route = useRoute()
const router = useRouter()
const timesheetStore = useTimesheetStore()

// Reactive state
const currentDate = ref(new Date())
const currentStaff = ref<Staff | null>(null)
const viewMode = ref<ViewMode>('staff-day')
const imsExportMode = ref(false)

// Force refresh trigger to ensure reactivity
const refreshTrigger = ref(0)
const forceRefresh = () => {
  refreshTrigger.value++
  console.log('🔄 Force refresh triggered:', refreshTrigger.value)
}

// Helper function to calculate IMS week start (Tuesday-Friday + next Monday)
const getIMSWeekStart = (date: Date) => {
  const d = new Date(date)
  const day = d.getDay() // 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
  
  if (day === 0) { // Sunday -> previous Tuesday (5 days back)
    d.setDate(d.getDate() - 5)
  } else if (day === 1) { // Monday -> previous Tuesday (6 days back)
    d.setDate(d.getDate() - 6)
  } else if (day >= 2 && day <= 5) { // Tuesday-Friday -> start of current IMS week (Tuesday)
    d.setDate(d.getDate() - (day - 2))
  } else if (day === 6) { // Saturday -> previous Tuesday (4 days back)
    d.setDate(d.getDate() - 4)
  }
  
  console.log(`🗓️ IMS Week calculation for ${date.toDateString()}:`)
  console.log(`   Input day: ${day} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]})`)
  console.log(`   Calculated IMS start: ${d.toDateString()}`)
  
  return d
}

// Computed data - using new store structure
const weekStart = computed(() => {
  if (imsExportMode.value) {
    // Use IMS week calculation (Tuesday-Friday + next Monday)
    return getIMSWeekStart(new Date(currentDate.value))
  } else {
    // Use normal week calculation (Monday-Friday)
    const date = new Date(currentDate.value)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
    return new Date(date.setDate(diff))
  }
})

const staffList = computed(() => timesheetStore.staff || [])
const availableJobs = computed(() => timesheetStore.jobs || [])

const currentDayEntries = computed(() => {
  // Include refreshTrigger to force reactivity
  refreshTrigger.value
  
  if (!currentStaff.value) return []

  return timesheetStore.timeEntries.filter(entry =>
    entry.staffId === currentStaff.value?.id &&
    entry.timesheetDate === currentDate.value.toISOString().split('T')[0]
  )
})

const weeklyEntries = computed(() => {
  // Include refreshTrigger to force reactivity
  refreshTrigger.value
  
  // Transform WeeklyOverviewData to WeeklyStaffData[] format
  const weekData = timesheetStore.currentWeekData
  if (!weekData || !weekData.staffData) {
    return []
  }

  return weekData.staffData.map(staffOverview => {
    // Create weeklyHours array for all 7 days
    const weeklyHours: DayData[] = []
    
    // Create days for the week (Monday to Sunday)
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart.value)
      dayDate.setDate(dayDate.getDate() + i)
      const dateStr = dayDate.toISOString().split('T')[0]
      
      // Get day data if it exists
      const dayData = staffOverview.days[dateStr] || {
        date: dateStr,
        entries: [],
        dailyTotal: 0
      }
      
      // Transform to DayData format
      const billableEntries = dayData.entries.filter(e => e.isBillable || e.billable)
      const nonBillableEntries = dayData.entries.filter(e => !e.isBillable && !e.billable)
      
      weeklyHours.push({
        date: dateStr,
        hours: dayData.dailyTotal || 0,
        billableHours: billableEntries.reduce((sum, e) => sum + (e.hours || 0), 0),
        nonBillableHours: nonBillableEntries.reduce((sum, e) => sum + (e.hours || 0), 0),
        status: dayData.dailyTotal > 0 ? 'Complete' : 'Empty',
        entries: dayData.entries || []
      })
    }
    
    const totalHours = staffOverview.weeklyTotal || 0
    const billableHours = weeklyHours.reduce((sum, day) => sum + day.billableHours, 0)
    
    return {
      staff: {
        id: staffOverview.staff.id,
        name: staffOverview.staff.name,
        firstName: staffOverview.staff.firstName || '',
        lastName: staffOverview.staff.lastName || '',
        email: '', // Add required email field
        wageRate: 32.0, // Default value
        avatarUrl: ''
      },
      weeklyHours,
      totalHours,
      billablePercentage: totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0,
      totalStandardHours: totalHours,
      totalOvertimeHours: 0,
      totalLeaveHours: 0
    }
  })
})

// Event handlers with guard clauses
const handleEntryUpdated = async (entry: TimeEntry) => {
  if (!entry.id) {
    console.error('Cannot update entry without ID')
    return
  }

  try {
    console.log('🔄 Updating time entry:', entry.id)
    
    await timesheetStore.updateTimeEntry(entry.id, {
      description: entry.description,
      hours: entry.hours,
      isBillable: entry.isBillable,
      notes: entry.notes
    })
    
    console.log('✅ Time entry updated successfully')
    
    // Force reload data to ensure updates appear in all views
    console.log('🔄 Refreshing data after update...')
    await timesheetStore.loadWeeklyOverview(weekStart.value.toISOString().split('T')[0])
    
    // Also refresh timesheet data if we're on staff-day view
    if (viewMode.value === 'staff-day') {
      await timesheetStore.loadTimeEntries()
    }
    
    // Trigger reactive update
    forceRefresh()
    
    console.log('✅ All data refreshed successfully')
  } catch (error) {
    console.error('❌ Failed to update entry:', error)
    throw error
  }
}

const handleEntryCreated = async (entryData: Omit<TimeEntry, 'id'>) => {
  try {
    console.log('Creating time entry from WeeklyKanbanView:', entryData)
    
    // Create the time entry through the store
    const newEntry = await timesheetStore.createTimeEntry({
      description: entryData.description,
      jobPricingId: entryData.jobPricingId,
      hours: entryData.hours,
      isBillable: entryData.isBillable,
      notes: entryData.notes || '',
      items: entryData.hoursSpent ? 1 : 0,
      minsPerItem: entryData.hoursSpent ? Math.round(entryData.hoursSpent * 60) : 0,
      wageRate: entryData.wageRate || 0,
      chargeOutRate: entryData.chargeOutRate || 0,
      rateMultiplier: entryData.rateMultiplier || 1.0
    })
    
    console.log('✅ Time entry created successfully:', newEntry)
    
    // Force refresh and reload weekly data to ensure the new entry appears in all views
    console.log('🔄 Refreshing weekly overview data...')
    await timesheetStore.loadWeeklyOverview(weekStart.value.toISOString().split('T')[0])
    
    // Also refresh timesheet data if we're on staff-day view
    if (viewMode.value === 'staff-day') {
      console.log('🔄 Refreshing staff day data...')
      await timesheetStore.loadTimeEntries()
    }
    
    // Trigger reactive update
    forceRefresh()
    
    console.log('✅ All data refreshed successfully')
  } catch (error) {
    console.error('❌ Failed to create entry:', error)
    throw error // Re-throw to let the UI handle the error
  }
}

const handleEntryDeleted = async (entryId: string) => {
  if (!entryId) {
    console.error('Cannot delete entry without ID')
    return
  }

  try {
    console.log('🗑️ Deleting time entry:', entryId)
    
    await timesheetStore.deleteTimeEntry(entryId)
    
    console.log('✅ Time entry deleted successfully')
    
    // Force reload data to ensure deletion is reflected in all views
    console.log('🔄 Refreshing data after deletion...')
    await timesheetStore.loadWeeklyOverview(weekStart.value.toISOString().split('T')[0])
    
    // Also refresh timesheet data if we're on staff-day view
    if (viewMode.value === 'staff-day') {
      await timesheetStore.loadTimeEntries()
    }
    
    // Trigger reactive update
    forceRefresh()
    
    console.log('✅ All data refreshed successfully')
  } catch (error) {
    console.error('❌ Failed to delete entry:', error)
    throw error
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

const handleImsToggle = async (enabled: boolean) => {
  console.log('🔄 IMS Export mode toggled:', enabled)
  
  // Update the local IMS export mode state
  imsExportMode.value = enabled
  
  if (enabled) {
    try {
      console.log('📊 Loading IMS data for week starting:', weekStart.value)
      
      // Load IMS data using the dedicated API endpoint
      const imsData = await imsService.exportToIMS(weekStart.value)
      console.log('✅ IMS data loaded:', imsData)
      
      // Transform IMS data to WeeklyStaffData format expected by CalendarGridView
      const transformedStaffData = imsData.staff_data.map((imsStaff: IMSStaffData) => {
        // Convert weekly_hours from IMS format to DayData format
        const weeklyHours = imsStaff.weekly_hours.map((imsDay: any) => ({
          date: imsDay.date,
          hours: imsDay.hours || 0,
          billableHours: imsDay.billable_hours || 0,
          nonBillableHours: (imsDay.hours || 0) - (imsDay.billable_hours || 0),
          status: imsDay.status || 'Empty' as const,
          overtime: imsDay.overtime || 0,
          leaveType: imsDay.leave_type as 'Annual' | 'Sick' | 'Other' | undefined,
          leaveHours: (imsDay.annual_leave_hours || 0) + (imsDay.sick_leave_hours || 0) + (imsDay.other_leave_hours || 0),
          entries: imsDay.entries?.map((entry: any) => ({
            id: entry.id,
            jobNumber: entry.jobNumber || entry.job_number,
            jobName: entry.jobName || entry.job_number,
            description: entry.description,
            hours: entry.hours,
            isBillable: entry.isBillable || entry.billable,
            billable: entry.billable,
            notes: entry.notes || '',
            staffId: imsStaff.staff_id,
            timesheetDate: imsDay.date,
            startTime: entry.start_time,
            endTime: entry.end_time,
            jobPricingId: entry.jobPricingId || '',
            hoursSpent: entry.hours,
            estimatedHours: entry.estimatedHours || 0,
            rateMultiplier: entry.rateMultiplier || 1.0
          })) || [],
          // Add IMS-specific fields directly to the day data
          standard_hours: imsDay.standard_hours || 0,
          time_and_half_hours: imsDay.time_and_half_hours || 0,
          double_time_hours: imsDay.double_time_hours || 0,
          annual_leave_hours: imsDay.annual_leave_hours || 0,
          sick_leave_hours: imsDay.sick_leave_hours || 0,
          other_leave_hours: imsDay.other_leave_hours || 0,
          leave_type: imsDay.leave_type
        }))
        
        return {
          staff: {
            id: imsStaff.staff_id,
            name: imsStaff.name,
            firstName: imsStaff.name.split(' ')[0] || '',
            lastName: imsStaff.name.split(' ').slice(1).join(' ') || '',
            email: '',
            avatarUrl: null
          },
          weeklyHours,
          totalHours: imsStaff.total_hours || 0,
          billablePercentage: imsStaff.billable_percentage || 0,
          totalStandardHours: imsStaff.total_standard_hours || 0,
          totalOvertimeHours: (imsStaff.total_time_and_half_hours || 0) + (imsStaff.total_double_time_hours || 0),
          totalLeaveHours: imsStaff.total_leave_hours || 0
        }
      })
      
      console.log('✅ IMS data transformed:', transformedStaffData)
      
      // Replace the current weekly entries with IMS data
      // This will be passed to CalendarGridView via props
      timesheetStore.currentWeekData = {
        startDate: weekStart.value.toISOString().split('T')[0],
        endDate: new Date(weekStart.value.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        staffData: transformedStaffData.map(staff => ({
          staff: staff.staff,
          weeklyTotal: staff.totalHours, // Add the required weeklyTotal property
          days: staff.weeklyHours.reduce((acc, day) => {
            acc[day.date] = {
              date: day.date,
              entries: day.entries,
              dailyTotal: day.hours
            }
            return acc
          }, {} as Record<string, { date: string; entries: TimeEntry[]; dailyTotal: number; }>)
        }))
      }
      
    } catch (error) {
      console.error('❌ Failed to load IMS data:', error)
    }
  } else {
    console.log('📋 Switching back to normal timesheet view')
    
    // Reload normal weekly overview data
    try {
      await timesheetStore.loadWeeklyOverview(weekStart.value.toISOString().split('T')[0])
      console.log('✅ Normal timesheet data reloaded')
    } catch (error) {
      console.error('❌ Failed to reload normal data:', error)
    }
  }
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

// Watch for week changes to refresh data
watch(weekStart, async (newWeekStart) => {
  if (newWeekStart) {
    console.log('📅 Week changed, refreshing data for:', newWeekStart.toISOString().split('T')[0])
    await timesheetStore.loadWeeklyOverview(newWeekStart.toISOString().split('T')[0])
    forceRefresh()
  }
})

// Watch for store data changes
watch(() => timesheetStore.currentWeekData, (newData) => {
  if (newData) {
    console.log('📊 Weekly data updated in store:', {
      staffCount: newData.staffData?.length || 0,
      startDate: newData.startDate,
      endDate: newData.endDate
    })
    forceRefresh()
  }
})
</script>

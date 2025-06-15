import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TimesheetService } from '@/services/timesheet.service'
import type { Staff, TimeEntry, Job, WeeklyOverviewData } from '@/types/timesheet'

export const useTimesheetStore = defineStore('timesheet', () => {
  // State
  const staff = ref<Staff[]>([])
  const jobs = ref<Job[]>([])
  const timeEntries = ref<TimeEntry[]>([])
  const currentWeekData = ref<WeeklyOverviewData | null>(null)
  const selectedDate = ref<string>(new Date().toISOString().split('T')[0])
  const selectedStaffId = ref<string>('')
  const currentView = ref<'staff-day' | 'weekly-kanban' | 'calendar-grid'>('staff-day')
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const currentStaff = computed(() =>
    staff.value.find(s => s.id === selectedStaffId.value) || null
  )

  const entriesForSelectedDate = computed(() =>
    timeEntries.value.filter(entry =>
      entry.timesheetDate === selectedDate.value &&
      entry.staffId === selectedStaffId.value
    )
  )

  const totalHoursForDate = computed(() =>
    entriesForSelectedDate.value.reduce((sum, entry) => sum + entry.hours, 0)
  )

  const billableHoursForDate = computed(() =>
    entriesForSelectedDate.value
      .filter(entry => entry.isBillable)
      .reduce((sum, entry) => sum + entry.hours, 0)
  )

  // Actions
  /**
   * Initialize the store with basic data
   */
  async function initialize() {
    await Promise.all([
      loadStaff(),
      loadJobs()
    ])

    // Set first staff member as default if none selected
    if (staff.value.length > 0 && !selectedStaffId.value) {
      selectedStaffId.value = staff.value[0].id
    }
  }

  /**
   * Load staff list from API
   */
  async function loadStaff() {
    loading.value = true
    error.value = null

    try {
      staff.value = await TimesheetService.getStaff()
    } catch (err) {
      error.value = 'Failed to load staff members'
      console.error('Error loading staff:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Load available jobs from API
   */
  async function loadJobs() {
    loading.value = true
    error.value = null

    try {
      jobs.value = await TimesheetService.getJobs()
    } catch (err) {
      error.value = 'Failed to load jobs'
      console.error('Error loading jobs:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Load time entries for current staff and date
   */
  async function loadTimeEntries() {
    if (!selectedStaffId.value) return

    loading.value = true
    error.value = null

    try {
      timeEntries.value = await TimesheetService.getTimeEntries(
        selectedStaffId.value,
        selectedDate.value
      )
    } catch (err) {
      error.value = 'Failed to load time entries'
      console.error('Error loading time entries:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Load weekly overview data
   */
  async function loadWeeklyOverview(startDate?: string) {
    loading.value = true
    error.value = null

    try {
      const weekStart = startDate || TimesheetService.getCurrentWeekRange().startDate
      currentWeekData.value = await TimesheetService.getWeeklyOverview(weekStart)
    } catch (err) {
      error.value = 'Failed to load weekly overview'
      console.error('Error loading weekly overview:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new time entry
   */
  async function createTimeEntry(entryData: {
    description: string
    jobPricingId: string
    hours: number
    isBillable: boolean
    notes?: string
    items?: number
    minsPerItem?: number
    wageRate?: number
    chargeOutRate?: number
    rateMultiplier?: number
  }) {
    if (!selectedStaffId.value) {
      throw new Error('No staff member selected')
    }

    loading.value = true
    error.value = null

    try {
      const newEntry = await TimesheetService.createTimeEntry({
        staffId: selectedStaffId.value,
        date: selectedDate.value,
        description: entryData.description,
        jobPricingId: entryData.jobPricingId,
        hours: entryData.hours,
        isBillable: entryData.isBillable,
        notes: entryData.notes || '',
        items: entryData.items || 0,
        minsPerItem: entryData.minsPerItem || 0,
        wageRate: entryData.wageRate || 0,
        chargeOutRate: entryData.chargeOutRate || 0,
        rateMultiplier: entryData.rateMultiplier || 1.0
      })

      // Add to local state
      timeEntries.value.push(newEntry)
      return newEntry
    } catch (err) {
      error.value = 'Failed to create time entry'
      console.error('Error creating time entry:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing time entry
   */
  async function updateTimeEntry(entryId: string, updates: {
    description?: string
    hours?: number
    isBillable?: boolean
    notes?: string
    items?: number
    minsPerItem?: number
    wageRate?: number
    chargeOutRate?: number
    rateMultiplier?: number
    jobPricingId?: string
  }) {
    loading.value = true
    error.value = null

    try {
      const updatedEntry = await TimesheetService.updateTimeEntry(entryId, updates)

      // Update local state
      const index = timeEntries.value.findIndex(e => e.id === entryId)
      if (index !== -1) {
        timeEntries.value[index] = updatedEntry
      }

      return updatedEntry
    } catch (err) {
      error.value = 'Failed to update time entry'
      console.error('Error updating time entry:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a time entry
   */
  async function deleteTimeEntry(entryId: string) {
    loading.value = true
    error.value = null

    try {
      await TimesheetService.deleteTimeEntry(entryId)

      // Remove from local state
      timeEntries.value = timeEntries.value.filter(e => e.id !== entryId)
    } catch (err) {
      error.value = 'Failed to delete time entry'
      console.error('Error deleting time entry:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Auto-save time entry changes
   */
  async function autosaveTimeEntry(entryId: string, updates: {
    description?: string
    hours?: number
    notes?: string
  }) {
    try {
      await TimesheetService.autosaveTimeEntry(entryId, updates)
    } catch (err) {
      console.error('Autosave failed:', err)
      // Don't show error to user for autosave failures
    }
  }

  /**
   * Set selected staff member
   */
  function setSelectedStaff(staffId: string) {
    selectedStaffId.value = staffId
    // Clear current entries and reload for new staff
    timeEntries.value = []
    loadTimeEntries()
  }

  /**
   * Set selected date
   */
  function setSelectedDate(date: string) {
    selectedDate.value = date
    // Reload entries for new date
    loadTimeEntries()
  }

  /**
   * Set current view mode
   */
  function setCurrentView(view: 'staff-day' | 'weekly-kanban' | 'calendar-grid') {
    currentView.value = view

    // Load appropriate data for the view
    if (view === 'weekly-kanban' || view === 'calendar-grid') {
      loadWeeklyOverview()
    } else {
      loadTimeEntries()
    }
  }

  /**
   * Clear error state
   */
  function clearError() {
    error.value = null
  }

  /**
   * Get formatted date for display
   */
  function formatDate(date: string): string {
    return TimesheetService.formatDate(date)
  }

  /**
   * Get formatted hours for display
   */
  function formatHours(hours: number): string {
    return TimesheetService.formatHours(hours)
  }

  return {
    // State
    staff,
    jobs,
    timeEntries,
    currentWeekData,
    selectedDate,
    selectedStaffId,
    currentView,
    loading,
    error,

    // Computed
    currentStaff,
    entriesForSelectedDate,
    totalHoursForDate,
    billableHoursForDate,

    // Actions
    initialize,
    loadStaff,
    loadJobs,
    loadTimeEntries,
    loadWeeklyOverview,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    autosaveTimeEntry,
    setSelectedStaff,
    setSelectedDate,
    setCurrentView,
    clearError,
    formatDate,
    formatHours
  }
})

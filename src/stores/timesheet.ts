import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchCostSet } from '@/services/costing.service'
import { costlineService } from '@/services/costline.service'
import { TimesheetService } from '@/services/timesheet.service'
import { CompanyDefaultsService } from '@/services/company-defaults.service'
import type { CostLine } from '@/types/costing.types'
import type { Staff, TimeEntry, Job, WeeklyOverviewData } from '@/types/timesheet.types'
import type { CostLineCreatePayload, CostLineUpdatePayload } from '@/services/costline.service'

export const useTimesheetStore = defineStore('timesheet', () => {
  // State - refactored to manage CostLine[] instead of legacy JobPricing
  const lines = ref<CostLine[]>([])
  const loading = ref(false)
  const jobId = ref<string | null>(null)
  const kind = ref<'estimate' | 'quote' | 'actual'>('actual')

  // Legacy state preserved for backward compatibility
  const staff = ref<Staff[]>([])
  const jobs = ref<Job[]>([])
  const timeEntries = ref<TimeEntry[]>([])
  const currentWeekData = ref<WeeklyOverviewData | null>(null)
  const selectedDate = ref<string>(new Date().toISOString().split('T')[0])
  const selectedStaffId = ref<string>('')
  const currentView = ref<'staff-day' | 'weekly-kanban' | 'calendar-grid'>('staff-day')
  const attachedJobs = ref<Job[]>([])
  const error = ref<string | null>(null)

  // Computed - refactored getters based on CostLine[]
  const currentStaff = computed(
    () => staff.value.find((s) => s.id === selectedStaffId.value) || null,
  )

  // New getters for CostLine management
  const byDate = computed(() => {
    if (!lines.value.length) return {} as Record<string, CostLine[]>

    return lines.value.reduce<Record<string, CostLine[]>>( // tipar explicitamente o reduce
      (groups, line) => {
        // Extract date from metadata or use current selected date
        const dateKey = String(line.meta?.date || selectedDate.value)

        if (!Object.prototype.hasOwnProperty.call(groups, dateKey)) {
          groups[dateKey] = []
        }

        groups[dateKey].push(line)
        return groups
      },
      {} as Record<string, CostLine[]>,
    )
  })

  const dailyTotals = computed(() => {
    if (!lines.value.length)
      return {} as Record<string, { hours: number; cost: number; revenue: number }>

    return Object.entries(byDate.value as Record<string, CostLine[]>).reduce(
      (
        totals: Record<string, { hours: number; cost: number; revenue: number }>,
        [date, dayLines],
      ) => {
        totals[date] = {
          hours: dayLines.reduce((sum, line) => {
            // For time entries, quantity representa horas
            return line.kind === 'time' ? sum + parseFloat(line.quantity) : sum
          }, 0),
          cost: dayLines.reduce((sum, line) => sum + line.total_cost, 0),
          revenue: dayLines.reduce((sum, line) => sum + line.total_rev, 0),
        }
        return totals
      },
      {} as Record<string, { hours: number; cost: number; revenue: number }>,
    )
  })

  // Legacy computed properties preserved for backward compatibility
  const entriesForSelectedDate = computed(() =>
    timeEntries.value.filter(
      (entry: TimeEntry) =>
        entry.timesheetDate === selectedDate.value && entry.staffId === selectedStaffId.value,
    ),
  )

  const totalHoursForDate = computed(() =>
    entriesForSelectedDate.value.reduce((sum: number, entry: TimeEntry) => sum + entry.hours, 0),
  )

  const billableHoursForDate = computed(() =>
    entriesForSelectedDate.value
      .filter((entry: TimeEntry) => entry.isBillable)
      .reduce((sum: number, entry: TimeEntry) => sum + entry.hours, 0),
  )

  // Actions - new CostLine management actions
  /**
   * Load cost lines for a specific job and kind
   */
  async function load(targetJobId: string, targetKind: 'estimate' | 'quote' | 'actual' = 'actual') {
    // Guard clause - early return if no job ID
    if (!targetJobId) {
      console.warn('Load called without jobId')
      return
    }

    loading.value = true
    error.value = null

    try {
      console.log(`Loading cost lines for job ${targetJobId}, kind: ${targetKind}`)

      const costSet = await fetchCostSet(targetJobId, targetKind)

      // Update state following reactive patterns
      lines.value = costSet.cost_lines
      jobId.value = targetJobId
      kind.value = targetKind

      console.log(`Loaded ${costSet.cost_lines.length} cost lines successfully`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cost lines'
      error.value = errorMessage
      console.error('Error loading cost lines:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Add a new cost line
   */
  async function addLine(payload: CostLineCreatePayload) {
    // Guard clause - ensure we have a job loaded
    if (!jobId.value) {
      throw new Error('No job loaded. Call load() first.')
    }

    loading.value = true
    error.value = null

    try {
      const newLine = await costlineService.createCostLine(jobId.value, kind.value, payload)

      // Reactive update - add to existing lines
      lines.value.push(newLine)

      console.log('Cost line added successfully:', newLine.id)
      return newLine
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add cost line'
      error.value = errorMessage
      console.error('Error adding cost line:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing cost line
   */
  async function updateLine(id: number, payload: CostLineUpdatePayload) {
    loading.value = true
    error.value = null

    try {
      const updatedLine = await costlineService.updateCostLine(id, payload)

      // Reactive update - find and replace the line
      const lineIndex = lines.value.findIndex((line) => line.id === id)

      if (lineIndex === -1) {
        throw new Error(`Cost line with ID ${id} not found in current state`)
      }

      // Update using Object.assign for reactivity
      Object.assign(lines.value[lineIndex], updatedLine)

      console.log('Cost line updated successfully:', id)
      return updatedLine
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cost line'
      error.value = errorMessage
      console.error('Error updating cost line:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a cost line
   */
  async function deleteLine(id: number) {
    loading.value = true
    error.value = null

    try {
      await costlineService.deleteCostLine(id)

      // Reactive update - filter out the deleted line
      lines.value = lines.value.filter((line) => line.id !== id)

      console.log('Cost line deleted successfully:', id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete cost line'
      error.value = errorMessage
      console.error('Error deleting cost line:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Legacy actions preserved for backward compatibility
  /**
   * Initialize the store with basic data
   */
  async function initialize() {
    await Promise.all([loadStaff(), loadJobs(), loadCompanyDefaults()])

    // Set first staff member as default if none selected
    if (staff.value.length > 0 && !selectedStaffId.value) {
      selectedStaffId.value = staff.value[0].id
    }
  }

  /**
   * Load company defaults
   */
  async function loadCompanyDefaults() {
    try {
      await CompanyDefaultsService.getDefaults()
    } catch (err) {
      console.error('Error loading company defaults:', err)
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
        selectedDate.value,
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
      console.log('📊 Loading weekly overview for:', weekStart)

      currentWeekData.value = await TimesheetService.getWeeklyOverview(weekStart)

      console.log('✅ Weekly overview loaded successfully:', {
        staffCount: currentWeekData.value?.staffData?.length || 0,
        startDate: currentWeekData.value?.startDate,
        endDate: currentWeekData.value?.endDate,
      })
    } catch (err) {
      error.value = 'Failed to load weekly overview'
      console.error('❌ Error loading weekly overview:', err)
      throw err
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
      console.log('📝 Creating new time entry:', entryData)

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
        rateMultiplier: entryData.rateMultiplier || 1.0,
      })

      console.log('✅ Time entry created in backend:', newEntry)

      // Add to local state only if not already present
      const existingIndex = timeEntries.value.findIndex((e: TimeEntry) => e.id === newEntry.id)
      if (existingIndex === -1) {
        timeEntries.value.push(newEntry)
        console.log('📝 Added new entry to local state')
      } else {
        timeEntries.value[existingIndex] = newEntry
        console.log('🔄 Updated existing entry in local state')
      }

      return newEntry
    } catch (err) {
      error.value = 'Failed to create time entry'
      console.error('❌ Error creating time entry:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing time entry
   */
  async function updateTimeEntry(
    entryId: string,
    updates: {
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
    },
  ) {
    loading.value = true
    error.value = null

    try {
      console.log('🔄 Updating time entry:', entryId, updates)

      const updatedEntry = await TimesheetService.updateTimeEntry(entryId, updates)

      console.log('✅ Time entry updated in backend:', updatedEntry)

      // Update local state
      const index = timeEntries.value.findIndex((e: TimeEntry) => e.id === entryId)
      if (index !== -1) {
        timeEntries.value[index] = updatedEntry
        console.log('🔄 Updated entry in local state')
      } else {
        // Entry not in local state, add it
        timeEntries.value.push(updatedEntry)
        console.log('📝 Added updated entry to local state')
      }

      return updatedEntry
    } catch (err) {
      error.value = 'Failed to update time entry'
      console.error('❌ Error updating time entry:', err)
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
      console.log('🗑️ Deleting time entry:', entryId)

      await TimesheetService.deleteTimeEntry(entryId)

      console.log('✅ Time entry deleted in backend')

      // Remove from local state
      const initialLength = timeEntries.value.length
      timeEntries.value = timeEntries.value.filter((e: TimeEntry) => e.id !== entryId)

      if (timeEntries.value.length < initialLength) {
        console.log('🗑️ Removed entry from local state')
      } else {
        console.log('⚠️ Entry not found in local state')
      }
    } catch (err) {
      error.value = 'Failed to delete time entry'
      console.error('❌ Error deleting time entry:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Auto-save time entry changes
   */
  async function autosaveTimeEntry(
    entryId: string,
    updates: {
      description?: string
      hours?: number
      notes?: string
    },
  ) {
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

  /**
   * Add a job to the attached jobs list for the timesheet
   */
  function addAttachedJob(job: Job) {
    // Check if job is already attached
    const existingIndex = attachedJobs.value.findIndex((j) => j.id === job.id)
    if (existingIndex === -1) {
      attachedJobs.value.push(job)
      console.log('Job attached to timesheet:', job.name)
    } else {
      console.log('Job already attached:', job.name)
    }
  }

  /**
   * Remove a job from the attached jobs list
   */
  function removeAttachedJob(jobId: string) {
    const index = attachedJobs.value.findIndex((j) => j.id === jobId)
    if (index !== -1) {
      const removedJob = attachedJobs.value[index]
      attachedJobs.value.splice(index, 1)
      console.log('Job removed from timesheet:', removedJob.name)
    } else {
      console.log('Job not found in attached jobs:', jobId)
    }
  }

  return {
    // State - CostLine management
    lines,
    jobId,
    kind,

    // State - Legacy timesheet management
    staff,
    jobs,
    timeEntries,
    currentWeekData,
    selectedDate,
    selectedStaffId,
    currentView,
    attachedJobs,
    loading,
    error,

    // Computed - CostLine getters
    byDate,
    dailyTotals,

    // Computed - Legacy timesheet getters
    currentStaff,
    entriesForSelectedDate,
    totalHoursForDate,
    billableHoursForDate,

    // Actions - CostLine management
    load,
    addLine,
    updateLine,
    deleteLine,

    // Actions - Legacy timesheet management
    initialize,
    loadStaff,
    loadJobs,
    loadCompanyDefaults,
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
    formatHours,
    addAttachedJob,
    removeAttachedJob,
  }
})

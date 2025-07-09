import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchCostSet } from '@/services/costing.service'
import { costlineService } from '@/services/costline.service'
import { TimesheetService } from '@/services/timesheet.service'
import { CompanyDefaultsService } from '@/services/company-defaults.service'
import type { CostLine } from '@/types/costing.types'
import type { Staff, Job, WeeklyOverviewData } from '@/types/timesheet.types'
import type { CostLineCreatePayload, CostLineUpdatePayload } from '@/services/costline.service'
import { debugLog } from '@/utils/debug'

export const useTimesheetStore = defineStore('timesheet', () => {
  const lines = ref<CostLine[]>([])
  const loading = ref(false)
  const jobId = ref<string | null>(null)
  const kind = ref<'estimate' | 'quote' | 'actual'>('actual')

  const staff = ref<Staff[]>([])
  const jobs = ref<Job[]>([])
  const currentWeekData = ref<WeeklyOverviewData | null>(null)
  const selectedDate = ref<string>(new Date().toISOString().split('T')[0])
  const selectedStaffId = ref<string>('')
  const currentView = ref<'staff-day' | 'weekly-kanban' | 'calendar-grid'>('staff-day')
  const attachedJobs = ref<Job[]>([])
  const error = ref<string | null>(null)

  const currentStaff = computed(
    () => staff.value.find((s) => s.id === selectedStaffId.value) || null,
  )

  const byDate = computed(() => {
    if (!lines.value.length) return {} as Record<string, CostLine[]>

    const groups: Record<string, CostLine[]> = {}
    for (const line of lines.value) {
      const dateKey = String(line.meta?.date || selectedDate.value)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(line)
    }
    return groups
  })

  const dailyTotals = computed(() => {
    if (!lines.value.length) return {}

    return Object.entries(byDate.value as Record<string, CostLine[]>).reduce(
      (totals, [date, dayLines]) => {
        totals[date] = {
          hours: dayLines.reduce((sum, line) => {
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

  // Time-based computed properties - using CostLine data
  const timeLinesForSelectedDate = computed(() =>
    lines.value.filter(
      (line: CostLine) =>
        line.kind === 'time' &&
        line.meta?.date === selectedDate.value &&
        line.meta?.staff_id === selectedStaffId.value,
    ),
  )

  const totalHoursForDate = computed(() =>
    timeLinesForSelectedDate.value.reduce(
      (sum: number, line: CostLine) => sum + parseFloat(line.quantity),
      0,
    ),
  )

  const billableHoursForDate = computed(() =>
    timeLinesForSelectedDate.value
      .filter((line: CostLine) => line.meta?.is_billable)
      .reduce((sum: number, line: CostLine) => sum + parseFloat(line.quantity), 0),
  )

  async function load(targetJobId: string, targetKind: 'estimate' | 'quote' | 'actual' = 'actual') {
    if (!targetJobId) {
      debugLog('Load called without jobId')
      return
    }

    loading.value = true
    error.value = null

    try {
      debugLog(`Loading cost lines for job ${targetJobId}, kind: ${targetKind}`)

      const costSet = await fetchCostSet(targetJobId, targetKind)

      lines.value = costSet.cost_lines
      jobId.value = targetJobId
      kind.value = targetKind

      debugLog(`Loaded ${costSet.cost_lines.length} cost lines successfully`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cost lines'
      error.value = errorMessage
      debugLog('Error loading cost lines:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addLine(payload: CostLineCreatePayload) {
    if (!jobId.value) {
      throw new Error('No job loaded. Call load() first.')
    }

    loading.value = true
    error.value = null

    try {
      const newLine = await costlineService.createCostLine(jobId.value, kind.value, payload)

      lines.value.push(newLine)

      debugLog('Cost line added successfully:', newLine.id)
      return newLine
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add cost line'
      error.value = errorMessage
      debugLog('Error adding cost line:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateLine(id: number, payload: CostLineUpdatePayload) {
    loading.value = true
    error.value = null

    try {
      const updatedLine = await costlineService.updateCostLine(id, payload)

      const lineIndex = lines.value.findIndex((line) => line.id === id)

      if (lineIndex === -1) {
        throw new Error(`Cost line with ID ${id} not found in current state`)
      }

      Object.assign(lines.value[lineIndex], updatedLine)

      debugLog('Cost line updated successfully:', id)
      return updatedLine
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cost line'
      error.value = errorMessage
      debugLog('Error updating cost line:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteLine(id: number) {
    loading.value = true
    error.value = null

    try {
      await costlineService.deleteCostLine(id)

      lines.value = lines.value.filter((line) => line.id !== id)

      debugLog('Cost line deleted successfully:', id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete cost line'
      error.value = errorMessage
      debugLog('Error deleting cost line:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function initialize() {
    await Promise.all([loadStaff(), loadJobs(), loadCompanyDefaults()])

    if (staff.value.length > 0 && !selectedStaffId.value) {
      selectedStaffId.value = staff.value[0].id
    }
  }

  async function loadCompanyDefaults() {
    try {
      await CompanyDefaultsService.getDefaults()
    } catch (err) {
      debugLog('Error loading company defaults:', err)
    }
  }

  async function loadStaff() {
    loading.value = true
    error.value = null

    try {
      staff.value = await TimesheetService.getStaff()
    } catch (err) {
      error.value = 'Failed to load staff members'
      debugLog('Error loading staff:', err)
    } finally {
      loading.value = false
    }
  }

  async function loadJobs() {
    loading.value = true
    error.value = null

    try {
      jobs.value = await TimesheetService.getJobs()
    } catch (err) {
      error.value = 'Failed to load jobs'
      debugLog('Error loading jobs:', err)
    } finally {
      loading.value = false
    }
  }

  async function loadTimeLines() {
    if (!selectedStaffId.value || !jobId.value) return

    loading.value = true
    error.value = null

    try {
      // Load cost lines for the current job and filter by staff/date
      await load(jobId.value, 'actual')
    } catch (err) {
      error.value = 'Failed to load time lines'
      debugLog('Error loading time lines:', err)
    } finally {
      loading.value = false
    }
  }

  async function loadWeeklyOverview(startDate?: string) {
    loading.value = true
    error.value = null

    try {
      const weekStart = startDate || TimesheetService.getCurrentWeekRange().startDate
      debugLog('📊 Loading weekly overview for:', weekStart)

      currentWeekData.value = await TimesheetService.getWeeklyOverview(weekStart)

      debugLog('✅ Weekly overview loaded successfully:', {
        staffCount: currentWeekData.value?.staffData?.length || 0,
        startDate: currentWeekData.value?.startDate,
        endDate: currentWeekData.value?.endDate,
      })
    } catch (err) {
      error.value = 'Failed to load weekly overview'
      debugLog('❌ Error loading weekly overview:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createTimeEntry(entryData: {
    description: string
    jobId: string
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
      debugLog('📝 Creating new time entry:', entryData)

      // Use CostLine service to create time entry
      const costLineData: CostLineCreatePayload = {
        job_id: entryData.jobId,
        kind: 'actual',
        line_type: 'time',
        description: entryData.description,
        quantity: entryData.hours,
        unit_cost: entryData.wageRate || 32.0,
        unit_rev: entryData.chargeOutRate || 105.0,
        meta: {
          staff_id: selectedStaffId.value,
          date: selectedDate.value,
          is_billable: entryData.isBillable,
          rate_multiplier: entryData.rateMultiplier || 1.0,
        },
      }

      const newCostLine = await costlineService.create(costLineData)

      if (newCostLine) {
        // Add to lines if we're viewing the same job
        if (jobId.value === entryData.jobId && kind.value === 'actual') {
          lines.value.push(newCostLine)
        }

        debugLog('✅ Time entry created successfully:', newCostLine)

        // Reload cost lines to get updated data
        await loadTimeLines()
      }
    } catch (err) {
      error.value = 'Failed to create time entry'
      debugLog('❌ Error creating time entry:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

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
      jobId?: string
    },
  ) {
    loading.value = true
    error.value = null

    try {
      debugLog('🔄 Updating time entry:', entryId, updates)

      // Use CostLine service to update time entry
      const updatePayload: CostLineUpdatePayload = {}

      if (updates.description !== undefined) updatePayload.description = updates.description
      if (updates.hours !== undefined) updatePayload.quantity = updates.hours
      if (updates.wageRate !== undefined) updatePayload.unit_cost = updates.wageRate
      if (updates.chargeOutRate !== undefined) updatePayload.unit_rev = updates.chargeOutRate

      if (updates.isBillable !== undefined || updates.rateMultiplier !== undefined) {
        // Need to preserve existing meta and update specific fields
        const existingLine = lines.value.find((line) => line.id === entryId)
        updatePayload.meta = {
          ...existingLine?.meta,
          ...(updates.isBillable !== undefined && { is_billable: updates.isBillable }),
          ...(updates.rateMultiplier !== undefined && { rate_multiplier: updates.rateMultiplier }),
        }
      }

      const updatedCostLine = await costlineService.update(entryId, updatePayload)

      if (updatedCostLine) {
        // Update in local state
        const index = lines.value.findIndex((line) => line.id === entryId)
        if (index !== -1) {
          lines.value[index] = updatedCostLine
        }

        debugLog('✅ Time entry updated successfully:', updatedCostLine)

        // Reload cost lines to get updated data
        await loadTimeLines()

        return updatedCostLine
      }
    } catch (err) {
      error.value = 'Failed to update time entry'
      debugLog('❌ Error updating time entry:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function setSelectedStaff(staffId: string) {
    selectedStaffId.value = staffId
    // Clear lines when changing staff
    lines.value = []
    loadTimeLines()
  }

  function setSelectedDate(date: string) {
    selectedDate.value = date
    loadTimeLines()
  }

  function setCurrentView(view: 'staff-day' | 'weekly-kanban' | 'calendar-grid') {
    currentView.value = view

    if (view === 'weekly-kanban' || view === 'calendar-grid') {
      loadWeeklyOverview()
    } else {
      loadTimeLines()
    }
  }

  function clearError() {
    error.value = null
  }

  function formatDate(date: string): string {
    return TimesheetService.formatDate(date)
  }

  function formatHours(hours: number): string {
    return TimesheetService.formatHours(hours)
  }

  function addAttachedJob(job: Job) {
    const existingIndex = attachedJobs.value.findIndex((j) => j.id === job.id)
    if (existingIndex === -1) {
      attachedJobs.value.push(job)
      debugLog('Job attached to timesheet:', job.name)
    } else {
      debugLog('Job already attached:', job.name)
    }
  }

  function removeAttachedJob(jobId: string) {
    const index = attachedJobs.value.findIndex((j) => j.id === jobId)
    if (index !== -1) {
      const removedJob = attachedJobs.value[index]
      attachedJobs.value.splice(index, 1)
      debugLog('Job removed from timesheet:', removedJob.name)
    } else {
      debugLog('Job not found in attached jobs:', jobId)
    }
  }

  return {
    lines,
    jobId,
    kind,

    staff,
    jobs,
    currentWeekData,
    selectedDate,
    selectedStaffId,
    currentView,
    attachedJobs,
    loading,
    error,

    byDate,
    dailyTotals,

    currentStaff,
    timeLinesForSelectedDate,
    totalHoursForDate,
    billableHoursForDate,

    load,
    addLine,
    updateLine,
    deleteLine,

    initialize,
    loadStaff,
    loadJobs,
    loadCompanyDefaults,
    loadTimeLines,
    loadWeeklyOverview,
    createTimeEntry,
    updateTimeEntry,
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

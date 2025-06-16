<template>
  <AppLayout>
    <!-- Compact Header with Navigation -->
    <div
      class="h-16 sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 backdrop-blur-md border-b border-blue-500/20 flex items-center px-6">
      <!-- Staff Navigation -->
      <div class="flex items-center space-x-4">
        <Avatar class="h-10 w-10 ring-2 ring-blue-500/30">
          <AvatarFallback class="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold">
            {{ getStaffInitials(currentStaff) }}
          </AvatarFallback>
        </Avatar>

        <div class="flex items-center space-x-2">
          <Button variant="ghost" size="sm" @click="navigateStaff(-1)" :disabled="!canNavigateStaff(-1)"
            class="text-white hover:bg-blue-500/20">
            <ChevronLeft class="h-4 w-4" />
          </Button>

          <Select v-model="selectedStaffId" @update:model-value="(value) => handleStaffChange(value as string)">
            <SelectTrigger class="w-48 bg-slate-800/50 border-blue-500/30 text-white">
              <SelectValue placeholder="Select staff..." />
            </SelectTrigger>
            <SelectContent class="bg-slate-800 border-blue-500/30">
              <SelectItem v-for="staff in staffList" :key="staff.id" :value="staff.id"
                class="text-white hover:bg-blue-500/20">
                {{ staff.firstName }} {{ staff.lastName }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" @click="navigateStaff(1)" :disabled="!canNavigateStaff(1)"
            class="text-white hover:bg-blue-500/20">
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <!-- Date Navigation -->
      <div class="flex items-center space-x-2 mx-6">
        <Button variant="ghost" size="sm" @click="navigateDate(-1)" class="text-white hover:bg-blue-500/20">
          <ChevronLeft class="h-4 w-4" />
        </Button>

        <div class="text-white font-semibold px-4 py-2 bg-slate-800/50 rounded-md border border-blue-500/30">
          {{ formatDisplayDate(currentDate) }}
        </div>

        <Button variant="ghost" size="sm" @click="navigateDate(1)" class="text-white hover:bg-blue-500/20">
          <ChevronRight class="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" @click="goToToday" class="text-white hover:bg-blue-500/20 ml-2">
          Today
        </Button>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-2 ml-auto">
        <div class="text-xs text-blue-200 mr-4">
          <span class="font-semibold">{{ todayStats.totalHours.toFixed(1) }}h</span> Total
        </div>

        <Button @click="addNewEntry" size="sm" variant="default"
          class="bg-blue-600 hover:bg-blue-700 text-white border-blue-500">
          <Plus class="h-4 w-4 mr-1" />
          Add Entry
        </Button>

        <Button @click="saveChanges" size="sm" variant="default" :disabled="!hasUnsavedChanges || loading"
          class="bg-green-600 hover:bg-green-700 text-white border-green-500">
          <Save class="h-4 w-4 mr-1" />
          {{ loading ? 'Saving...' : 'Save All' }}
        </Button>

        <Button @click="refreshData" variant="ghost" size="sm" :disabled="loading"
          class="text-white hover:bg-blue-500/20">
          <RefreshCw :class="['h-4 w-4', { 'animate-spin': loading }]" />
        </Button>

        <Button @click="showHelpModal = true" variant="ghost" size="sm" class="text-white hover:bg-blue-500/20">
          <HelpCircle class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p class="text-slate-600">Loading timesheet...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <AlertTriangle class="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-slate-900 mb-2">Error Loading Timesheet</h3>
          <p class="text-slate-600 mb-4">{{ error }}</p>
          <Button @click="reloadData" variant="outline">
            <RefreshCw class="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>

      <!-- AG Grid Container -->
      <div v-else class="flex-1 bg-white shadow-sm border border-slate-200 rounded-lg m-4 overflow-hidden">
        <div class="h-full">
          <AgGridVue ref="agGridRef" class="h-full ag-theme-custom" :columnDefs="columnDefs" :rowData="gridData"
            :gridOptions="gridOptions" @grid-ready="onGridReady" @cell-value-changed="onCellValueChanged" />
        </div>
      </div>

      <!-- Summary Footer -->
      <div class="h-16 bg-slate-50 border-t border-slate-200 flex items-center justify-between px-6">
        <div class="flex items-center space-x-6">
          <div class="flex items-center space-x-2">
            <Clock class="h-4 w-4 text-slate-500" />
            <span class="text-sm font-medium text-slate-700">
              Total: {{ todayStats.totalHours.toFixed(1) }}h
            </span>
          </div>

          <div class="flex items-center space-x-2">
            <DollarSign class="h-4 w-4 text-green-600" />
            <span class="text-sm font-medium text-slate-700">
              Bill: ${{ todayStats.totalBill.toFixed(2) }}
            </span>
          </div>

          <div class="flex items-center space-x-2">
            <TrendingUp class="h-4 w-4 text-blue-600" />
            <span class="text-sm font-medium text-slate-700">
              Entries: {{ todayStats.entryCount }}
            </span>
          </div>
        </div>

        <div v-if="hasUnsavedChanges" class="flex items-center space-x-2 text-amber-600">
          <AlertCircle class="h-4 w-4" />
          <span class="text-sm font-medium">Unsaved changes</span>
        </div>
      </div>
    </div>

    <!-- Help Modal -->
    <Dialog v-model:open="showHelpModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-sm text-slate-600">Add new entry</span>
            <kbd class="px-2 py-1 bg-slate-100 rounded text-xs">Ctrl+N</kbd>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-slate-600">Save changes</span>
            <kbd class="px-2 py-1 bg-slate-100 rounded text-xs">Ctrl+S</kbd>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-slate-600">Delete entry</span>
            <kbd class="px-2 py-1 bg-slate-100 rounded text-xs">Delete</kbd>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-slate-600">Navigate entries</span>
            <kbd class="px-2 py-1 bg-slate-100 rounded text-xs">Tab / Enter</kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </AppLayout>
</template>

<script setup lang="ts">
// DEPRECATED: Use apenas TimesheetEntryView.vue
// Este arquivo será removido em breve. Toda lógica e UI devem migrar para TimesheetEntryView.vue

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { AgGridVue } from 'ag-grid-vue3'
import type { GridReadyEvent, CellValueChangedEvent, RowDoubleClickedEvent, CellClickedEvent } from 'ag-grid-community'

// UI Components
import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Icons
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-vue-next'

import type { OptimizedTimeEntry } from '@/types/timesheet.types'
import type { Job, Staff } from '@/types/timesheet.types'
import type { CompanyDefaults } from '@/services/company-defaults.service'
import { useTimesheetEntryCalculations } from '@/composables/useTimesheetEntryCalculations'
import { useTimesheetEntryGrid } from '@/composables/useTimesheetEntryGrid'
import type { TimesheetEntry } from '@/types/timesheet.types'
import { useTimesheetStore } from '@/stores/timesheet'
import { CompanyDefaultsService } from '@/services/company-defaults.service'
import * as costlineService from '@/services/costline.service'

// Store and Router
const router = useRouter()
const route = useRoute()
const timesheetStore = useTimesheetStore()

// Reactive State
const loading = ref(false)
const error = ref<string | null>(null)
const showHelpModal = ref(false)
const agGridRef = ref()

// Get initial values - always use internal state as source of truth
const todayDate = new Date().toISOString().split('T')[0]
console.log('🗓️ Today is:', todayDate, 'Day of week:', new Date().getDay())
const currentDate = ref<string>(todayDate)
const selectedStaffId = ref<string>('')
const isInitializing = ref(true)

const staffList = ref<Staff[]>([])
const jobsList = ref<Job[]>([])
const timeEntries = ref<OptimizedTimeEntry[]>([])
const companyDefaults = ref<CompanyDefaults | null>(null)

// Computed Properties
const currentStaff = computed(() =>
  staffList.value.find(s => s.id === selectedStaffId.value) || null
)

const hasUnsavedChanges = ref(false)

// Summary calculations
const todayStats = computed(() => {
  const totalHours = timeEntries.value.reduce((sum: number, entry: OptimizedTimeEntry) => sum + entry.hours, 0)
  const totalBill = timeEntries.value.reduce((sum: number, entry: OptimizedTimeEntry) => sum + entry.bill, 0)
  const entryCount = timeEntries.value.length

  return {
    totalHours,
    totalBill,
    entryCount
  }
})

// Initialize composables - fix the computed call to use correct parameters
const calculations = useTimesheetEntryCalculations(companyDefaults)

const {
  gridData,
  columnDefs,
  gridOptions,
  setGridApi,
  loadData,
  addNewRow,
  getGridData
} = useTimesheetEntryGrid(
  companyDefaults,
  handleSaveEntry,
  handleDeleteEntry
)

// Navigation helpers
const canNavigateStaff = (direction: number): boolean => {
  if (!staffList.value.length) return false
  const currentIndex = staffList.value.findIndex(s => s.id === selectedStaffId.value)
  if (currentIndex === -1) return false

  const newIndex = currentIndex + direction
  return newIndex >= 0 && newIndex < staffList.value.length
}

const navigateStaff = (direction: number) => {
  if (!canNavigateStaff(direction)) return

  const currentIndex = staffList.value.findIndex(s => s.id === selectedStaffId.value)
  const newIndex = currentIndex + direction
  const newStaff = staffList.value[newIndex]

  if (newStaff) {
    selectedStaffId.value = newStaff.id
    updateRoute()
  }
}

const navigateDate = (direction: number) => {
  // Parse date as local timezone to avoid UTC conversion issues
  const parts = currentDate.value.split('-')
  const year = parseInt(parts[0])
  const month = parseInt(parts[1]) - 1 // Month is 0-indexed
  const day = parseInt(parts[2])

  const date = new Date(year, month, day)

  // Navigate to next/previous workday (skip weekends)
  do {
    date.setDate(date.getDate() + direction)
  } while (date.getDay() === 0 || date.getDay() === 6) // 0 = Sunday, 6 = Saturday

  // Format back to YYYY-MM-DD using local timezone
  const newYear = date.getFullYear()
  const newMonth = (date.getMonth() + 1).toString().padStart(2, '0')
  const newDay = date.getDate().toString().padStart(2, '0')

  currentDate.value = `${newYear}-${newMonth}-${newDay}`
  console.log('📅 Navigated to:', currentDate.value, 'Day of week:', date.getDay())
  updateRoute()
}

const goToToday = () => {
  const today = new Date()

  // If today is weekend, go to next Monday
  if (today.getDay() === 0) { // Sunday
    today.setDate(today.getDate() + 1)
  } else if (today.getDay() === 6) { // Saturday
    today.setDate(today.getDate() + 2)
  }

  // Format using local timezone to avoid UTC conversion
  const year = today.getFullYear()
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')

  currentDate.value = `${year}-${month}-${day}`
  console.log('📅 Going to today (or next workday):', currentDate.value)
  updateRoute()
}

// Route management
const updateRoute = () => {
  router.push({
    query: {
      date: currentDate.value,
      staffId: selectedStaffId.value
    }
  })
}

// Staff helpers
const getStaffInitials = (staff: Staff | null): string => {
  if (!staff) return 'U'
  const first = staff.firstName?.[0] || ''
  const last = staff.lastName?.[0] || ''
  return (first + last).toUpperCase() || 'U'
}

// Date formatting
const formatDisplayDate = (date: string): string => {
  // Parse date as local timezone to avoid UTC conversion issues
  const parts = date.split('-')
  const year = parseInt(parts[0])
  const month = parseInt(parts[1]) - 1 // Month is 0-indexed
  const day = parseInt(parts[2])

  const d = new Date(year, month, day)

  const formatted = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return formatted
}

function syncGridState() {
  console.log('🔄 Starting syncGridState...')

  // Use getGridData from the composable
  const gridData = getGridData()

  console.log('📋 Got grid data from composable:', gridData.length, 'entries')
  console.log('🔍 Raw grid data:', gridData.map(d => ({
    jobId: d.jobId,
    jobNumber: d.jobNumber,
    client: d.client,
    jobName: d.jobName,
    hours: d.hours,
    isEmptyRow: d.isEmptyRow,
    isNewRow: d.isNewRow
  })))

  // Update timeEntries with grid data (filter out empty rows and keep entries with jobId or jobNumber)
  timeEntries.value = gridData.filter(d => {
    const hasJob = d && !d.isEmptyRow && (d.jobId || d.jobNumber)
    console.log('🔍 Filtering entry:', {
      jobId: d?.jobId,
      jobNumber: d?.jobNumber,
      isEmptyRow: d?.isEmptyRow,
      hasJob
    })
    return hasJob
  }) as OptimizedTimeEntry[]

  console.log('✅ Synced grid state with timeEntries:', timeEntries.value.length, 'entries')
  console.log('📊 Synced entries detail:', timeEntries.value.map((e: OptimizedTimeEntry) => ({
    id: e.id,
    jobId: e.jobId,
    jobNumber: e.jobNumber,
    client: e.client,
    jobName: e.jobName,
    hours: e.hours
  })))
}

// Entry management handlers - using modern CostLine API
async function handleSaveEntry(entry: OptimizedTimeEntry): Promise<void> {
  try {
    loading.value = true

    console.log('🔄 Saving entry:', entry)
    console.log('🔍 Looking for job with jobId:', entry.jobId)
    console.log('🔍 Looking for job with jobNumber:', entry.jobNumber)
    console.log('🔍 Entry object keys:', Object.keys(entry))
    console.log('📋 Available jobs:', jobsList.value.map((j: Job) => ({ id: j.id, jobId: j.jobNumber, jobNumber: j.jobNumber })))

    // WORKAROUND: If jobId is empty but we have a jobNumber, find the job by jobNumber
    let targetJobId = entry.jobId
    if (!targetJobId && entry.jobNumber) {
      console.log('🔧 jobId is empty, searching by jobNumber:', entry.jobNumber)
      const jobByNumber = jobsList.value.find((j: Job) => j.jobNumber === entry.jobNumber)
      if (jobByNumber) {
        targetJobId = jobByNumber.id
        entry.jobId = targetJobId // Update the entry
        entry.client = jobByNumber.clientName || ''
        entry.jobName = jobByNumber.jobName || ''
        entry.chargeOutRate = jobByNumber.chargeOutRate || 0
        console.log('✅ Found job by number:', jobByNumber.jobNumber, 'id:', targetJobId)
      } else {
        console.error('❌ Job not found by jobNumber:', entry.jobNumber)
      }
    } else if (!targetJobId) {
      console.error('❌ Both jobId and jobNumber are empty!')
      console.error('Entry data:', entry)
    }


    // Convert to CostLine format
    const costLinePayload = {
      kind: 'time' as const,
      desc: entry.description,
      quantity: entry.hours.toString(),
      unit_cost: entry.wageRate.toString(),
      unit_rev: entry.chargeOutRate.toString(),
      meta: {
        category: 'Labour',
        staff_id: entry.staffId,
        date: entry.date, // Fixed: use 'date' not 'entry_date'
        is_billable: entry.billable,
        rate_multiplier: entry.rateMultiplier,
        job_id: targetJobId,
        job_number: entry.jobNumber,
        client: entry.client,
        job_name: entry.jobName
      }
    }

    console.log('📅 Saving entry with date:', entry.date)
    console.log('🏗️ CostLine payload:', costLinePayload)

    if (entry.id && typeof entry.id === 'number') {
      // Update existing CostLine
      const updatedLine = await costlineService.updateCostLine(entry.id, costLinePayload)
      console.log('✅ Entry updated successfully:', updatedLine.id)
    } else {
      // Create new CostLine - need to find job ID first
      const job = jobsList.value.find((j: Job) => j.id === targetJobId)
      if (!job) {
        console.error('❌ Job not found for jobId:', targetJobId)
        console.error('Available jobs:', jobsList.value)
        throw new Error('Job not found')
      }

      const newLine = await costlineService.createCostLine(job.id, 'actual', costLinePayload)
      entry.id = newLine.id
      console.log('✅ Entry created successfully:', newLine.id)
    }

    // Update local state
    const entryIndex = timeEntries.value.findIndex((e: OptimizedTimeEntry) => e === entry)
    if (entryIndex >= 0) {
      timeEntries.value[entryIndex] = { ...entry, isNewRow: false }
    } else {
      timeEntries.value.push({ ...entry, isNewRow: false })
    }

    hasUnsavedChanges.value = false

  } catch (err) {
    console.error('❌ Error saving entry:', err)
    error.value = 'Failed to save entry'
  } finally {
    loading.value = false
  }
}

async function handleDeleteEntry(id: number): Promise<void> {
  try {
    loading.value = true

    await costlineService.deleteCostLine(id)

    // Remove from local state
    timeEntries.value = timeEntries.value.filter((e: OptimizedTimeEntry) => e.id !== id)

    hasUnsavedChanges.value = false
    console.log('✅ Entry deleted successfully:', id)

  } catch (err) {
    console.error('❌ Error deleting entry:', err)
    error.value = 'Failed to delete entry'
  } finally {
    loading.value = false
  }
}

function handleCellValueChanged(event: CellValueChangedEvent) {
  const { data } = event

  // Recalculate wage and bill amounts
  if (['hours', 'rate', 'jobId'].includes(event.colDef.field || '')) {
    const job = jobsList.value.find((j: Job) => j.jobId === data.jobId)

    // Calculate wage with proper undefined check
    if (currentStaff.value?.wageRate !== undefined) {
      data.wage = calculations.calculateWage(data.hours, data.rate, currentStaff.value.wageRate)
    }

    // Calculate bill with proper parameters
    if (job && job.chargeOutRate !== undefined) {
      data.bill = calculations.calculateBill(data.hours, job.chargeOutRate, data.billable)
    }

    // Auto-populate job fields when job id changes
    if (event.colDef.field === 'jobId' && job) {
      data.client = job.clientName || ''
      data.jobName = job.jobName || job.name || ''
      data.chargeOutRate = job.chargeOutRate || 0
    }
  }

  // Mark as having changes
  hasUnsavedChanges.value = true
}

// AG Grid event handlers
function onGridReady(params: GridReadyEvent) {
  setGridApi(params.api)
}

function onCellValueChanged(event: CellValueChangedEvent) {
  handleCellValueChanged(event)
}

function onRowDoubleClicked(event: RowDoubleClickedEvent) {
  // Future: Open detailed edit modal
  console.log('Row double clicked:', event.data)
}

function onCellClicked(event: CellClickedEvent) {
  // Future: Handle cell-specific actions
  console.log('Cell clicked:', event.colDef.field, event.value)
}

// Action handlers
const addNewEntry = () => {
  // Use the grid's addNewRow function which handles everything properly
  addNewRow(selectedStaffId.value, currentDate.value)
  hasUnsavedChanges.value = true
}

const saveChanges = async () => {
  // Get changed entries and save them
  console.log('💾 Starting saveChanges...')
  console.log('🔍 agGridRef.value:', !!agGridRef.value)
  console.log('🔍 agGridRef.value?.api:', !!agGridRef.value?.api)

  syncGridState()
  const changedEntries = timeEntries.value.filter((entry: OptimizedTimeEntry) => entry.isNewRow || hasUnsavedChanges.value)

  console.log('📊 Found', changedEntries.length, 'changed entries to save')

  if (changedEntries.length === 0) {
    console.log('⚠️ No entries to save')
    return
  }

  for (const entry of changedEntries) {
    console.log('🔄 Saving entry:', entry)
    console.log('Call-stack: ', new Error().stack)
    console.log('Timestamp:', new Date().toISOString())
    await handleSaveEntry(entry)
  }
}

const reloadData = () => {
  error.value = null
  loadTimesheetData()
}

const refreshData = () => {
  reloadData()
}

// Staff change handler - fix type to accept string | null
const handleStaffChange = async (staffId: string | null) => {
  // Early return guard
  if (!staffId) {
    console.log('⏭️ Skipping staff change - no staffId provided')
    return
  }

  // Avoid setting the same staff again
  if (staffId === selectedStaffId.value) {
    console.log('⏭️ Skipping staff change - same staff selected')
    return
  }

  console.log('👤 Staff changed:', { from: selectedStaffId.value, to: staffId })

  selectedStaffId.value = staffId
  updateRoute()

  // Manual load - no watcher
  await loadTimesheetData()
}

// Main data loading function using modern CostLine system
const loadTimesheetData = async () => {
  // Debugging
  console.log('function loadTimesheetData called with:', {
    staffId: selectedStaffId.value,
    date: currentDate.value,
    isInitializing: isInitializing.value
  })

  console.log('Call-stack: ', new Error().stack)
  console.log('Timestamp:', new Date().toISOString())

  // Early return guard clauses
  if (!selectedStaffId.value) {
    console.log('⏭️ Skipping data load - no staff selected')
    return
  }

  if (!currentDate.value) {
    console.log('⏭️ Skipping data load - no date selected')
    return
  }

  try {
    loading.value = true
    error.value = null

    console.log('📊 Loading timesheet data for:', { staffId: selectedStaffId.value, date: currentDate.value })

    // Load timesheet entries using CostLine system
    const response = await costlineService.getTimesheetEntries(
      selectedStaffId.value,
      currentDate.value
    )

    console.log('📡 API Response:', response)
    console.log('📄 Cost lines from API:', response.cost_lines)
    console.log('📊 Number of cost lines:', response.cost_lines?.length || 0)

    // Convert CostLines to TimesheetEntry format
    timeEntries.value = response.cost_lines.map((line: any) => ({
      id: line.id,
      jobId: line.meta?.job_id || '',
      jobNumber: line.meta?.job_number || '',
      client: line.meta?.client || '',
      jobName: line.meta?.job_name || '',
      hours: parseFloat(line.quantity),
      billable: line.meta?.is_billable ?? true,
      description: line.desc,
      rate: getRateTypeFromMultiplier(line.meta?.rate_multiplier || 1.0),
      wage: line.total_cost,
      bill: line.total_rev,
      staffId: selectedStaffId.value,
      date: currentDate.value,
      wageRate: parseFloat(line.unit_cost),
      chargeOutRate: parseFloat(line.unit_rev),
      rateMultiplier: line.meta?.rate_multiplier || 1.0,
      isNewRow: false
    }))

    loadData(timeEntries.value, selectedStaffId.value)

    console.log(`✅ Loaded ${timeEntries.value.length} timesheet entries`)

  } catch (err) {
    console.error('❌ Error loading timesheet data:', err)
    error.value = 'Failed to load timesheet data'
  } finally {
    loading.value = false
  }
}

// Helper function to convert rate multiplier back to rate type
const getRateTypeFromMultiplier = (multiplier: number): string => {
  switch (multiplier) {
    case 1.0: return 'Ord'
    case 1.5: return '1.5'
    case 2.0: return '2.0'
    case 0.0: return 'Unpaid'
    default: return 'Ord'
  }
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'n':
        event.preventDefault()
        addNewEntry()
        break
      case 's':
        event.preventDefault()
        if (hasUnsavedChanges.value) {
          saveChanges()
        }
        break
    }
  }
}

// Lifecycle
onMounted(async () => {
  try {
    console.log('🚀 Initializing optimized timesheet...')

    // Load initial data
    await timesheetStore.initialize()
    await timesheetStore.loadStaff()
    await timesheetStore.loadJobs()

    companyDefaults.value = await CompanyDefaultsService.getDefaults()

    staffList.value = timesheetStore.staff
    jobsList.value = timesheetStore.jobs


    // Convert jobs to JobSelectionItem format for OptimizedJobCellEditor
    const convertedJobs = timesheetStore.jobs.map((job: Job) => ({
      id: job.id,
      job_number: job.jobNumber,
      name: job.jobName || job.name || '',
      client_name: job.clientName || '',
      charge_out_rate: job.chargeOutRate || 0,
      status: job.status || 'active',
      job_display_name: job.displayName || `${job.jobNumber} - ${job.jobName || job.name || ''}`
    }))

      // Set global jobs for OptimizedJobCellEditor
      ; (window as any).timesheetJobs = convertedJobs

    // Validate and set staff first
    let validStaffId = selectedStaffId.value
    if ((!validStaffId || !staffList.value.find((s: Staff) => s.id === validStaffId)) && staffList.value.length > 0) {
      validStaffId = staffList.value[0].id
      selectedStaffId.value = validStaffId
    }

    // Set current staff globally for calculations (using the validated staff ID)
    const currentStaffData = staffList.value.find((s: Staff) => s.id === validStaffId)
      ; (window as any).currentStaff = currentStaffData

      // Set company defaults globally for calculations
      ; (window as any).companyDefaults = companyDefaults.value

    console.log('📋 Available staff:', staffList.value.length)
    console.log('💼 Available jobs:', jobsList.value.length)
    console.log('🔧 Converted jobs for editor:', convertedJobs.length)
    console.log('👤 Current staff for calculations:', currentStaffData?.name, 'wage rate:', currentStaffData?.wageRate)
    console.log('💰 Company defaults for calculations:', companyDefaults.value)

    selectedStaffId.value = validStaffId
    isInitializing.value = false

    // Initial load after everything is set up
    console.log('📊 Starting initial data load...')
    await loadTimesheetData()

    // Add keyboard shortcuts
    window.addEventListener('keydown', handleKeydown)

    console.log('✅ Optimized timesheet initialized successfully')

  } catch (err) {
    console.error('❌ Error initializing optimized timesheet:', err)
    error.value = 'Failed to initialize timesheet'
  }
})

// Watchers - only watch for manual changes after initialization
watch([selectedStaffId, currentDate], async ([newStaffId, newDate], [oldStaffId, oldDate]) => {
  // Early return guards
  if (!newStaffId || !newDate) {
    console.log('⏭️ Skipping watcher - missing staffId or date')
    return
  }

  if (newStaffId === oldStaffId && newDate === oldDate) {
    console.log('⏭️ Skipping watcher - no actual change')
    return
  }

  if (isInitializing.value) {
    console.log('⏭️ Skipping watcher - still initializing')
    return
  }

  // Only load if this is a real change (not initial setup)
  // Check that we have previous values (indicating this isn't the first run)
  if (!oldStaffId || !oldDate) {
    console.log('⏭️ Skipping watcher - initial setup detected')
    return
  }

  console.log('📊 Loading data due to staff/date change:', { newStaffId, newDate, oldStaffId, oldDate })
  await loadTimesheetData()

}, { immediate: false })

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
:deep(.ag-theme-custom) {
  --ag-header-height: 40px;
  --ag-row-height: 35px;
  --ag-header-background-color: #181f2a;
  --ag-header-foreground-color: #f3f4f6;
  --ag-odd-row-background-color: rgb(248, 250, 252);
  --ag-row-hover-color: rgb(241, 245, 249);
  --ag-selected-row-background-color: rgb(219, 234, 254);
  --ag-border-color: rgb(226, 232, 240);
  --ag-font-size: 13px;
}

:deep(.ag-theme-custom .ag-header-cell) {
  font-weight: 700;
  background: var(--ag-header-background-color) !important;
  color: var(--ag-header-foreground-color) !important;
  border-bottom: 1.5px solid #334155;
}

:deep(.ag-theme-custom .ag-cell) {
  border-right: 1px solid var(--ag-border-color);
}

:deep(.ag-theme-custom .ag-row-selected) {
  border: 1px solid rgb(59, 130, 246);
}

kbd {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
}
</style>

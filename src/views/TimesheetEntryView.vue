<template>
  <AppLayout>
    <div
      class="bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 min-h-screen flex flex-col"
    >
      <div
        v-if="loading"
        class="sticky top-0 z-20 py-5 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 backdrop-blur-md border-b border-blue-500/20 flex items-center justify-center min-h-[120px]"
      >
        <div class="flex flex-col items-center w-full">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <span class="text-blue-100 text-sm">Loading timesheet data...</span>
        </div>
      </div>
      <div v-else class="flex-1 flex flex-col">
        <div class="block lg:hidden pt-4">
          <div
            class="flex items-center justify-between p-3 border-b border-blue-500/10 bg-slate-900/80"
          >
            <div class="flex items-center space-x-2">
              <Avatar class="h-8 w-8 ring-2 ring-blue-500/30">
                <AvatarFallback
                  class="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold text-xs"
                >
                  {{ getStaffInitials(currentStaff) }}
                </AvatarFallback>
              </Avatar>

              <div class="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  @click="navigateStaff(-1)"
                  :disabled="!canNavigateStaff(-1)"
                  class="h-7 w-7 p-0 text-white hover:bg-blue-500/20"
                >
                  <ChevronLeft class="h-3 w-3" />
                </Button>

                <Select
                  v-model="selectedStaffId"
                  @update:model-value="(value) => handleStaffChange(value as string)"
                >
                  <SelectTrigger
                    class="h-7 w-32 text-xs bg-slate-800/50 border-blue-500/30 text-white"
                  >
                    <SelectValue placeholder="Staff..." />
                  </SelectTrigger>
                  <SelectContent class="bg-slate-800 border-blue-500/30">
                    <SelectItem
                      v-for="staff in staffList"
                      :key="staff.id"
                      :value="staff.id"
                      class="text-white hover:bg-blue-500/20 text-xs"
                    >
                      {{ staff.firstName }} {{ staff.lastName }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="sm"
                  @click="navigateStaff(1)"
                  :disabled="!canNavigateStaff(1)"
                  class="h-7 w-7 p-0 text-white hover:bg-blue-500/20"
                >
                  <ChevronRight class="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div class="text-xs text-blue-200">
              <span class="font-semibold">{{ todayStats.totalHours.toFixed(1) }}h</span>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 bg-slate-900/80">
            <div class="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                @click="navigateDate(-1)"
                class="h-7 w-7 p-0 text-white hover:bg-blue-500/20"
              >
                <ChevronLeft class="h-3 w-3" />
              </Button>

              <div
                class="text-white font-medium text-xs px-2 py-1 bg-slate-800/50 rounded border border-blue-500/30"
              >
                {{ formatShortDate(currentDate) }}
              </div>

              <Button
                variant="ghost"
                size="sm"
                @click="navigateDate(1)"
                class="h-7 w-7 p-0 text-white hover:bg-blue-500/20"
              >
                <ChevronRight class="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                @click="goToToday"
                class="h-7 text-xs px-2 text-white hover:bg-blue-500/20"
              >
                Today
              </Button>
            </div>

            <div class="flex items-center space-x-1">
              <Button
                @click="addNewEntry"
                size="sm"
                variant="default"
                class="h-7 text-xs px-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
              >
                <Plus class="h-3 w-3" />
              </Button>

              <Button
                @click="saveChanges"
                size="sm"
                variant="default"
                :disabled="!hasUnsavedChanges || loading"
                class="h-7 text-xs px-2 bg-green-600 hover:bg-green-700 text-white border-green-500"
              >
                <Save class="h-3 w-3" />
              </Button>

              <Button
                @click="refreshData"
                variant="ghost"
                size="sm"
                :disabled="loading"
                class="h-7 w-7 p-0 text-white hover:bg-blue-500/20"
              >
                <RefreshCw :class="['h-3 w-3', { 'animate-spin': loading }]" />
              </Button>

              <Button
                @click="showHelpModal = true"
                variant="ghost"
                size="sm"
                class="h-7 w-7 p-0 text-white hover:bg-blue-500/20"
              >
                <HelpCircle class="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <div
          class="hidden lg:flex items-center h-16 px-6 pt-4 bg-slate-900/80 border-b border-blue-500/10"
        >
          <div class="flex items-center space-x-4">
            <Avatar class="h-10 w-10 ring-2 ring-blue-500/30">
              <AvatarFallback
                class="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold"
              >
                {{ getStaffInitials(currentStaff) }}
              </AvatarFallback>
            </Avatar>

            <div class="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                @click="navigateStaff(-1)"
                :disabled="!canNavigateStaff(-1)"
                class="text-white hover:bg-blue-500/20"
              >
                <ChevronLeft class="h-4 w-4" />
              </Button>

              <Select
                v-model="selectedStaffId"
                @update:model-value="(value) => handleStaffChange(value as string)"
              >
                <SelectTrigger class="w-48 bg-slate-800/50 border-blue-500/30 text-white">
                  <SelectValue placeholder="Select staff..." />
                </SelectTrigger>
                <SelectContent class="bg-slate-800 border-blue-500/30">
                  <SelectItem
                    v-for="staff in staffList"
                    :key="staff.id"
                    :value="staff.id"
                    class="text-white hover:bg-blue-500/20"
                  >
                    {{ staff.firstName }} {{ staff.lastName }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                @click="navigateStaff(1)"
                :disabled="!canNavigateStaff(1)"
                class="text-white hover:bg-blue-500/20"
              >
                <ChevronRight class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div class="flex items-center space-x-2 mx-6">
            <Button
              variant="ghost"
              size="sm"
              @click="navigateDate(-1)"
              class="text-white hover:bg-blue-500/20"
            >
              <ChevronLeft class="h-4 w-4" />
            </Button>

            <div
              class="text-white font-semibold px-4 py-2 bg-slate-800/50 rounded-md border border-blue-500/30"
            >
              {{ formatDisplayDate(currentDate) }}
            </div>

            <Button
              variant="ghost"
              size="sm"
              @click="navigateDate(1)"
              class="text-white hover:bg-blue-500/20"
            >
              <ChevronRight class="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              @click="goToToday"
              class="text-white hover:bg-blue-500/20 ml-2"
            >
              Today
            </Button>
          </div>

          <div class="flex items-center space-x-2 ml-auto">
            <div class="text-xs text-blue-200 mr-4">
              <span class="font-semibold">{{ todayStats.totalHours.toFixed(1) }}h</span> Total
            </div>

            <Button
              @click="addNewEntry"
              size="sm"
              variant="default"
              class="bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
            >
              <Plus class="h-4 w-4 mr-1" />
              Add Entry
            </Button>

            <Button
              @click="saveChanges"
              size="sm"
              variant="default"
              :disabled="!hasUnsavedChanges || loading"
              class="bg-green-600 hover:bg-green-700 text-white border-green-500"
            >
              <Save class="h-4 w-4 mr-1" />
              {{ loading ? 'Saving...' : 'Save All' }}
            </Button>

            <Button
              @click="refreshData"
              variant="ghost"
              size="sm"
              :disabled="loading"
              class="text-white hover:bg-blue-500/20"
            >
              <RefreshCw :class="['h-4 w-4', { 'animate-spin': loading }]" />
            </Button>

            <Button
              @click="showHelpModal = true"
              variant="ghost"
              size="sm"
              class="text-white hover:bg-blue-500/20"
            >
              <HelpCircle class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          class="flex-1 flex flex-col overflow-hidden"
          :class="'h-[calc(100vh-6rem)] lg:h-[calc(100vh-4rem)]'"
        >
          <div
            v-if="loading"
            class="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900"
          >
            <div class="text-center">
              <div
                class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"
              ></div>
              <p class="text-blue-100 text-sm lg:text-base">Loading timesheet...</p>
            </div>
          </div>

          <div v-else-if="error" class="flex-1 flex items-center justify-center">
            <div class="text-center px-4">
              <AlertTriangle class="h-8 w-8 lg:h-12 lg:w-12 text-red-500 mx-auto mb-4" />
              <h3 class="text-base lg:text-lg font-semibold text-slate-900 mb-2">
                Error Loading Timesheet
              </h3>
              <p class="text-sm lg:text-base text-slate-600 mb-4">{{ error }}</p>
              <Button @click="reloadData" variant="outline" size="sm">
                <RefreshCw class="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>

          <div
            v-else
            class="flex-1 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 shadow-sm border border-blue-900/20 rounded-lg m-2 lg:m-4 overflow-hidden"
          >
            <div class="h-full">
              <AgGridVue
                ref="agGridRef"
                class="h-full ag-theme-custom ag-theme-responsive"
                :columnDefs="columnDefs"
                :rowData="gridData"
                :gridOptions="gridOptions"
                @grid-ready="onGridReady"
                @cell-value-changed="onCellValueChanged"
                @first-data-rendered="onFirstDataRendered"
              />
            </div>
          </div>

          <div class="bg-slate-900/80 border-t border-blue-900/30 p-2 lg:hidden">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-1">
                  <Clock class="h-3 w-3 text-slate-500" />
                  <span class="font-medium text-slate-700">
                    {{ todayStats.totalHours.toFixed(1) }}h
                  </span>
                </div>

                <div class="flex items-center space-x-1">
                  <DollarSign class="h-3 w-3 text-green-600" />
                  <span class="font-medium text-slate-700">
                    ${{ todayStats.totalBill.toFixed(0) }}
                  </span>
                </div>

                <div class="flex items-center space-x-1">
                  <TrendingUp class="h-3 w-3 text-blue-600" />
                  <span class="font-medium text-slate-700">
                    {{ todayStats.entryCount }}
                  </span>
                </div>
              </div>

              <div v-if="hasUnsavedChanges" class="flex items-center space-x-1 text-amber-600">
                <AlertCircle class="h-3 w-3" />
                <span class="font-medium">Unsaved</span>
              </div>
            </div>
          </div>

          <div
            class="hidden lg:flex h-16 bg-slate-900/80 border-t border-blue-900/30 items-center justify-between px-6"
          >
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
            <div v-if="hasUnsavedChanges" class="flex items-center space-x-2 text-amber-400">
              <AlertCircle class="h-4 w-4" />
              <span class="text-sm font-medium">Unsaved changes</span>
            </div>
          </div>
        </div>

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
      </div>
    </div>
  </AppLayout>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { AgGridVue } from 'ag-grid-vue3'
import type { GridReadyEvent, CellValueChangedEvent } from 'ag-grid-community'
import { v4 as uuidv4 } from 'uuid'

import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
  AlertCircle,
} from 'lucide-vue-next'

import type { OptimizedTimeEntry } from '@/types/timesheet.types'
import type { Job, Staff } from '@/types/timesheet.types'
import type { CompanyDefaults } from '@/services/company-defaults.service'
import { useTimesheetEntryGrid } from '@/composables/useTimesheetEntryGrid'
import { useTimesheetStore } from '@/stores/timesheet'
import { CompanyDefaultsService } from '@/services/company-defaults.service'
import * as costlineService from '@/services/costline.service'
import type { CostLine } from '@/types/costing.types'

const router = useRouter()
const route = useRoute()
const timesheetStore = useTimesheetStore()

const loading = ref(false)
const error = ref<string | null>(null)
const showHelpModal = ref(false)
const agGridRef = ref()

const todayDate = new Date().toISOString().split('T')[0]
console.log('🗓️ Today is:', todayDate, 'Day of week:', new Date().getDay())

const initialDate = (route.query.date as string) || todayDate
const initialStaffId = (route.query.staffId as string) || ''

console.log('🔗 URL params:', { date: route.query.date, staffId: route.query.staffId })
console.log('📊 Using initial values:', { date: initialDate, staffId: initialStaffId })

const currentDate = ref<string>(initialDate)
const selectedStaffId = ref<string>(initialStaffId)
const isInitializing = ref(true)

const staffList = ref<Staff[]>([])
const jobsList = ref<Job[]>([])
const timeEntries = ref<TimesheetEntryWithMeta[]>([])
const companyDefaults = ref<CompanyDefaults | null>(null)

const currentStaff = computed(
  () => staffList.value.find((s) => s.id === selectedStaffId.value) || null,
)

const hasUnsavedChanges = ref(false)

const todayStats = computed(() => {
  const totalHours = timeEntries.value.reduce(
    (sum: number, entry: OptimizedTimeEntry) => sum + entry.hours,
    0,
  )
  const totalBill = timeEntries.value.reduce(
    (sum: number, entry: OptimizedTimeEntry) => sum + entry.bill,
    0,
  )
  const entryCount = timeEntries.value.length

  return {
    totalHours,
    totalBill,
    entryCount,
  }
})

const {
  gridData,
  columnDefs,
  gridOptions,
  setGridApi,
  loadData,
  getGridData,
  handleKeyboardShortcut,
  handleCellValueChanged: gridHandleCellValueChanged,
} = useTimesheetEntryGrid(companyDefaults, handleSaveEntry, handleDeleteEntry)

const canNavigateStaff = (direction: number): boolean => {
  if (!staffList.value.length) return false
  const currentIndex = staffList.value.findIndex((s) => s.id === selectedStaffId.value)
  if (currentIndex === -1) return false

  const newIndex = currentIndex + direction
  return newIndex >= 0 && newIndex < staffList.value.length
}

const navigateStaff = (direction: number) => {
  if (!canNavigateStaff(direction)) return

  const currentIndex = staffList.value.findIndex((s) => s.id === selectedStaffId.value)
  const newIndex = currentIndex + direction
  const newStaff = staffList.value[newIndex]

  if (newStaff) {
    selectedStaffId.value = newStaff.id
    updateRoute()
  }
}

const navigateDate = (direction: number) => {
  const parts = currentDate.value.split('-')
  const year = parseInt(parts[0])
  const month = parseInt(parts[1]) - 1
  const day = parseInt(parts[2])

  const date = new Date(year, month, day)

  do {
    date.setDate(date.getDate() + direction)
  } while (date.getDay() === 0 || date.getDay() === 6)

  const newYear = date.getFullYear()
  const newMonth = (date.getMonth() + 1).toString().padStart(2, '0')
  const newDay = date.getDate().toString().padStart(2, '0')

  currentDate.value = `${newYear}-${newMonth}-${newDay}`
  console.log('📅 Navigated to:', currentDate.value, 'Day of week:', date.getDay())
  updateRoute()
}

const goToToday = () => {
  const today = new Date()

  if (today.getDay() === 0) {
    today.setDate(today.getDate() + 1)
  } else if (today.getDay() === 6) {
    today.setDate(today.getDate() + 2)
  }

  const year = today.getFullYear()
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')

  currentDate.value = `${year}-${month}-${day}`
  console.log('📅 Going to today (or next workday):', currentDate.value)
  updateRoute()
}

const updateRoute = () => {
  router.push({
    query: {
      date: currentDate.value,
      staffId: selectedStaffId.value,
    },
  })
}

const getStaffInitials = (staff: Staff | null): string => {
  if (!staff) return 'U'
  const first = staff.firstName?.[0] || ''
  const last = staff.lastName?.[0] || ''
  return (first + last).toUpperCase() || 'U'
}

const formatDisplayDate = (date: string): string => {
  const parts = date.split('-')
  const year = parseInt(parts[0])
  const month = parseInt(parts[1]) - 1
  const day = parseInt(parts[2])

  const d = new Date(year, month, day)

  const formatted = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return formatted
}

const formatShortDate = (date: string): string => {
  const parts = date.split('-')
  const year = parseInt(parts[0])
  const month = parseInt(parts[1]) - 1
  const day = parseInt(parts[2])

  const d = new Date(year, month, day)

  const formatted = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return formatted
}

function syncGridState() {
  console.log('🔄 Starting syncGridState...')

  const gridData = getGridData()

  console.log('📋 Got grid data from composable:', gridData.length, 'entries')
  console.log(
    '🔍 Raw grid data:',
    gridData.map((d) => ({
      jobId: d.jobId,
      jobNumber: d.jobNumber,
      client: d.client,
      jobName: d.jobName,
      hours: d.hours,
      isEmptyRow: d.isEmptyRow,
      isNewRow: d.isNewRow,
    })),
  )

  timeEntries.value = gridData.filter((d) => {
    const hasJob = d && !d.isEmptyRow && (d.jobId || d.jobNumber)
    console.log('🔍 Filtering entry:', {
      jobId: d?.jobId,
      jobNumber: d?.jobNumber,
      isEmptyRow: d?.isEmptyRow,
      hasJob,
    })
    return hasJob
  }) as OptimizedTimeEntry[]

  console.log('✅ Synced grid state with timeEntries:', timeEntries.value.length, 'entries')
  console.log(
    '📊 Synced entries detail:',
    timeEntries.value.map((e: OptimizedTimeEntry) => ({
      id: e.id,
      jobId: e.jobId,
      jobNumber: e.jobNumber,
      client: e.client,
      jobName: e.jobName,
      hours: e.hours,
    })),
  )
}

interface TimesheetEntryWithMeta extends OptimizedTimeEntry {
  _isSaving?: boolean
  tempId?: string
}

async function handleSaveEntry(entry: TimesheetEntryWithMeta): Promise<void> {
  const hasJob = entry.jobId || entry.jobNumber
  const hasDescription = entry.description && entry.description.trim().length > 0
  const hasHours = entry.hours > 0
  if (!hasJob || !hasDescription || !hasHours) {
    return
  }

  if (entry._isSaving) return

  try {
    loading.value = true
    entry._isSaving = true

    if (!entry.id && !entry.tempId) {
      entry.tempId = uuidv4()
    }

    const staffId = selectedStaffId.value
    const date = currentDate.value

    let targetJobId = entry.jobId
    if (!targetJobId && entry.jobNumber) {
      const jobByNumber = jobsList.value.find((j: Job) => j.jobNumber === entry.jobNumber)
      if (jobByNumber) {
        targetJobId = jobByNumber.id
        entry.jobId = targetJobId
        entry.client = jobByNumber.clientName || ''
        entry.jobName = jobByNumber.jobName || ''
        entry.chargeOutRate = jobByNumber.chargeOutRate || 0
      }
    }

    const costLinePayload = {
      kind: 'time' as const,
      desc: entry.description,
      quantity: entry.hours.toString(),
      unit_cost: entry.wageRate.toString(),
      unit_rev: entry.chargeOutRate.toString(),
      meta: {
        staff_id: staffId,
        date: date,
        is_billable: entry.billable,
        rate_multiplier: entry.rateMultiplier,
        created_from_timesheet: true,
      },
    }

    let savedLine
    if (entry.id && typeof entry.id === 'number') {
      savedLine = await costlineService.updateCostLine(entry.id, costLinePayload)
    } else {
      const job = jobsList.value.find((j: Job) => j.id === targetJobId)
      if (!job) throw new Error('Job not found')
      savedLine = await costlineService.createCostLine(job.id, 'actual', costLinePayload)
      entry.id = savedLine.id
      delete entry.tempId
    }

    const entryIndex = timeEntries.value.findIndex((e: TimesheetEntryWithMeta) => {
      if (entry.id && e.id === entry.id) return true
      if (entry.tempId && e.tempId === entry.tempId) return true
      return false
    })
    if (entryIndex >= 0) {
      timeEntries.value[entryIndex] = { ...entry, ...savedLine, isNewRow: false, isModified: false }
    } else {
      timeEntries.value.push({ ...entry, ...savedLine, isNewRow: false, isModified: false })
    }
  } catch (err) {
    console.error('❌ Error saving entry:', err)
    error.value = 'Failed to save entry'
  } finally {
    loading.value = false
    entry._isSaving = false
  }
}

async function handleDeleteEntry(id: number): Promise<void> {
  try {
    loading.value = true

    await costlineService.deleteCostLine(id)

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
  console.log('🔧 TimesheetEntryView handleCellValueChanged called:', {
    field: event.colDef.field,
    newValue: event.newValue,
    oldValue: event.oldValue,
  })

  gridHandleCellValueChanged(event)

  // Marcar a entrada como modificada para qualquer alteração
  if (event.data && typeof event.data === 'object') {
    event.data.isModified = true
  }

  hasUnsavedChanges.value = true
}

function onGridReady(params: GridReadyEvent) {
  setGridApi(params.api)
}

function onCellValueChanged(event: CellValueChangedEvent) {
  handleCellValueChanged(event)
}

function onFirstDataRendered() {
  setTimeout(() => agGridRef.value?.api?.sizeColumnsToFit(), 100)
}

const addNewEntry = () => {
  console.log('➕ Adding new entry for staff:', selectedStaffId.value)

  hasUnsavedChanges.value = true
}

const saveChanges = async () => {
  console.log('💾 Starting saveChanges...')
  console.log('🔍 agGridRef.value:', !!agGridRef.value)
  console.log('🔍 agGridRef.value?.api:', !!agGridRef.value?.api)

  syncGridState()

  const changedEntries = timeEntries.value.filter(
    (entry: OptimizedTimeEntry) => entry.isNewRow || entry.isModified,
  )

  console.log('📊 Found', changedEntries.length, 'changed entries to save')
  console.log(
    '🔍 Changed entries details:',
    changedEntries.map((e) => ({
      id: e.id,
      isNewRow: e.isNewRow,
      isModified: e.isModified,
      description: e.description,
      hours: e.hours,
    })),
  )

  if (changedEntries.length === 0) {
    console.log('⚠️ No entries to save')
    return
  }

  const invalidEntries = changedEntries.filter((entry) => {
    const hasJob = entry.jobId || entry.jobNumber
    const hasDescription = entry.description && entry.description.trim().length > 0
    const hasHours = entry.hours > 0

    return !hasJob || !hasDescription || !hasHours
  })

  if (invalidEntries.length > 0) {
    console.log('❌ Found invalid entries:', invalidEntries)
    const missingFields = invalidEntries
      .map((entry) => {
        const missing = []
        if (!entry.jobId && !entry.jobNumber) missing.push('Job')
        if (!entry.description || !entry.description.trim()) missing.push('Description')
        if (entry.hours <= 0) missing.push('Hours')
        return `Entry ${entry.id || 'new'}: Missing ${missing.join(', ')}`
      })
      .join('\n')

    error.value = `Cannot save entries with missing required fields:\n${missingFields}`
    return
  }

  for (const entry of changedEntries) {
    console.log('🔄 Saving entry:', {
      id: entry.id,
      isNewRow: entry.isNewRow,
      isModified: entry.isModified,
      description: entry.description,
    })
    console.log('Call-stack: ', new Error().stack)
    console.log('Timestamp:', new Date().toISOString())
    await handleSaveEntry(entry)

    entry.isModified = false
  }

  hasUnsavedChanges.value = false
}

const reloadData = () => {
  error.value = null
  loadTimesheetData()
}

const refreshData = () => {
  reloadData()
}

const handleStaffChange = async (staffId: string | null) => {
  if (!staffId) {
    console.log('⏭️ Skipping staff change - no staffId provided')
    return
  }

  if (staffId === selectedStaffId.value) {
    console.log('⏭️ Skipping staff change - same staff selected')
    return
  }

  console.log('👤 Staff changed:', { from: selectedStaffId.value, to: staffId })

  selectedStaffId.value = staffId
  updateRoute()

  await loadTimesheetData()
}

const loadTimesheetData = async () => {
  console.log('function loadTimesheetData called with:', {
    staffId: selectedStaffId.value,
    date: currentDate.value,
    isInitializing: isInitializing.value,
  })

  console.log('Call-stack: ', new Error().stack)
  console.log('Timestamp:', new Date().toISOString())

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

    console.log('📊 Loading timesheet data for:', {
      staffId: selectedStaffId.value,
      date: currentDate.value,
    })

    const response = await costlineService.getTimesheetEntries(
      selectedStaffId.value,
      currentDate.value,
    )

    console.log('📡 API Response:', response)
    console.log('📄 Cost lines from API:', response.cost_lines)
    console.log('📊 Number of cost lines:', response.cost_lines?.length || 0)

    interface BackendCostLine extends CostLine {
      job_id?: string
      job_number?: string
      client_name?: string
      job_name?: string
      charge_out_rate?: number
    }

    timeEntries.value = response.cost_lines.map((line: BackendCostLine) => ({
      id: line.id,
      jobId: line.job_id || '',
      jobNumber: line.job_number || '',
      client: line.client_name || '',
      jobName: line.job_name || '',
      hours: parseFloat(line.quantity),
      billable: typeof line.meta?.is_billable === 'boolean' ? line.meta.is_billable : true,
      description: line.desc,
      rate: getRateTypeFromMultiplier(
        typeof line.meta?.rate_multiplier === 'number' ? line.meta.rate_multiplier : 1.0,
      ),
      wage: line.total_cost,
      bill: line.total_rev,
      staffId: selectedStaffId.value,
      date: currentDate.value,
      wageRate: parseFloat(line.unit_cost),
      chargeOutRate:
        typeof line.charge_out_rate === 'number' ? line.charge_out_rate : parseFloat(line.unit_rev),
      rateMultiplier:
        typeof line.meta?.rate_multiplier === 'number' ? line.meta.rate_multiplier : 1.0,
      isNewRow: false,
      isModified: false,
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

const getRateTypeFromMultiplier = (multiplier: number): string => {
  switch (multiplier) {
    case 1.0:
      return 'Ord'
    case 1.5:
      return '1.5'
    case 2.0:
      return '2.0'
    case 0.0:
      return 'Unpaid'
    default:
      return 'Ord'
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
    return
  }

  if (handleKeyboardShortcut(event, selectedStaffId.value)) {
    return
  }

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

  if (event.shiftKey && event.key === 'N') {
    event.preventDefault()
    event.stopPropagation()
    console.log('🎯 Shift+N pressed - adding new entry')
    addNewEntry()
  }
}

onMounted(async () => {
  try {
    loading.value = true

    console.log('🚀 Initializing optimized timesheet...')

    await timesheetStore.initialize()
    await timesheetStore.loadStaff()
    await timesheetStore.loadJobs()

    companyDefaults.value = await CompanyDefaultsService.getDefaults()

    staffList.value = timesheetStore.staff
    jobsList.value = timesheetStore.jobs

    const convertedJobs = timesheetStore.jobs.map((job: Job) => ({
      id: job.id,
      job_number: job.jobNumber,
      name: job.jobName || job.name || '',
      client_name: job.clientName || '',
      charge_out_rate: job.chargeOutRate || 0,
      status: job.status || 'active',
      job_display_name: job.displayName || `${job.jobNumber} - ${job.jobName || job.name || ''}`,
    }))

    window.timesheetJobs = convertedJobs

    let validStaffId = selectedStaffId.value

    if (
      (!validStaffId || !staffList.value.find((s: Staff) => s.id === validStaffId)) &&
      staffList.value.length > 0
    ) {
      validStaffId = staffList.value[0].id
      console.log('📋 No valid staff from URL, using first available:', validStaffId)
    } else if (validStaffId && staffList.value.find((s: Staff) => s.id === validStaffId)) {
      console.log('👤 Using staff from URL parameters:', validStaffId)
    }

    selectedStaffId.value = validStaffId

    const currentStaffData = staffList.value.find((s: Staff) => s.id === validStaffId)
    window.currentStaff = currentStaffData

    window.companyDefaults = companyDefaults.value

    console.log('📋 Available staff:', staffList.value.length)
    console.log('💼 Available jobs:', jobsList.value.length)
    console.log('🔧 Converted jobs for editor:', convertedJobs.length)
    console.log(
      '👤 Current staff for calculations:',
      currentStaffData?.name,
      'wage rate:',
      currentStaffData?.wageRate,
    )
    console.log('💰 Company defaults for calculations:', companyDefaults.value)

    updateRoute()

    isInitializing.value = false

    console.log('📊 Starting initial data load...')
    await loadTimesheetData()

    window.addEventListener('keydown', handleKeydown)

    console.log('✅ Optimized timesheet initialized successfully')
  } catch (err) {
    console.error('❌ Error initializing optimized timesheet:', err)
    error.value = 'Failed to initialize timesheet'
  }
})

watch(
  [selectedStaffId, currentDate],
  async ([newStaffId, newDate], [oldStaffId, oldDate]) => {
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

    if (!oldStaffId || !oldDate) {
      console.log('⏭️ Skipping watcher - initial setup detected')
      return
    }

    console.log('📊 Loading data due to staff/date change:', {
      newStaffId,
      newDate,
      oldStaffId,
      oldDate,
    })
    await loadTimesheetData()
  },
  { immediate: false },
)

watch(
  () => route.query,
  (newQuery, oldQuery) => {
    if (isInitializing.value) {
      console.log('⏭️ Skipping URL watcher - still initializing')
      return
    }

    console.log('🔗 URL query changed:', { old: oldQuery, new: newQuery })

    let hasChanges = false

    if (newQuery.date && newQuery.date !== currentDate.value) {
      console.log('📅 Updating date from URL:', newQuery.date)
      currentDate.value = newQuery.date as string
      hasChanges = true
    }

    if (newQuery.staffId && newQuery.staffId !== selectedStaffId.value) {
      const staffExists = staffList.value.find((s: Staff) => s.id === newQuery.staffId)
      if (staffExists) {
        console.log('👤 Updating staff from URL:', newQuery.staffId)
        selectedStaffId.value = newQuery.staffId as string
        hasChanges = true
      } else {
        console.warn('⚠️ Staff ID from URL not found:', newQuery.staffId)
      }
    }

    if (hasChanges) {
      console.log('🔄 Reloading data due to URL changes')
      loadTimesheetData()
    }
  },
  { immediate: false },
)

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

declare global {
  interface Window {
    timesheetJobs?: unknown
    currentStaff?: unknown
    companyDefaults: import('@/types/timesheet.types').CompanyDefaults | null
  }
}
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

@media (max-width: 1024px) {
  :deep(.ag-theme-custom) {
    --ag-header-height: 36px;
    --ag-row-height: 32px;
    --ag-font-size: 12px;
  }

  :deep(.ag-theme-custom .ag-header-cell) {
    padding: 0 4px;
  }

  :deep(.ag-theme-custom .ag-cell) {
    padding: 0 4px;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='client_name']),
  :deep(.ag-theme-custom .ag-cell[col-id='client_name']) {
    display: none;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='rate']),
  :deep(.ag-theme-custom .ag-cell[col-id='rate']) {
    display: none;
  }
}

@media (max-width: 640px) {
  :deep(.ag-theme-custom) {
    --ag-header-height: 32px;
    --ag-row-height: 28px;
    --ag-font-size: 11px;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='job_name']),
  :deep(.ag-theme-custom .ag-cell[col-id='job_name']) {
    display: none;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='wage']),
  :deep(.ag-theme-custom .ag-cell[col-id='wage']) {
    display: none;
  }
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

:deep(.ag-theme-custom .ag-body-horizontal-scroll) {
  height: 14px !important;
}

:deep(.ag-theme-custom .ag-body-vertical-scroll) {
  width: 14px !important;
}

kbd {
  font-family:
    ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
}
</style>

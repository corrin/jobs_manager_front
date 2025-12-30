<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
} from '@/components/ui/drawer'
import { api } from '@/api/client'
import { schemas } from '@/api/generated/api'
import axios from '@/plugins/axios'
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Pencil,
  Ban,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from 'lucide-vue-next'
import CalendarView, { useCalendarStore, type CalendarEvent } from '@kodeglot/vue-calendar'
import '@kodeglot/vue-calendar/style.css'
import dayjs from 'dayjs'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { toast } from 'vue-sonner'
import type { z } from 'zod'

type WorkshopTimesheetEntry = z.infer<typeof schemas.WorkshopTimesheetEntry>
type WorkshopTimesheetSummary = z.infer<typeof schemas.WorkshopTimesheetSummary>
type JobsListResponse = z.infer<typeof schemas.JobsListResponse>
type CalendarViewEventModalRef = {
  openModal?: (date: Date) => void
  openEditModal?: (event: Record<string, unknown>) => void
  closeModal?: () => void
  __workshopSuppressed?: boolean
  [key: string]: unknown
}
type CalendarViewInstance = (ComponentPublicInstance & { $refs?: Record<string, unknown> }) | null

const selectedDate = ref(formatDateKey(new Date()))
const isDayLoading = ref(false)
const isSubmitting = ref(false)
const editingEntryId = ref<string | null>(null)
const isFormOpen = ref(false)
const isJobPickerOpen = ref(false)
const jobSearch = ref('')

const formState = reactive({
  jobId: '',
  startTime: '',
  endTime: '',
  description: '',
  isBillable: true,
  rateMultiplier: 'Ord',
})

const jobs = ref<JobsListResponse['jobs']>([])
const dailyData = ref<
  Record<
    string,
    {
      entries: WorkshopTimesheetEntry[]
      summary: WorkshopTimesheetSummary | null
      loading?: boolean
    }
  >
>({})
const calendarStore = useCalendarStore()
const trackedCalendarEventIds = ref<Set<string>>(new Set())
const DEFAULT_SLOT_MINUTES = 30
const calendarViewRef = ref<CalendarViewInstance>(null)
let calendarModalSuppressionFrame: number | null = null

const selectedEntries = computed(() => dailyData.value[selectedDate.value]?.entries ?? [])
const filteredJobs = computed(() => {
  const term = jobSearch.value.trim().toLowerCase()
  if (!term) return jobs.value
  return jobs.value.filter((job) => {
    const number = String(job.job_number).toLowerCase()
    const name = (job.name || '').toLowerCase()
    const client = (job.client_name || '').toLowerCase()
    return number.includes(term) || name.includes(term) || client.includes(term)
  })
})
const selectedDaySummary = computed(() => {
  const day = dailyData.value[selectedDate.value]
  if (!day) return { jobs: 0, hours: 0 }
  return {
    jobs: new Set(day.entries.map((e) => e.job_id)).size,
    hours: day.summary?.total_hours ?? 0,
  }
})
const requiresLegacyFallback = computed(() =>
  selectedEntries.value.some((entry) => !entry.start_time || !entry.end_time),
)
const calendarEventPayloads = computed<CalendarEvent[]>(() =>
  selectedEntries.value
    .filter((entry) => entry.start_time && entry.end_time)
    .map((entry) => toCalendarEvent(entry)),
)
const formDurationHours = computed(() =>
  calculateDurationHours(formState.startTime, formState.endTime),
)

function formatDateKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function parseDateKey(key: string): Date {
  return new Date(`${key}T00:00:00`)
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-AU', { weekday: 'long', month: 'short', day: 'numeric' })
}

function ensureTimeWithSeconds(time: string): string {
  if (!time) return '00:00:00'
  return time.length === 5 ? `${time}:00` : time
}

function formatTimeInputValue(time?: string | null): string {
  if (!time) return ''
  return time.slice(0, 5)
}

function minutesFromTime(time: string): number {
  if (!time) return 0
  const [hours, minutes] = ensureTimeWithSeconds(time)
    .split(':')
    .map((value) => Number(value) || 0)
  const result = hours * 60 + minutes
  return Math.min(Math.max(result, 0), 24 * 60 - 1)
}

function minutesToTime(minutes: number): string {
  const clamped = Math.min(Math.max(minutes, 0), 24 * 60 - 1)
  const hours = Math.floor(clamped / 60)
  const mins = clamped % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

function normalizeTimeRange(startTime: string, endTime: string) {
  const startMinutes = minutesFromTime(startTime || '00:00')
  let endMinutes = minutesFromTime(endTime || '00:00')
  if (endMinutes <= startMinutes) {
    endMinutes = Math.min(startMinutes + DEFAULT_SLOT_MINUTES, 24 * 60 - 1)
  }
  return {
    start: minutesToTime(startMinutes),
    end: minutesToTime(endMinutes),
  }
}

function combineDateTime(dateKey: string, time: string): Date {
  return new Date(`${dateKey}T${ensureTimeWithSeconds(time)}`)
}

function calculateDurationHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0
  const start = dayjs(`1970-01-01T${ensureTimeWithSeconds(startTime)}`)
  const end = dayjs(`1970-01-01T${ensureTimeWithSeconds(endTime)}`)
  const minutes = end.diff(start, 'minute', true)
  if (Number.isNaN(minutes) || minutes <= 0) return 0
  return Math.round((minutes / 60) * 100) / 100
}

function formatEventTitle(entry: WorkshopTimesheetEntry): string {
  const jobNumber = entry.job_number ? `#${entry.job_number}` : ''
  const jobName = entry.job_name || 'Job'
  const duration =
    calculateDurationHours(
      formatTimeInputValue(entry.start_time),
      formatTimeInputValue(entry.end_time),
    ) ||
    entry.hours ||
    0
  const durationLabel = duration ? `${duration.toFixed(2)}h` : ''
  return [jobNumber, jobName, durationLabel ? `(${durationLabel})` : ''].filter(Boolean).join(' ')
}

function defaultTimeRange(startTime?: string) {
  const start = startTime || '08:00'
  const end = minutesToTime(minutesFromTime(start) + DEFAULT_SLOT_MINUTES)
  return normalizeTimeRange(start, end)
}

function toCalendarEvent(entry: WorkshopTimesheetEntry): CalendarEvent {
  const dateKey = entry.accounting_date || selectedDate.value
  const startIso = combineDateTime(dateKey, entry.start_time ?? '00:00').toISOString()
  const endIso = combineDateTime(dateKey, entry.end_time ?? '00:00').toISOString()
  return {
    id: entry.id,
    title: formatEventTitle(entry),
    start: startIso,
    end: endIso,
    tailwindColor: 'sky',
    metadata: {
      entryId: entry.id,
      jobId: entry.job_id,
    },
  }
}

function setRangeToNow() {
  const now = dayjs()
  const time = minutesToTime(now.hour() * 60 + now.minute())
  const defaultRange = defaultTimeRange(time)
  applyTimeRange(defaultRange.start, defaultRange.end)
}

function adjustRangeBy(minutesDelta: number) {
  if (!formState.startTime || !formState.endTime) return
  const normalized = normalizeTimeRange(formState.startTime, formState.endTime)
  const start = minutesFromTime(normalized.start)
  let end = minutesFromTime(normalized.end) + minutesDelta
  if (end <= start) {
    end = Math.min(start + 1, 24 * 60 - 1)
  }
  applyTimeRange(normalized.start, minutesToTime(end))
}

function fillGapToNextEntry() {
  if (!formState.startTime) return
  const startMinutes = minutesFromTime(formState.startTime)
  const nextEntry = selectedEntries.value
    .filter((entry) => entry.start_time)
    .map((entry) => minutesFromTime(formatTimeInputValue(entry.start_time)))
    .filter((minutes) => minutes > startMinutes)
    .sort((a, b) => a - b)[0]

  if (typeof nextEntry === 'number') {
    applyTimeRange(formState.startTime, minutesToTime(nextEntry))
  } else {
    applyTimeRange(formState.startTime, '23:59')
  }
}

function resetToDefaultRange() {
  const defaults = defaultTimeRange()
  applyTimeRange(defaults.start, defaults.end)
}

function rateLabelFromMultiplier(multiplier?: number | null): string {
  if (!multiplier || multiplier === 1) return 'Ord'
  const rounded = Math.round(multiplier * 10) / 10
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)}.0` : rounded.toFixed(1)
}

function displayRate(multiplier?: number | null): string {
  const label = rateLabelFromMultiplier(multiplier)
  if (label.toLowerCase() === 'ord') return 'Ord'
  return `${label}x`
}

function multiplierValue(label: string): number {
  if (label.toLowerCase() === 'ord') return 1
  const parsed = Number(label)
  return Number.isFinite(parsed) ? parsed : 1
}

function safeRateMultiplier(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function resetForm() {
  editingEntryId.value = null
  formState.jobId = ''
  formState.startTime = ''
  formState.endTime = ''
  formState.description = ''
  formState.isBillable = true
  formState.rateMultiplier = 'Ord'
}

function applyTimeRange(startTime: string, endTime: string) {
  const normalized = normalizeTimeRange(startTime, endTime)
  formState.startTime = normalized.start
  formState.endTime = normalized.end
}

function openCreateForm(range?: { start?: string; end?: string }) {
  resetForm()
  const defaults = defaultTimeRange(range?.start)
  const startValue = range?.start ?? defaults.start
  const endValue = range?.end ?? defaults.end
  applyTimeRange(startValue, endValue)
  isFormOpen.value = true
}

function openEditForm(entry: WorkshopTimesheetEntry) {
  editingEntryId.value = entry.id
  formState.jobId = entry.job_id
  const fallbackRange = defaultTimeRange()
  const startValue = formatTimeInputValue(entry.start_time) || fallbackRange.start
  const fallbackMinutes = Math.max(entry.hours || 0.5, 0.25) * 60
  const computedEnd = minutesToTime(minutesFromTime(startValue) + Math.round(fallbackMinutes))
  applyTimeRange(
    formatTimeInputValue(entry.start_time) || fallbackRange.start,
    formatTimeInputValue(entry.end_time) || computedEnd,
  )
  formState.description = entry.description ?? ''
  formState.isBillable = entry.is_billable
  formState.rateMultiplier = rateLabelFromMultiplier(safeRateMultiplier(entry.rate_multiplier))
  isFormOpen.value = true
}

async function submitForm() {
  if (!selectedDate.value) return
  if (!formState.startTime || !formState.endTime) {
    toast.error('Please choose a start and end time.')
    return
  }
  const hours = calculateDurationHours(formState.startTime, formState.endTime)
  if (!hours || hours < 0.01) {
    toast.error('Duration must be at least 1 minute.')
    return
  }
  if (!formState.jobId) {
    toast.error('Please select a job before saving.')
    return
  }

  const payload = {
    job_id: formState.jobId,
    accounting_date: selectedDate.value,
    start_time: ensureTimeWithSeconds(formState.startTime),
    end_time: ensureTimeWithSeconds(formState.endTime),
    hours,
    description: formState.description || '',
    is_billable: formState.isBillable,
    rate_multiplier: multiplierValue(formState.rateMultiplier),
  }

  try {
    isSubmitting.value = true
    isDayLoading.value = true
    if (editingEntryId.value) {
      await api.job_api_workshop_timesheets_partial_update({
        entry_id: editingEntryId.value,
        ...payload,
      })
    } else {
      await api.job_api_workshop_timesheets_create(payload)
    }
    toast.success('Time saved.')
    resetForm()
    isFormOpen.value = false
    await loadDay(selectedDate.value)
  } catch (error) {
    console.error('Failed to save workshop timesheet entry', error)
    toast.error('Failed to save entry.')
  } finally {
    isSubmitting.value = false
    isDayLoading.value = false
  }
}

async function handleDeleteEntry(id: string): Promise<void> {
  if (!id) return
  try {
    isDayLoading.value = true
    await axios.delete('/job/api/workshop/timesheets/', { data: { entry_id: id } })
    toast.success('Entry deleted.')
    await loadDay(selectedDate.value)
  } catch (error) {
    console.error('Failed to delete workshop timesheet entry', error)
    toast.error('Failed to delete entry.')
  } finally {
    isDayLoading.value = false
  }
}

async function deleteEntryFromDrawer() {
  if (!editingEntryId.value) return
  await handleDeleteEntry(editingEntryId.value)
  resetForm()
  isFormOpen.value = false
}

async function loadJobs() {
  try {
    const response = await api.timesheets_api_jobs_retrieve()
    jobs.value = response.jobs || []
  } catch (error) {
    console.error('Failed to load jobs for timesheets', error)
    toast.error('Could not load jobs list.')
  }
}

async function loadDay(dateKey: string, silent = false) {
  const existing = dailyData.value[dateKey] || { entries: [], summary: null }
  dailyData.value = {
    ...dailyData.value,
    [dateKey]: { ...existing, loading: true },
  }

  try {
    const response = await api.job_api_workshop_timesheets_retrieve({ queries: { date: dateKey } })
    dailyData.value = {
      ...dailyData.value,
      [dateKey]: {
        entries: response.entries ?? [],
        summary: response.summary ?? null,
        loading: false,
      },
    }
  } catch (error) {
    console.error('Failed to load workshop timesheets', error)
    dailyData.value = {
      ...dailyData.value,
      [dateKey]: { ...existing, loading: false },
    }
    if (!silent) {
      toast.error('Failed to load timesheets for the day.')
    }
  }
}

function clearCalendarEvents() {
  trackedCalendarEventIds.value.forEach((id) => {
    calendarStore.deleteEvent(id)
  })
  trackedCalendarEventIds.value = new Set<string>()
}

function syncCalendarStoreEvents() {
  if (requiresLegacyFallback.value) {
    clearCalendarEvents()
    return
  }
  const desiredEvents = calendarEventPayloads.value
  const desiredIds = new Set<string>(desiredEvents.map((event) => event.id))
  trackedCalendarEventIds.value.forEach((id) => {
    if (!desiredIds.has(id)) {
      calendarStore.deleteEvent(id)
    }
  })
  desiredEvents.forEach((event) => {
    if (trackedCalendarEventIds.value.has(event.id)) {
      calendarStore.updateEvent(event)
    } else {
      calendarStore.addEvent(event)
    }
  })
  trackedCalendarEventIds.value = desiredIds
}

function handleCalendarOpenEventModal(date?: Date | string | null) {
  if (!date) {
    openCreateForm()
    return
  }
  const candidate = dayjs(date)
  if (!candidate.isValid()) {
    openCreateForm()
    return
  }
  openCreateForm({
    start: candidate.format('HH:mm'),
  })
}

function handleCalendarEventClick(
  event: { id?: string; metadata?: Record<string, unknown> } | null,
) {
  if (!event) return
  const entryId =
    (event.metadata?.entryId as string | undefined) ??
    (typeof event.id === 'string' ? event.id : undefined)
  if (!entryId) return
  const entry = selectedEntries.value.find((item) => item.id === entryId)
  if (entry) {
    openEditForm(entry)
  }
}

function handleCalendarDateChange(newDate: Date) {
  if (!(newDate instanceof Date) || Number.isNaN(newDate.getTime())) return
  const dateKey = formatDateKey(newDate)
  if (selectedDate.value !== dateKey) {
    selectDay(dateKey)
  }
}

function selectDay(dateKey: string) {
  selectedDate.value = dateKey
}

function shiftDay(delta: number) {
  const currentSelected = parseDateKey(selectedDate.value)
  currentSelected.setDate(currentSelected.getDate() + delta)
  selectedDate.value = formatDateKey(currentSelected)
}

function getCalendarEventModal(): CalendarViewEventModalRef | null {
  const instance = calendarViewRef.value
  if (!instance) return null
  const publicRefs = instance.$refs as Record<string, unknown> | undefined
  const internalRefs = (instance as { $?: { refs?: Record<string, unknown> } }).$?.refs
  const instanceRecord = instance as unknown as Record<string, unknown>
  const modal =
    (publicRefs?.eventModal as CalendarViewEventModalRef | undefined) ??
    (internalRefs?.eventModal as CalendarViewEventModalRef | undefined) ??
    (instanceRecord.eventModal as CalendarViewEventModalRef | undefined)
  return modal ?? null
}

function suppressVendorCalendarModal(): boolean {
  const modal = getCalendarEventModal()
  if (!modal) return false
  if (modal.__workshopSuppressed) return true
  modal.openModal = () => {}
  modal.openEditModal = () => {}
  modal.closeModal = modal.closeModal ?? (() => {})
  modal.__workshopSuppressed = true
  return true
}

function cancelModalSuppressionLoop() {
  if (typeof window === 'undefined') return
  if (calendarModalSuppressionFrame !== null) {
    window.cancelAnimationFrame(calendarModalSuppressionFrame)
    calendarModalSuppressionFrame = null
  }
}

function scheduleModalSuppression() {
  if (typeof window === 'undefined' || requiresLegacyFallback.value) return
  if (suppressVendorCalendarModal()) {
    cancelModalSuppressionLoop()
    return
  }
  if (calendarModalSuppressionFrame !== null) return
  const attempt = () => {
    if (suppressVendorCalendarModal()) {
      cancelModalSuppressionLoop()
      return
    }
    calendarModalSuppressionFrame = window.requestAnimationFrame(attempt)
  }
  calendarModalSuppressionFrame = window.requestAnimationFrame(attempt)
}

watch(
  selectedDate,
  (dateKey) => {
    if (!dailyData.value[dateKey]) {
      void loadDay(dateKey)
    }
    calendarStore.currentDate = parseDateKey(dateKey)
  },
  { immediate: true },
)

watch(
  calendarEventPayloads,
  () => {
    syncCalendarStoreEvents()
  },
  { immediate: true },
)

watch(
  requiresLegacyFallback,
  (fallbackActive) => {
    syncCalendarStoreEvents()
    if (fallbackActive) {
      cancelModalSuppressionLoop()
    } else {
      scheduleModalSuppression()
    }
  },
  { immediate: true },
)

onMounted(() => {
  calendarStore.currentDate = parseDateKey(selectedDate.value)
  void loadJobs()
  scheduleModalSuppression()
})

onBeforeUnmount(() => {
  clearCalendarEvents()
  cancelModalSuppressionLoop()
})
</script>

<template>
  <AppLayout>
    <div class="flex flex-col min-h-full bg-muted/10">
      <header class="border-b bg-background/95 backdrop-blur">
        <div
          class="px-4 py-4 sm:px-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-2">
            <CalendarDays class="h-5 w-5 text-muted-foreground" />
            <div>
              <p class="text-sm text-muted-foreground">My Time</p>
              <p class="text-lg font-semibold text-foreground">Workshop timesheets</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" class="h-9" @click="shiftDay(-1)">
              <ChevronLeft class="h-4 w-4 mr-1" />
              Previous day
            </Button>
            <Badge variant="outline" class="px-3 py-1 text-sm">
              {{ formatFullDate(parseDateKey(selectedDate)) }}
            </Badge>
            <Button variant="ghost" size="sm" class="h-9" @click="shiftDay(1)">
              Next day
              <ChevronRight class="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      <main class="flex-1 max-h-none min-h-full px-4 py-4 sm:px-6 space-y-4">
        <Card class="h-auto">
          <CardHeader class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle class="flex items-center gap-2">
                <CalendarDays class="h-5 w-5" />
                {{ formatFullDate(parseDateKey(selectedDate)) }}
              </CardTitle>
              <p class="text-sm text-muted-foreground">
                {{ selectedDaySummary.hours.toFixed(2) }} h · {{ selectedDaySummary.jobs }} jobs
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                class="h-9"
                :disabled="isDayLoading"
                @click="loadDay(selectedDate)"
              >
                <RefreshCcw class="h-4 w-4 mr-1" />
                Refresh day
              </Button>
              <Button size="sm" class="h-9" @click="openCreateForm">
                <Plus class="h-4 w-4 mr-1" />
                Add entry
              </Button>
            </div>
          </CardHeader>
          <CardContent class="min-h-[360px] sm:min-h-[420px]">
            <div class="space-y-4">
              <div
                v-if="isDayLoading && selectedEntries.length === 0"
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <Card v-for="i in 3" :key="i" class="shadow-sm border">
                  <CardContent class="p-4 space-y-3">
                    <Skeleton class="h-4 w-24" />
                    <Skeleton class="h-4 w-32" />
                    <Skeleton class="h-4 w-20" />
                    <Skeleton class="h-10 w-full" />
                  </CardContent>
                </Card>
              </div>

              <div v-else>
                <div
                  v-if="requiresLegacyFallback"
                  class="space-y-4 rounded-lg border border-amber-100 bg-amber-50/80 p-4"
                >
                  <div class="flex items-start gap-3">
                    <div class="rounded-full bg-amber-100 p-2 text-amber-700">
                      <AlertTriangle class="h-5 w-5" />
                    </div>
                    <div class="space-y-1">
                      <p class="text-sm font-semibold text-amber-900">Start/end times required</p>
                      <p class="text-sm text-amber-800">
                        We couldn&apos;t show the calendar because some entries are missing their
                        start or end time. Edit each entry to add times, then the timeline will
                        reappear.
                      </p>
                    </div>
                  </div>
                  <div class="overflow-auto rounded-lg border bg-white shadow-sm">
                    <table class="min-w-full text-sm">
                      <thead
                        class="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        <tr>
                          <th class="px-3 py-2 text-left font-medium w-[32%]">Job</th>
                          <th class="px-3 py-2 text-left font-medium">Details</th>
                          <th class="px-3 py-2 text-right font-medium w-[12%]">Hours</th>
                          <th class="px-3 py-2 text-left font-medium w-[96px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="entry in selectedEntries"
                          :key="entry.id"
                          class="border-t hover:bg-muted/40 align-top"
                        >
                          <td class="px-3 py-3 text-sm font-medium text-foreground">
                            <div class="leading-tight">
                              <div class="text-sm font-semibold">
                                #{{ entry.job_number }} <span class="font-normal">·</span>
                                {{ entry.job_name }}
                              </div>
                              <div class="text-xs text-muted-foreground">
                                {{ entry.client_name || 'No client' }}
                              </div>
                            </div>
                          </td>
                          <td class="px-3 py-3">
                            <p class="text-sm text-muted-foreground line-clamp-2">
                              {{ entry.description || 'No description' }}
                            </p>
                            <div class="mt-2 flex flex-wrap gap-2 text-xs">
                              <span class="rounded-full bg-muted px-2 py-0.5">
                                {{ displayRate(safeRateMultiplier(entry.rate_multiplier)) }}
                              </span>
                              <span
                                class="rounded-full px-2 py-0.5 font-semibold"
                                :class="
                                  entry.is_billable
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-200 text-gray-600'
                                "
                              >
                                {{ entry.is_billable ? 'Billable' : 'Non-billable' }}
                              </span>
                            </div>
                          </td>
                          <td class="px-3 py-3 text-right font-semibold text-sm whitespace-nowrap">
                            {{ entry.hours.toFixed(2) }} h
                          </td>
                          <td class="px-3 py-2">
                            <div class="flex items-center gap-2">
                              <button
                                class="rounded-md border bg-white p-2 text-muted-foreground hover:text-foreground"
                                @click="openEditForm(entry)"
                              >
                                <Pencil class="h-4 w-4" />
                                <span class="sr-only">Edit entry</span>
                              </button>
                              <button
                                class="rounded-md border bg-white p-2 text-muted-foreground hover:text-destructive"
                                @click="handleDeleteEntry(entry.id)"
                              >
                                <Trash2 class="h-4 w-4" />
                                <span class="sr-only">Delete entry</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div v-else class="space-y-3">
                  <p
                    v-if="selectedEntries.length === 0 && !isDayLoading"
                    class="text-center text-sm text-muted-foreground"
                  >
                    No entries yet. Tap the calendar to add the first block.
                  </p>
                  <CalendarView
                    ref="calendarViewRef"
                    class="workshop-calendar w-full rounded-xl border bg-white shadow-sm"
                    height="auto"
                    :initial-date="parseDateKey(selectedDate)"
                    initial-view="day"
                    time-format="24h"
                    :show-controls="false"
                    :show-event-button="false"
                    :show-demo-events="false"
                    :enable-drag-drop="false"
                    @open-event-modal="handleCalendarOpenEventModal"
                    @event-click="handleCalendarEventClick"
                    @date-change="handleCalendarDateChange"
                  >
                    <template #event-modal />
                  </CalendarView>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  </AppLayout>

  <Drawer
    :open="isFormOpen"
    @update:open="
      (open) => {
        isFormOpen = open
        if (!open) resetForm()
      }
    "
  >
    <DrawerOverlay />
    <DrawerContent
      class="flex !h-[90vh] !max-h-[90vh] min-h-0 flex-col overflow-hidden sm:!h-auto sm:!max-h-[85vh]"
    >
      <div class="mx-auto flex h-full w-full max-w-3xl flex-col min-h-0">
        <DrawerHeader>
          <DrawerTitle class="text-xl font-semibold">
            {{ editingEntryId ? 'Edit entry' : 'Add entry' }}
          </DrawerTitle>
          <DrawerDescription
            >Quickly log workshop time for
            {{ formatFullDate(parseDateKey(selectedDate)) }}</DrawerDescription
          >
        </DrawerHeader>
        <div class="drawer-scroll flex-1 overflow-y-auto px-4 pb-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div class="text-sm font-medium text-foreground flex flex-col gap-1 sm:col-span-2">
              <span>Job</span>
              <button
                class="rounded-md border px-3 h-[44px] text-left text-sm bg-muted/40 hover:bg-muted/70 transition-colors flex items-center justify-between"
                @click="isJobPickerOpen = true"
              >
                <span class="truncate">
                  <template v-if="formState.jobId">
                    {{
                      jobs.find((j) => j.id === formState.jobId)
                        ? `#${jobs.find((j) => j.id === formState.jobId)?.job_number} - ${jobs.find((j) => j.id === formState.jobId)?.name}`
                        : 'Job selected'
                    }}
                  </template>
                  <span v-else class="text-muted-foreground">Tap to select a job</span>
                </span>
                <Shuffle class="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
              </button>
            </div>
            <label class="text-sm font-medium text-foreground flex flex-col gap-1">
              Start time
              <input
                v-model="formState.startTime"
                type="time"
                class="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label class="text-sm font-medium text-foreground flex flex-col gap-1">
              End time
              <input
                v-model="formState.endTime"
                type="time"
                class="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <div
              class="sm:col-span-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"
            >
              <div>
                Duration:
                <span class="font-semibold text-foreground">
                  {{ formDurationHours.toFixed(2) }} h
                </span>
              </div>
              <div class="flex flex-wrap gap-2 text-xs">
                <button class="rounded-full border px-3 py-1" type="button" @click="setRangeToNow">
                  Now
                </button>
                <button
                  class="rounded-full border px-3 py-1"
                  type="button"
                  @click="adjustRangeBy(-5)"
                >
                  -5m
                </button>
                <button
                  class="rounded-full border px-3 py-1"
                  type="button"
                  @click="adjustRangeBy(5)"
                >
                  +5m
                </button>
                <button
                  class="rounded-full border px-3 py-1"
                  type="button"
                  @click="adjustRangeBy(15)"
                >
                  +15m
                </button>
                <button
                  class="rounded-full border px-3 py-1"
                  type="button"
                  @click="adjustRangeBy(30)"
                >
                  +30m
                </button>
                <button
                  class="rounded-full border px-3 py-1"
                  type="button"
                  @click="fillGapToNextEntry"
                >
                  Fill gap
                </button>
                <button
                  class="rounded-full border px-3 py-1"
                  type="button"
                  @click="resetToDefaultRange"
                >
                  Reset
                </button>
              </div>
            </div>
            <label class="text-sm font-medium text-foreground flex flex-col gap-1">
              Rate multiplier
              <select
                v-model="formState.rateMultiplier"
                class="w-full rounded-md border px-3 h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Ord">Ord</option>
                <option value="1.5">1.5</option>
                <option value="2.0">2.0</option>
              </select>
            </label>
            <label class="text-sm font-medium text-foreground flex flex-col gap-1">
              <span>Billable</span>
              <div class="flex items-center gap-2 h-[44px]">
                <input
                  type="checkbox"
                  class="h-4 w-4 accent-primary"
                  :checked="formState.isBillable"
                  @change="formState.isBillable = !formState.isBillable"
                />
                <span>Billable</span>
              </div>
            </label>
            <label class="text-sm font-medium text-foreground sm:col-span-2">
              Description
              <textarea
                v-model="formState.description"
                rows="3"
                class="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="What was done"
              />
            </label>
          </div>
        </div>
        <DrawerFooter class="px-4 pb-4">
          <div class="flex w-full flex-wrap items-center justify-between gap-3">
            <Button
              v-if="editingEntryId"
              variant="destructive"
              size="sm"
              class="h-9"
              :disabled="isSubmitting || isDayLoading"
              @click="deleteEntryFromDrawer"
            >
              <Trash2 class="mr-2 h-4 w-4" />
              Delete
            </Button>
            <div class="ml-auto flex items-center gap-2">
              <DrawerClose as-child>
                <Button variant="outline" size="sm" class="h-9" @click="() => resetForm()">
                  <Ban class="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                size="sm"
                class="h-9"
                :disabled="isSubmitting || isDayLoading"
                @click="submitForm"
              >
                <Save class="mr-2 h-4 w-4" />
                {{ editingEntryId ? 'Update entry' : 'Save entry' }}
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>

  <Drawer
    :open="isJobPickerOpen"
    @update:open="
      (open) => {
        isJobPickerOpen = open
      }
    "
  >
    <DrawerOverlay />
    <DrawerContent
      class="flex !h-[90vh] !max-h-[90vh] min-h-0 flex-col overflow-hidden sm:!h-auto sm:!max-h-[85vh]"
    >
      <div class="mx-auto flex h-full w-full max-w-4xl flex-col min-h-0">
        <DrawerHeader>
          <DrawerTitle class="text-xl font-semibold">Select a job</DrawerTitle>
          <DrawerDescription>Search by job number, name, or client</DrawerDescription>
        </DrawerHeader>
        <div class="drawer-scroll flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          <input
            v-model="jobSearch"
            type="text"
            placeholder="Search jobs..."
            class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div class="overflow-x-auto rounded-md border">
            <table class="min-w-full text-sm">
              <thead class="bg-muted sticky top-0">
                <tr>
                  <th class="text-left px-3 py-2 font-semibold">Job #</th>
                  <th class="text-left px-3 py-2 font-semibold">Name</th>
                  <th class="text-left px-3 py-2 font-semibold">Client</th>
                  <th class="text-left px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="job in filteredJobs" :key="job.id" class="border-t hover:bg-muted/50">
                  <td class="px-3 py-2 whitespace-nowrap">#{{ job.job_number }}</td>
                  <td class="px-3 py-2">{{ job.name }}</td>
                  <td class="px-3 py-2">{{ job.client_name || '-' }}</td>
                  <td class="px-3 py-2">
                    <Button
                      size="sm"
                      class="h-8 px-3"
                      @click="
                        () => {
                          formState.jobId = job.id
                          isJobPickerOpen = false
                        }
                      "
                    >
                      Select
                    </Button>
                  </td>
                </tr>
                <tr v-if="filteredJobs.length === 0">
                  <td colspan="4" class="px-3 py-4 text-center text-muted-foreground">
                    No jobs found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <DrawerFooter class="px-4 pb-4">
          <DrawerClose as-child>
            <Button variant="outline" size="sm">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>
</template>

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
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Shuffle,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
} from 'lucide-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { z } from 'zod'

type WorkshopTimesheetEntry = z.infer<typeof schemas.WorkshopTimesheetEntry>
type WorkshopTimesheetSummary = z.infer<typeof schemas.WorkshopTimesheetSummary>
type JobsListResponse = z.infer<typeof schemas.JobsListResponse>

const anchorDate = ref(new Date())
const selectedDate = ref(formatDateKey(new Date()))
const isWeekLoading = ref(false)
const isDayLoading = ref(false)
const isSubmitting = ref(false)
const editingEntryId = ref<string | null>(null)
const isFormOpen = ref(false)
const isJobPickerOpen = ref(false)
const jobSearch = ref('')

const formState = reactive({
  jobId: '',
  hours: '',
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

const weekStart = computed(() => startOfWeek(anchorDate.value))
const weekDays = computed(() => {
  const start = new Date(weekStart.value)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = formatDateKey(d)
    return {
      key,
      label: formatDayLabel(d),
      title: formatFullDate(d),
    }
  })
})

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

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function parseDateKey(key: string): Date {
  return new Date(`${key}T00:00:00`)
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' })
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-AU', { weekday: 'long', month: 'short', day: 'numeric' })
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

function resetForm() {
  editingEntryId.value = null
  formState.jobId = ''
  formState.hours = ''
  formState.description = ''
  formState.isBillable = true
  formState.rateMultiplier = 'Ord'
}

function openCreateForm() {
  resetForm()
  isFormOpen.value = true
}

function openEditForm(entry: WorkshopTimesheetEntry) {
  editingEntryId.value = entry.id
  formState.jobId = entry.job_id
  formState.hours = entry.hours.toFixed(2)
  formState.description = entry.description ?? ''
  formState.isBillable = entry.is_billable
  formState.rateMultiplier = rateLabelFromMultiplier(entry.rate_multiplier)
  isFormOpen.value = true
}

async function submitForm() {
  if (!selectedDate.value) return
  const hours = Number(formState.hours)
  if (!hours || hours < 0.01) {
    toast.error('Hours must be at least 0.01.')
    return
  }
  if (!formState.jobId) {
    toast.error('Please select a job before saving.')
    return
  }

  const payload = {
    job_id: formState.jobId,
    accounting_date: selectedDate.value,
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

async function loadJobs() {
  try {
    const response = await api.timesheets_api_jobs_retrieve()
    jobs.value = response.jobs || []
  } catch (error) {
    console.error('Failed to load jobs for timesheets', error)
    toast.error('Could not load jobs list.')
  }
}

async function loadWeek() {
  isWeekLoading.value = true
  await Promise.all(weekDays.value.map((day) => loadDay(day.key, true)))
  isWeekLoading.value = false
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

function selectDay(dateKey: string) {
  selectedDate.value = dateKey
}

function shiftWeek(delta: number) {
  const newAnchor = new Date(anchorDate.value)
  newAnchor.setDate(newAnchor.getDate() + delta * 7)
  anchorDate.value = newAnchor

  const currentSelected = parseDateKey(selectedDate.value)
  currentSelected.setDate(currentSelected.getDate() + delta * 7)
  selectedDate.value = formatDateKey(currentSelected)
}

watch(
  weekDays,
  () => {
    void loadWeek()
  },
  { immediate: true },
)

watch(
  selectedDate,
  (dateKey) => {
    if (!dailyData.value[dateKey]) {
      void loadDay(dateKey)
    }
  },
  { immediate: true },
)

onMounted(() => {
  void loadJobs()
})
</script>

<template>
  <AppLayout>
    <div class="flex flex-col h-full min-h-0 bg-muted/10">
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
            <Button variant="ghost" size="sm" class="h-9" @click="shiftWeek(-1)">
              <ChevronLeft class="h-4 w-4 mr-1" />
              Previous week
            </Button>
            <Badge variant="outline" class="px-3 py-1 text-sm">
              Week of {{ formatFullDate(weekStart) }}
            </Badge>
            <Button variant="ghost" size="sm" class="h-9" @click="shiftWeek(1)">
              Next week
              <ChevronRight class="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      <main class="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 space-y-4">
        <Card>
          <CardHeader class="flex items-center justify-between">
            <CardTitle class="flex items-center gap-2">
              <Clock3 class="h-5 w-5" />
              Week overview
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :disabled="isWeekLoading"
              @click="loadWeek"
            >
              <RefreshCcw class="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              <button
                v-for="day in weekDays"
                :key="day.key"
                class="text-left rounded-lg border bg-card px-3 py-3 transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                :class="selectedDate === day.key ? 'border-primary ring-2 ring-primary/20' : ''"
                @click="selectDay(day.key)"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs text-muted-foreground">{{ day.label }}</p>
                    <p class="text-sm font-semibold">{{ day.title }}</p>
                  </div>
                  <Badge v-if="selectedDate === day.key" variant="secondary" class="text-xs"
                    >Selected</Badge
                  >
                </div>
                <div class="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                  <span class="font-semibold text-foreground">
                    {{
                      dailyData[day.key]?.summary?.total_hours != null
                        ? dailyData[day.key]?.summary?.total_hours.toFixed(2)
                        : '0.00'
                    }}
                    h
                  </span>
                  <span class="text-muted-foreground/70">·</span>
                  <span>
                    {{
                      dailyData[day.key]?.entries
                        ? new Set(dailyData[day.key]?.entries.map((e) => e.job_id)).size
                        : 0
                    }}
                    jobs
                  </span>
                </div>
                <div v-if="dailyData[day.key]?.loading || isWeekLoading" class="mt-2">
                  <Skeleton class="h-2 w-full" />
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card class="h-full">
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
          <CardContent class="min-h-[320px] sm:min-h-[360px]">
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

              <div
                v-else-if="selectedEntries.length === 0"
                class="text-sm text-muted-foreground text-center py-10"
              >
                No entries for this day.
              </div>

              <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div
                  v-for="entry in selectedEntries"
                  :key="entry.id"
                  class="rounded-lg border bg-card p-3 shadow-sm relative flex flex-col gap-2"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="space-y-1">
                      <p class="text-sm font-semibold text-foreground">
                        #{{ entry.job_number }} - {{ entry.job_name }}
                      </p>
                      <p class="text-xs text-muted-foreground">
                        {{ entry.client_name }}
                      </p>
                    </div>
                    <div class="flex items-center gap-1">
                      <button
                        class="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center shadow-sm"
                        @click="openEditForm(entry)"
                        aria-label="Edit entry"
                      >
                        <Pencil class="h-4 w-4" />
                      </button>
                      <button
                        class="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-sm"
                        @click="handleDeleteEntry(entry.id)"
                        aria-label="Delete entry"
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 text-sm">
                    <span class="font-semibold text-foreground"
                      >{{ entry.hours.toFixed(2) }} h</span
                    >
                    <span class="px-2 py-0.5 rounded-full bg-muted text-xs">
                      {{ displayRate(entry.rate_multiplier) }}
                    </span>
                    <span
                      class="px-2 py-0.5 rounded-full text-xs"
                      :class="
                        entry.is_billable
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      "
                    >
                      {{ entry.is_billable ? 'Billable' : 'Non-billable' }}
                    </span>
                  </div>
                  <p class="text-sm text-muted-foreground whitespace-pre-wrap">
                    {{ entry.description || 'No description' }}
                  </p>
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
    <DrawerContent class="max-h-[85vh]">
      <div class="mx-auto w-full max-w-3xl">
        <DrawerHeader>
          <DrawerTitle class="text-xl font-semibold">
            {{ editingEntryId ? 'Edit entry' : 'Add entry' }}
          </DrawerTitle>
          <DrawerDescription
            >Quickly log workshop time for
            {{ formatFullDate(parseDateKey(selectedDate)) }}</DrawerDescription
          >
        </DrawerHeader>
        <div class="px-4 pb-4 overflow-y-auto max-h-[calc(85vh-120px)]">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div class="text-sm font-medium text-foreground flex flex-col gap-1">
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
              Hours
              <input
                v-model="formState.hours"
                type="number"
                min="0.01"
                step="0.25"
                inputmode="decimal"
                class="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0.00"
              />
            </label>
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
          <div class="flex w-full justify-end gap-2">
            <DrawerClose as-child>
              <Button variant="outline" size="sm" @click="() => resetForm()">Cancel</Button>
            </DrawerClose>
            <Button
              size="sm"
              class="h-9"
              :disabled="isSubmitting || isDayLoading"
              @click="submitForm"
            >
              {{ editingEntryId ? 'Update entry' : 'Save entry' }}
            </Button>
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
    <DrawerContent class="max-h-[85vh]">
      <div class="mx-auto w-full max-w-4xl">
        <DrawerHeader>
          <DrawerTitle class="text-xl font-semibold">Select a job</DrawerTitle>
          <DrawerDescription>Search by job number, name, or client</DrawerDescription>
        </DrawerHeader>
        <div class="px-4 pb-4 space-y-3">
          <input
            v-model="jobSearch"
            type="text"
            placeholder="Search jobs..."
            class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div class="overflow-auto rounded-md border max-h-[50vh]">
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

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
        </CardHeader>
        <CardContent class="text-2xl font-bold text-center">{{
          jobsWithTotals.length
        }}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Hours</CardTitle>
        </CardHeader>
        <CardContent class="text-2xl font-bold text-center">{{
          historyTotalHours.toFixed(2)
        }}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Dollars</CardTitle>
        </CardHeader>
        <CardContent class="text-2xl font-bold text-center">{{
          historyTotalDollars.toFixed(2)
        }}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Stock Job</CardTitle>
        </CardHeader>
        <CardContent class="text-center space-y-1">
          <div>Lines: {{ stockSummary.material_line_count }}</div>
          <div>Cost: {{ stockSummary.material_cost.toFixed(2) }}</div>
        </CardContent>
      </Card>
    </div>
    <div class="overflow-x-auto border rounded">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-10">
              <input type="checkbox" @change="toggleAll" :checked="allSelected" />
            </TableHead>
            <TableHead>Job #</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Dollars</TableHead>
            <TableHead>Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="job in jobsWithTotals" :key="job.job_id">
            <TableCell>
              <input type="checkbox" :value="job.job_id" v-model="selectedIdsProxy" />
            </TableCell>
            <TableCell>{{ job.job_number }}</TableCell>
            <TableCell>{{ job.job_name }}</TableCell>
            <TableCell>{{ job.monthHours.toFixed(2) }}</TableCell>
            <TableCell>{{ job.monthDollars.toFixed(2) }}</TableCell>
            <TableCell>
              <svg class="w-24 h-6">
                <polyline
                  :points="sparklinePoints(job.history.map((h) => h.total_hours))"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1"
                />
              </svg>
            </TableCell>
          </TableRow>
          <TableRow v-if="jobsWithTotals.length === 0">
            <TableCell colspan="6" class="text-center py-4">No jobs</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface JobHistoryEntry {
  date: string
  total_hours: number
  total_dollars: number
}

interface Job {
  job_id: string
  job_number: number
  job_name: string
  history: JobHistoryEntry[]
}

interface StockSummary {
  material_line_count: number
  material_cost: number
}

const props = defineProps<{
  jobs: Job[]
  stockSummary: StockSummary
  monthKey: string
  selectedIds: string[]
}>()
const emit = defineEmits(['selectJob', 'runMonthEnd'])

const selectedIdsProxy = ref<string[]>([])

watch(
  () => selectedIdsProxy.value,
  (val) => emit('selectJob', val),
  { immediate: true },
)

function entriesInMonth(history: JobHistoryEntry[], monthKey: string) {
  return Array.isArray(history)
    ? history.filter((h) => {
        const d = new Date(h.date)
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        return yearMonth === monthKey
      })
    : []
}

const jobsWithTotals = computed(() =>
  props.jobs.map((job) => {
    const entries = entriesInMonth(job.history, props.monthKey)
    const monthHours = entries.reduce((sum, e) => sum + (e.total_hours || 0), 0)
    const monthDollars = entries.reduce((sum, e) => sum + (e.total_dollars || 0), 0)
    return { ...job, monthHours, monthDollars, history: entries }
  }),
)

const historyTotalHours = computed(() =>
  jobsWithTotals.value.reduce((sum, j) => sum + j.monthHours, 0),
)
const historyTotalDollars = computed(() =>
  jobsWithTotals.value.reduce((sum, j) => sum + j.monthDollars, 0),
)

const allSelected = computed(
  () => props.jobs.length > 0 && selectedIdsProxy.value.length === props.jobs.length,
)

function toggleAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  selectedIdsProxy.value = checked ? props.jobs.map((j) => j.job_id) : []
}

function sparklinePoints(values: number[]): string {
  const pts = values.length === 1 ? [0, values[0]] : values
  if (pts.length < 2) return ''
  const max = Math.max(...pts),
    min = Math.min(...pts)
  const width = 60,
    height = 20
  return pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * width
      const y = height - ((v - min) / (max - min || 1)) * height
      return `${x},${y}`
    })
    .join(' ')
}
</script>

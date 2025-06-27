<template>
  <AppLayout>
    <div class="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-6">
      <div class="flex items-end gap-3">
        <input type="month" v-model="selectedMonth" class="border rounded px-2 py-1" />
        <Button variant="default" @click="fetchMonthEndData">Load</Button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Jobs</CardTitle>
          </CardHeader>
          <CardContent class="text-2xl font-bold text-center">{{ jobs.length }}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Hours</CardTitle>
          </CardHeader>
          <CardContent class="text-2xl font-bold text-center">{{
            totalHours.toFixed(2)
          }}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Dollars</CardTitle>
          </CardHeader>
          <CardContent class="text-2xl font-bold text-center">{{
            totalDollars.toFixed(2)
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
            <TableRow v-for="job in jobs" :key="job.job_id">
              <TableCell>
                <input type="checkbox" :value="job.job_id" v-model="selectedIds" />
              </TableCell>
              <TableCell>{{ job.job_number }}</TableCell>
              <TableCell>{{ job.job_name }}</TableCell>
              <TableCell>{{ job.total_hours.toFixed(2) }}</TableCell>
              <TableCell>{{ job.total_dollars.toFixed(2) }}</TableCell>
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
            <TableRow v-if="jobs.length === 0">
              <TableCell colspan="6" class="text-center py-4">No jobs</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <Card v-if="stockJob">
        <CardHeader>
          <CardTitle>Stock Job Summary</CardTitle>
        </CardHeader>
        <CardContent class="flex gap-4">
          <div>Material Lines: {{ stockSummary.material_line_count }}</div>
          <div>Material Cost: {{ stockSummary.material_cost.toFixed(2) }}</div>
        </CardContent>
      </Card>
      <div class="flex justify-end">
        <Button variant="destructive" :disabled="!selectedIds.length" @click="showDialog = true"
          >Run Month-End</Button
        >
      </div>
      <Dialog v-model:open="showDialog">
        <DialogContent class="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Month-End</DialogTitle>
          </DialogHeader>
          <div class="space-y-1">
            <div v-for="id in selectedIds" :key="id">{{ jobNumber(id) }}</div>
          </div>
          <DialogFooter class="flex gap-2 justify-end mt-4">
            <Button variant="destructive" @click="confirmRun">Run</Button>
            <Button variant="outline" @click="showDialog = false">Cancel</Button>
          </DialogFooter>
          <Progress v-if="loading" class="mt-4" :model-value="progress" />
        </DialogContent>
      </Dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Progress from '@/components/ui/progress/Progress.vue'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { fetchMonthEnd, runMonthEnd, MonthEndJob, StockJob } from '@/composables/useMonthEnd'
import { toast } from 'vue-sonner'

const selectedMonth = ref(new Date().toISOString().slice(0, 7))
const jobs = ref<MonthEndJob[]>([])
const stockJob = ref<StockJob | null>(null)
const selectedIds = ref<string[]>([])
const loading = ref(false)
const progress = ref(0)
const showDialog = ref(false)

const totalHours = computed(() => jobs.value.reduce((a, j) => a + j.total_hours, 0))
const totalDollars = computed(() => jobs.value.reduce((a, j) => a + j.total_dollars, 0))
const allSelected = computed(
  () => jobs.value.length > 0 && selectedIds.value.length === jobs.value.length,
)
const stockSummary = computed(() => {
  if (!stockJob.value) return { material_line_count: 0, material_cost: 0 }
  return {
    material_line_count: stockJob.value.history.reduce((a, h) => a + h.material_line_count, 0),
    material_cost: stockJob.value.history.reduce((a, h) => a + h.material_cost, 0),
  }
})

function sparklinePoints(values: number[]): string {
  if (!values.length) return ''
  const max = Math.max(...values)
  const min = Math.min(...values)
  const width = 60
  const height = 20
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width
      const y = height - (max === min ? height / 2 : ((v - min) / (max - min)) * height)
      return `${x},${y}`
    })
    .join(' ')
}

function toggleAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  selectedIds.value = checked ? jobs.value.map((j) => j.job_id) : []
}

function jobNumber(id: string) {
  const j = jobs.value.find((j) => j.job_id === id)
  return j ? j.job_number : id
}

async function fetchMonthEndData() {
  loading.value = true
  try {
    const data = await fetchMonthEnd(selectedMonth.value)
    jobs.value = data.jobs
    stockJob.value = data.stockJob
    selectedIds.value = []
  } catch {
    toast.error('Failed to load month-end data')
  } finally {
    loading.value = false
  }
}

async function confirmRun() {
  loading.value = true
  progress.value = 0
  try {
    const res = await runMonthEnd(selectedIds.value)
    progress.value = 100
    if (!res.errors.length) {
      toast.success('Month-End completed')
    } else {
      toast.error('Some jobs failed')
    }
    showDialog.value = false
    fetchMonthEndData()
  } catch {
    toast.error('Failed to run Month-End')
  } finally {
    loading.value = false
  }
}
</script>

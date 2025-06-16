<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
        @click="closeModal"
      ></div>

      <!-- Modal -->
      <div class="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-900">
            📋 {{ staffName }} - Job Breakdown
          </h3>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Week Period -->
        <div class="bg-blue-50 p-3 rounded-lg mb-6">
          <p class="text-sm text-blue-600">
            Week of {{ formatWeekRange(weekStart, weekEnd) }}
          </p>
        </div>

        <!-- Jobs List -->
        <div class="space-y-4 max-h-96 overflow-y-auto">
          <div v-for="job in jobs" :key="job.jobId"
               class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">

            <!-- Job Header -->
            <div class="flex justify-between items-start mb-3">
              <div>
                <h4 class="font-semibold text-gray-900">{{ job.jobName }}</h4>
                <p class="text-sm text-gray-600">{{ job.clientName }}</p>
                <p class="text-xs text-gray-500">Job #{{ job.jobNumber }}</p>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold text-gray-900">{{ job.totalHours }}h</p>
                <p class="text-sm text-gray-600">${{ formatCurrency(job.revenue) }}</p>
              </div>
            </div>

            <!-- Daily Breakdown -->
            <div class="grid grid-cols-7 gap-2 text-xs">
              <div class="text-center font-medium text-gray-500">Mon</div>
              <div class="text-center font-medium text-gray-500">Tue</div>
              <div class="text-center font-medium text-gray-500">Wed</div>
              <div class="text-center font-medium text-gray-500">Thu</div>
              <div class="text-center font-medium text-gray-500">Fri</div>
              <div class="text-center font-medium text-gray-500">Sat</div>
              <div class="text-center font-medium text-gray-500">Sun</div>

              <div v-for="day in job.dailyHours" :key="day.date"
                   class="text-center p-1 rounded"
                   :class="day.hours > 0 ? 'bg-blue-100 text-blue-800' : 'text-gray-400'">
                {{ day.hours || '-' }}
              </div>
            </div>

            <!-- Job Status -->
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <StatusBadge :status="job.status" />
              <div class="flex items-center space-x-4 text-xs text-gray-500">
                <span>Billable: {{ job.billableHours }}h</span>
                <span>Rate: ${{ job.hourlyRate }}/h</span>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="!jobs || jobs.length === 0" class="text-center py-8">
            <p class="text-gray-500">No job entries for this week</p>
          </div>
        </div>

        <!-- Summary Footer -->
        <div class="mt-6 pt-4 border-t border-gray-200">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-sm text-gray-600">Total Hours</p>
              <p class="text-lg font-bold text-gray-900">{{ totalHours }}h</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Billable Hours</p>
              <p class="text-lg font-bold text-green-600">{{ totalBillableHours }}h</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Total Revenue</p>
              <p class="text-lg font-bold text-purple-600">${{ formatCurrency(totalRevenue) }}</p>
            </div>
          </div>
        </div>

        <!-- Close Button -->
        <div class="flex justify-end mt-6">
          <button
            @click="closeModal"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import StatusBadge from './StatusBadge.vue'
import type { JobBreakdown } from '@/services/weekly-timesheet.types'

interface Props {
  isOpen: boolean
  staffName: string
  weekStart: string
  weekEnd: string
  jobs: JobBreakdown[]
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const closeModal = () => {
  emit('close')
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value)
}

const formatWeekRange = (start: string, end: string): string => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
}

const totalHours = computed(() => {
  return props.jobs.reduce((sum, job) => sum + job.totalHours, 0)
})

const totalBillableHours = computed(() => {
  return props.jobs.reduce((sum, job) => sum + job.billableHours, 0)
})

const totalRevenue = computed(() => {
  return props.jobs.reduce((sum, job) => sum + job.revenue, 0)
})
</script>

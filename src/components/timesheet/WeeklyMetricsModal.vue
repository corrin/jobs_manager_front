<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
        @click="closeModal"
      ></div>

      <!-- Modal -->
      <div class="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-900">
            📊 Weekly Metrics & Overview
          </h3>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <!-- Total Hours -->
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-blue-600">Total Hours</p>
                <p class="text-2xl font-bold text-blue-900">{{ data?.totalHours || 0 }}</p>
              </div>
              <Clock class="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <!-- Billable Hours -->
          <div class="bg-green-50 p-4 rounded-lg border border-green-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-green-600">Billable Hours</p>
                <p class="text-2xl font-bold text-green-900">{{ data?.billableHours || 0 }}</p>
              </div>
              <DollarSign class="w-8 h-8 text-green-500" />
            </div>
          </div>

          <!-- Total Revenue -->
          <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-purple-600">Total Revenue</p>
                <p class="text-2xl font-bold text-purple-900">${{ formatCurrency(data?.totalRevenue || 0) }}</p>
              </div>
              <TrendingUp class="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <!-- Completion Rate -->
          <div class="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-orange-600">Completion Rate</p>
                <p class="text-2xl font-bold text-orange-900">{{ data?.completionRate || 0 }}%</p>
              </div>
              <BarChart3 class="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        <!-- Jobs Breakdown -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="text-lg font-semibold text-gray-900 mb-4">📋 Jobs Breakdown</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="job in data?.jobBreakdown || []" :key="job.jobId"
                 class="bg-white p-3 rounded border">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-gray-900">{{ job.jobName }}</p>
                  <p class="text-sm text-gray-600">{{ job.clientName }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium">{{ job.totalHours }}h</p>
                  <p class="text-xs text-gray-500">${{ formatCurrency(job.revenue) }}</p>
                </div>
              </div>
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
import { X, Clock, DollarSign, TrendingUp, BarChart3 } from 'lucide-vue-next'
import type { WeeklySummaryData } from '@/services/weekly-timesheet.types'

interface Props {
  isOpen: boolean
  data: WeeklySummaryData | null
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
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center space-x-2">
          <BarChart3 class="h-5 w-5 text-orange-600" />
          <span>Job Metrics Overview</span>
        </DialogTitle>
        <DialogDescription>
          Detailed job/project metrics for the selected week
        </DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div class="bg-orange-50 rounded-lg p-4 flex flex-col items-center">
          <h3 class="text-sm font-semibold text-orange-900 mb-2 flex items-center">
            <Briefcase class="h-4 w-4 mr-2 text-orange-600" />
            Open Jobs
          </h3>
          <div class="text-3xl font-bold text-orange-700 mb-1">{{ metrics.job_count }}</div>
          <div class="text-xs text-gray-500">Active this week</div>
        </div>
        <div class="bg-blue-50 rounded-lg p-4 flex flex-col items-center">
          <h3 class="text-sm font-semibold text-blue-900 mb-2 flex items-center">
            <Clock class="h-4 w-4 mr-2 text-blue-600" />
            Total Estimated Hours
          </h3>
          <div class="text-2xl font-bold text-blue-700 mb-1">{{ metrics.total_estimated_hours ?? '--' }}</div>
          <div class="text-xs text-gray-500">All jobs</div>
        </div>
        <div class="bg-green-50 rounded-lg p-4 flex flex-col items-center">
          <h3 class="text-sm font-semibold text-green-900 mb-2 flex items-center">
            <TrendingUp class="h-4 w-4 mr-2 text-green-600" />
            Total Actual Hours
          </h3>
          <div class="text-2xl font-bold text-green-700 mb-1">{{ metrics.total_actual_hours ?? '--' }}</div>
          <div class="text-xs text-gray-500">All jobs</div>
        </div>
        <div class="bg-emerald-50 rounded-lg p-4 flex flex-col items-center">
          <h3 class="text-sm font-semibold text-emerald-900 mb-2 flex items-center">
            <DollarSign class="h-4 w-4 mr-2 text-emerald-600" />
            Total Revenue
          </h3>
          <div class="text-2xl font-bold text-emerald-700 mb-1">${{ metrics.total_revenue ?? '--' }}</div>
          <div class="text-xs text-gray-500">All jobs</div>
        </div>
      </div>

      <!-- Chart/Graphic -->
      <div v-if="metrics.graphic" class="mt-8">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm font-semibold text-gray-700 mb-2">Job Progress Chart</div>
          <div v-html="metrics.graphic"></div>
        </div>
      </div>

      <div class="flex justify-end mt-6 pt-4 border-t">
        <Button @click="handleClose" variant="outline">
          Close
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BarChart3, Briefcase, Clock, TrendingUp, DollarSign } from 'lucide-vue-next'
import type { JobMetrics } from '@/services/weekly-timesheet.service'

interface Props {
  open: boolean
  metrics: JobMetrics
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const handleClose = () => {
  emit('close')
}
</script>

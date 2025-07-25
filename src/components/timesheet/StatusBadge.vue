<template>
  <div class="flex items-center justify-center">
    <div
      v-if="status === 'Leave'"
      class="flex items-center space-x-1 px-2 py-1 rounded-full bg-blue-100 border border-blue-200"
    >
      <Plane class="h-3 w-3 text-blue-600" />
      <span class="text-xs font-medium text-blue-700">
        {{ getLeaveTypeDisplay(leaveType) }}
      </span>
    </div>

    <div
      v-else-if="status === '✓' || status === 'Complete'"
      class="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 border border-green-200"
    >
      <Check class="h-3 w-3 text-green-600" />
    </div>

    <div
      v-else-if="status.includes('⚠') || status === 'Missing'"
      class="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 border border-yellow-200"
    >
      <AlertTriangle class="h-3 w-3 text-yellow-600" />
    </div>

    <div
      v-else-if="status.includes('Overtime')"
      class="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 border border-orange-200"
    >
      <Clock class="h-3 w-3 text-orange-600" />
    </div>

    <div
      v-else
      class="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 border border-gray-200"
    >
      <span class="text-xs text-gray-600">{{ getStatusDisplay(status) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { Check, AlertTriangle, Clock, Plane } from 'lucide-vue-next'

interface Props {
  status: string
  leaveType?: string
}

const props = defineProps<Props>()

debugLog('StatusBadge', { status: props.status, leaveType: props.leaveType })

const getLeaveTypeDisplay = (leaveType?: string): string => {
  if (!leaveType) return 'Leave'

  const typeMap: Record<string, string> = {
    'Annual Leave': 'AL',
    annual: 'AL',
    'Sick Leave': 'SL',
    sick: 'SL',
    'Other Leave': 'OL',
    other: 'OL',
  }

  return typeMap[leaveType] || 'Leave'
}

const getStatusDisplay = (status: string): string => {
  if (status === 'Of') return '-'
  if (!status || status === '-') return '-'
  return status
}
</script>

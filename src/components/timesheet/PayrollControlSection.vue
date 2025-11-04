<template>
  <div class="bg-white border border-gray-200 rounded-lg p-4 space-y-4 mb-4">
    <!-- Week Info and Pay Run Status -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <!-- Week Information -->
      <div class="flex items-center space-x-3">
        <Calendar class="h-5 w-5 text-gray-500" />
        <div class="flex flex-col">
          <span class="text-sm font-medium text-gray-900">
            Week: {{ formatWeekRange(weekStartDate) }}
          </span>
          <span v-if="paymentDate" class="text-xs text-gray-600">
            Payment: {{ formatPaymentDate(paymentDate) }}
          </span>
        </div>
      </div>

      <!-- Pay Run Status Badge -->
      <div v-if="payRunStatus" class="flex items-center space-x-2">
        <Badge :variant="getStatusVariant(payRunStatus)">
          <component :is="getStatusIcon(payRunStatus)" class="h-3 w-3" />
          {{ payRunStatus }}
        </Badge>
      </div>
      <div v-else>
        <Badge variant="outline">
          <AlertCircle class="h-3 w-3" />
          Not Created
        </Badge>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center space-x-2 flex-wrap gap-2">
      <!-- Create Pay Run Button -->
      <Button
        v-if="!payRunExists"
        @click="$emit('createPayRun')"
        :disabled="creating"
        variant="default"
        size="sm"
        class="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <CalendarPlus class="h-4 w-4 mr-2" />
        {{ creating ? 'Creating...' : 'Create Pay Run' }}
      </Button>

      <!-- Post All to Xero Button -->
      <Button
        v-if="payRunExists"
        @click="$emit('postAllToXero')"
        :disabled="!canPost || posting"
        variant="default"
        size="sm"
      >
        <Send class="h-4 w-4 mr-2" />
        {{ posting ? 'Posting...' : 'Post All to Xero' }}
      </Button>

      <!-- Help Text -->
      <div v-if="!payRunExists" class="text-xs text-gray-500">
        Create a pay run before posting staff hours to Xero
      </div>
      <div v-else-if="isPosted" class="text-xs text-gray-500 flex items-center">
        <Lock class="h-3 w-3 mr-1" />
        This week's payroll is locked and cannot be modified
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, CalendarPlus, Send, CheckCircle2, Lock, AlertCircle } from 'lucide-vue-next'
import { format, addDays, parseISO } from 'date-fns'

interface Props {
  weekStartDate: string // YYYY-MM-DD format (Monday)
  payRunStatus?: string | null // 'Draft' | 'Posted' | null
  paymentDate?: string | null // YYYY-MM-DD format
  creating?: boolean
  posting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  payRunStatus: null,
  paymentDate: null,
  creating: false,
  posting: false,
})

defineEmits<{
  createPayRun: []
  postAllToXero: []
}>()

const payRunExists = computed(() => props.payRunStatus !== null)
const isPosted = computed(() => props.payRunStatus === 'Posted')
const canPost = computed(() => payRunExists.value && !isPosted.value)

function formatWeekRange(weekStart: string): string {
  const start = parseISO(weekStart)
  const end = addDays(start, 6) // Sunday (Mon-Sun)
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
}

function formatPaymentDate(date: string): string {
  return format(parseISO(date), 'MMM d, yyyy (EEE)')
}

function getStatusVariant(status: string) {
  if (status === 'Draft') return 'default'
  if (status === 'Posted') return 'secondary'
  return 'outline'
}

function getStatusIcon(status: string) {
  if (status === 'Draft') return CheckCircle2
  if (status === 'Posted') return Lock
  return AlertCircle
}
</script>

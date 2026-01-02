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

    <!-- Warning Banner -->
    <div
      v-if="warning"
      class="bg-red-50 border border-red-200 rounded-md p-3 flex items-start space-x-2 text-red-800"
    >
      <AlertTriangle class="h-5 w-5 text-red-600 mt-0.5" />
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-wide text-red-600">
          Pay Run Warning
        </p>
        <p class="text-sm font-bold leading-snug">
          {{ warning }}
        </p>
      </div>
    </div>

    <!-- Payroll Error Banner -->
    <div
      v-if="payrollError"
      class="bg-red-50 border border-red-200 rounded-md p-3 flex items-start justify-between text-red-800"
    >
      <div class="flex items-start space-x-2">
        <AlertCircle class="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-red-600">
            Payroll Error
          </p>
          <p class="text-sm font-bold leading-snug">
            {{ payrollError }}
          </p>
        </div>
      </div>
      <button
        @click="$emit('dismissError')"
        class="text-red-600 hover:text-red-800 p-1 -m-1 rounded hover:bg-red-100"
        aria-label="Dismiss error"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- Posting Blocked Banner -->
    <div
      v-if="postingBlocked && postingBlockedReason"
      class="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start space-x-2 text-amber-800"
    >
      <Lock class="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
          Posting Restricted
        </p>
        <p class="text-sm leading-snug">
          {{ postingBlockedReason }}
        </p>
      </div>
    </div>

    <!-- Draft Warning Banner -->
    <div
      v-if="hasDraft && !postingBlocked"
      class="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start space-x-2 text-blue-800"
    >
      <AlertCircle class="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-wide text-blue-600">Draft Exists</p>
        <p class="text-sm leading-snug">
          A draft pay run already exists for this week. Posting will overwrite it with the latest
          hours.
        </p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center space-x-2 flex-wrap gap-2">
      <!-- Create Pay Run Button -->
      <Button
        v-if="!payRunExists && !postingBlocked"
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
        v-if="payRunExists && !isPosted && !postSuccess"
        @click="$emit('postAllToXero')"
        :disabled="!canPost || posting"
        variant="default"
        size="sm"
        :class="hasDraft ? 'bg-amber-600 hover:bg-amber-700' : ''"
      >
        <Send class="h-4 w-4 mr-2" :class="{ 'animate-pulse': posting }" />
        <template v-if="posting && postingProgress">
          Posting {{ postingProgress.current }}/{{ postingProgress.total }}
          <span v-if="postingProgress.currentStaffName" class="ml-1 text-xs opacity-75">
            ({{ postingProgress.currentStaffName }})
          </span>
        </template>
        <template v-else-if="posting"> Posting... </template>
        <template v-else-if="hasDraft"> Overwrite Draft </template>
        <template v-else> Post All to Xero </template>
      </Button>

      <!-- View in Xero Button (shown when Posted or after successful post) -->
      <Button
        v-if="xeroUrl && (isPosted || postSuccess)"
        variant="secondary"
        size="sm"
        class="bg-green-600 hover:bg-green-700 text-white"
        @click="openInXero"
      >
        <ExternalLink class="h-4 w-4 mr-2" />
        View in Xero
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

    <div class="flex justify-end pt-2 border-t border-gray-100">
      <Button
        variant="ghost"
        size="sm"
        class="text-gray-700"
        :disabled="refreshing"
        @click="$emit('refreshPayRuns')"
      >
        <RefreshCw class="h-4 w-4 mr-2" :class="{ 'animate-spin': refreshing }" />
        {{ refreshing ? 'Refreshing...' : 'Refresh Pay Runs' }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  CalendarPlus,
  Send,
  CheckCircle2,
  Lock,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  X,
} from 'lucide-vue-next'
import { format, addDays, parseISO } from 'date-fns'

interface PostingProgress {
  current: number
  total: number
  currentStaffName: string | null
}

interface Props {
  weekStartDate: string // YYYY-MM-DD format (Monday)
  payRunStatus?: string | null // 'Draft' | 'Posted' | null
  paymentDate?: string | null // YYYY-MM-DD format
  xeroUrl?: string | null // URL to view pay run in Xero
  creating?: boolean
  posting?: boolean
  postingProgress?: PostingProgress | null
  warning?: string | null
  payrollError?: string | null
  refreshing?: boolean
  postSuccess?: boolean
  postingBlocked?: boolean // True if a newer pay run has been posted
  postingBlockedReason?: string | null // Message explaining why posting is blocked
  hasDraft?: boolean // True if current week has a Draft pay run
}

const props = withDefaults(defineProps<Props>(), {
  payRunStatus: null,
  paymentDate: null,
  xeroUrl: null,
  creating: false,
  posting: false,
  postingProgress: null,
  warning: null,
  payrollError: null,
  refreshing: false,
  postSuccess: false,
  postingBlocked: false,
  postingBlockedReason: null,
  hasDraft: false,
})

defineEmits<{
  createPayRun: []
  postAllToXero: []
  refreshPayRuns: []
  dismissError: []
}>()

const payRunExists = computed(() => props.payRunStatus !== null)
const isPosted = computed(() => props.payRunStatus === 'Posted')
const canPost = computed(() => payRunExists.value && !isPosted.value && !props.postingBlocked)

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

function openInXero() {
  if (props.xeroUrl) {
    window.open(props.xeroUrl, '_blank', 'noopener')
  }
}
</script>

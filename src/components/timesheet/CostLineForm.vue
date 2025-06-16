<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Job Selection -->
    <div class="space-y-2">
      <label for="job" class="text-sm font-medium text-slate-700 dark:text-slate-200">
        Job *
      </label>
      <Select v-model="formData.job_id" required>
        <SelectTrigger>
          <SelectValue placeholder="Select a job..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="job in availableJobs"
            :key="job.id"
            :value="job.id"
          >
            <div class="flex flex-col">
              <span class="font-medium">{{ job.name }}</span>
              <span class="text-sm text-slate-500">#{{ job.number }} - {{ job.clientName }}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Time Input -->
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <label for="hours" class="text-sm font-medium text-slate-700 dark:text-slate-200">
          Hours *
        </label>
        <Input
          id="hours"
          v-model.number="formData.actual_hours"
          type="number"
          step="0.25"
          min="0"
          max="24"
          required
          placeholder="0.0"
        />
      </div>

      <div class="space-y-2">
        <label for="rate-multiplier" class="text-sm font-medium text-slate-700 dark:text-slate-200">
          Rate Multiplier
        </label>
        <Select v-model="formData.rate_multiplier">
          <SelectTrigger>
            <SelectValue placeholder="1.0x" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="1.0">Standard (1.0x)</SelectItem>
            <SelectItem :value="1.5">Overtime (1.5x)</SelectItem>
            <SelectItem :value="2.0">Double Time (2.0x)</SelectItem>
            <SelectItem :value="0.0">Unpaid (0.0x)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Start/End Times -->
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <label for="start-time" class="text-sm font-medium text-slate-700 dark:text-slate-200">
          Start Time
        </label>
        <Input
          id="start-time"
          v-model="formData.start_time"
          type="time"
        />
      </div>

      <div class="space-y-2">
        <label for="end-time" class="text-sm font-medium text-slate-700 dark:text-slate-200">
          End Time
        </label>
        <Input
          id="end-time"
          v-model="formData.end_time"
          type="time"
        />
      </div>
    </div>

    <!-- Description -->
    <div class="space-y-2">
      <label for="description" class="text-sm font-medium text-slate-700 dark:text-slate-200">
        Description *
      </label>
      <Textarea
        id="description"
        v-model="formData.description"
        placeholder="Describe the work performed..."
        required
        rows="3"
      />
    </div>

    <!-- Billable Toggle -->
    <div class="flex items-center space-x-2">
      <Checkbox
        id="billable"
        v-model:checked="formData.billable"
      />
      <label for="billable" class="text-sm font-medium text-slate-700 dark:text-slate-200">
        Billable to Client
      </label>
    </div>

    <!-- Notes -->
    <div class="space-y-2">
      <label for="notes" class="text-sm font-medium text-slate-700 dark:text-slate-200">
        Notes (Optional)
      </label>
      <Textarea
        id="notes"
        v-model="formData.notes"
        placeholder="Additional notes or comments..."
        rows="2"
      />
    </div>

    <!-- Cost Summary -->
    <div v-if="showCostSummary" class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
      <h4 class="font-semibold text-slate-900 dark:text-white">Cost Summary</h4>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="flex justify-between">
          <span class="text-slate-600 dark:text-slate-400">Hours:</span>
          <span class="font-medium">{{ formData.actual_hours }}h</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-600 dark:text-slate-400">Rate:</span>
          <span class="font-medium">${{ baseRate }}/h</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-600 dark:text-slate-400">Multiplier:</span>
          <span class="font-medium">{{ formData.rate_multiplier }}x</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-600 dark:text-slate-400">Total:</span>
          <span class="font-semibold text-green-600">${{ totalCost }}</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end space-x-2 pt-4 border-t">
      <Button
        type="button"
        variant="outline"
        @click="$emit('cancel')"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        :disabled="!isFormValid || loading"
        class="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
      >
        <Loader2 v-if="loading" class="h-4 w-4 mr-2 animate-spin" />
        {{ isEditing ? 'Update Entry' : 'Create Entry' }}
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-vue-next'
import type { Staff, Job } from '@/types/timesheet.types'
import type { CostLine } from '@/types/costing.types'

interface Props {
  costLine?: CostLine | null
  staff?: Staff | null
  date: Date
  availableJobs?: Job[]
}

const props = withDefaults(defineProps<Props>(), {
  costLine: null,
  staff: null,
  availableJobs: () => []
})

const emit = defineEmits<{
  save: [costLineData: any]
  cancel: []
}>()

// State
const loading = ref(false)

// Form Data with Reactive Defaults
const formData = ref({
  job_id: '',
  actual_hours: 0,
  start_time: '',
  end_time: '',
  description: '',
  rate_multiplier: 1.0,
  billable: true,
  notes: ''
})

// Inicializa o formData a partir do costLine se estiver editando
const initializeFormData = (): void => {
  if (props.costLine) {
    formData.value = {
      job_id: props.costLine.meta?.job_id || '',
      actual_hours: parseFloat(props.costLine.quantity) || 0,
      start_time: props.costLine.meta?.start_time || '',
      end_time: props.costLine.meta?.end_time || '',
      description: props.costLine.desc || '',
      rate_multiplier: props.costLine.meta?.rate_multiplier || 1.0,
      billable: props.costLine.meta?.billable ?? true,
      notes: props.costLine.meta?.notes || ''
    }
  }
}

// Executa a inicialização ao montar ou quando costLine muda
onMounted(initializeFormData)
watch(() => props.costLine, initializeFormData)

// Computed Properties
const isEditing = computed(() => !!props.costLine)

const baseRate = computed(() => {
  // Guard clause - early return for missing staff
  if (!props.staff) {
    return 0
  }

  return props.staff.wageRate || 50 // Default rate
})

const totalCost = computed(() => {
  const hours = formData.value.actual_hours
  const rate = baseRate.value
  const multiplier = formData.value.rate_multiplier || 1.0

  return (hours * rate * multiplier).toFixed(2)
})

const showCostSummary = computed(() => {
  return formData.value.actual_hours > 0 && props.staff
})

const isFormValid = computed(() => {
  // Guard clauses for form validation
  if (!formData.value.job_id) return false
  if (!formData.value.description.trim()) return false
  if (formData.value.actual_hours <= 0) return false

  return true
})

// Methods
const handleSubmit = async (): Promise<void> => {
  // Guard clause - early return if form is invalid
  if (!isFormValid.value || loading.value) {
    return
  }

  loading.value = true

  try {
    const costLineData = {
      ...formData.value,
      cost_value: totalCost.value,
      staff_id: props.staff?.id || '',
      cost_date: formatDate(props.date),
      cost_type: 'actual',
      cost_category: 'labour',
      kind: 'time'
    }

    emit('save', costLineData)
  } catch (error) {
    console.error('Failed to save cost line:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

const populateFormWithCostLine = (): void => {
  // Guard clause - early return if no cost line
  if (!props.costLine) {
    return
  }

  formData.value = {
    job_id: props.costLine.meta?.job_id || '',
    actual_hours: parseFloat(props.costLine.quantity) || 0,
    start_time: props.costLine.meta?.start_time || '',
    end_time: props.costLine.meta?.end_time || '',
    description: props.costLine.desc || '',
    rate_multiplier: props.costLine.meta?.rate_multiplier || 1.0,
    billable: props.costLine.meta?.billable ?? true,
    notes: props.costLine.meta?.notes || ''
  }
}

// Watchers
watch(() => props.costLine, () => {
  if (props.costLine) {
    populateFormWithCostLine()
  } else {
    // Reset form for new entry
    formData.value = {
      job_id: '',
      actual_hours: 0,
      start_time: '',
      end_time: '',
      description: '',
      rate_multiplier: 1.0,
      billable: true,
      notes: ''
    }
  }
}, { immediate: true })

// Auto-calculate hours from start/end times
watch([() => formData.value.start_time, () => formData.value.end_time], () => {
  if (formData.value.start_time && formData.value.end_time) {
    try {
      const start = new Date(`2000-01-01T${formData.value.start_time}:00`)
      const end = new Date(`2000-01-01T${formData.value.end_time}:00`)

      // Handle overnight shifts
      if (end < start) {
        end.setDate(end.getDate() + 1)
      }

      const diffMs = end.getTime() - start.getTime()
      const hours = diffMs / (1000 * 60 * 60) // Convert to hours

      if (hours > 0 && hours <= 24) {
        formData.value.actual_hours = Math.round(hours * 4) / 4 // Round to nearest quarter hour
      }
    } catch {
      // Ignore calculation errors
    }
  }
})
</script>

<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && $emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Time Entry</DialogTitle>
        <DialogDescription>
          Add time entry for {{ staff?.name }} on {{ formatDate(date) }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Job Information (Read-only) -->
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-sm font-medium text-gray-700 mb-1">Job</div>
          <div class="flex items-center gap-2">
            <Badge variant="outline" class="text-xs">{{ job?.jobNumber }}</Badge>
            <span class="text-sm">{{ job?.name }}</span>
          </div>
          <div class="text-xs text-gray-500 mt-1">{{ job?.clientName }}</div>
        </div>

        <!-- Hours Input -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Hours <span class="text-red-500">*</span>
          </label>
          <input
            v-model.number="formData.hours"
            type="number"
            step="0.25"
            min="0"
            max="24"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-300': errors.hours }"
            placeholder="0.0"
            required
          />
          <p v-if="errors.hours" class="text-red-500 text-xs mt-1">{{ errors.hours }}</p>
        </div>

        <!-- Rate Multiplier -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Rate Type <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.rateMultiplier"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-300': errors.rateMultiplier }"
            required
          >
            <option value="1.0">Standard (1.0x)</option>
            <option value="1.5">Time & Half (1.5x)</option>
            <option value="2.0">Double Time (2.0x)</option>
            <option value="0.0">Unpaid (0.0x)</option>
          </select>
          <p v-if="errors.rateMultiplier" class="text-red-500 text-xs mt-1">{{ errors.rateMultiplier }}</p>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Description <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="formData.description"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-300': errors.description }"
            rows="3"
            placeholder="Describe the work performed..."
            required
          ></textarea>
          <p v-if="errors.description" class="text-red-500 text-xs mt-1">{{ errors.description }}</p>
        </div>

        <!-- Billable Toggle -->
        <div class="flex items-center space-x-2">
          <input
            id="billable"
            v-model="formData.isBillable"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="billable" class="text-sm font-medium text-gray-700">
            Billable
          </label>
        </div>

        <!-- Rate Information (Read-only) -->
        <div class="bg-blue-50 rounded-lg p-3">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div class="font-medium text-gray-700">Wage Rate</div>
              <div class="text-gray-600">${{ staff?.wageRate || 0 }}/hr</div>
            </div>
            <div>
              <div class="font-medium text-gray-700">Charge Rate</div>
              <div class="text-gray-600">${{ job?.chargeOutRate || 0 }}/hr</div>
            </div>
          </div>
          <div v-if="formData.hours > 0" class="mt-2 pt-2 border-t border-blue-200">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="font-medium text-gray-700">Wage Cost</div>
                <div class="text-gray-600">${{ wageCost.toFixed(2) }}</div>
              </div>
              <div>
                <div class="font-medium text-gray-700">Bill Amount</div>
                <div class="text-gray-600">${{ billAmount.toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes (Optional) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            v-model="formData.notes"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="2"
            placeholder="Additional notes..."
          ></textarea>
        </div>
      </form>

      <DialogFooter>
        <Button @click="$emit('close')" variant="outline" type="button">
          Cancel
        </Button>
        <Button @click="handleSubmit" :disabled="!isFormValid || isSubmitting">
          <span v-if="isSubmitting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
          Create Entry
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Staff, Job, TimeEntry } from '@/types/timesheet'

interface Props {
  isOpen: boolean
  staff: Staff | null
  job: Job | null
  date: Date
}

interface Emits {
  (e: 'close'): void
  (e: 'entry-created', entry: Omit<TimeEntry, 'id'>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form data
const formData = ref({
  hours: 0,
  rateMultiplier: 1.0,
  description: '',
  isBillable: true,
  notes: ''
})

const errors = ref({
  hours: '',
  rateMultiplier: '',
  description: ''
})

const isSubmitting = ref(false)

// Computed values
const wageCost = computed(() => {
  if (!props.staff?.wageRate || !formData.value.hours) return 0
  return props.staff.wageRate * formData.value.hours * formData.value.rateMultiplier
})

const billAmount = computed(() => {
  if (!props.job?.chargeOutRate || !formData.value.hours) return 0
  return props.job.chargeOutRate * formData.value.hours
})

const isFormValid = computed(() => {
  return formData.value.hours > 0 &&
         formData.value.description.trim().length > 0 &&
         !Object.values(errors.value).some(error => error.length > 0)
})

// Methods
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-NZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const validateForm = () => {
  errors.value = {
    hours: '',
    rateMultiplier: '',
    description: ''
  }

  if (!formData.value.hours || formData.value.hours <= 0) {
    errors.value.hours = 'Hours must be greater than 0'
  }

  if (formData.value.hours > 24) {
    errors.value.hours = 'Hours cannot exceed 24'
  }

  if (!formData.value.description.trim()) {
    errors.value.description = 'Description is required'
  }

  if (formData.value.description.trim().length < 3) {
    errors.value.description = 'Description must be at least 3 characters'
  }

  return Object.values(errors.value).every(error => error.length === 0)
}

const handleSubmit = async () => {
  if (!validateForm() || !props.staff || !props.job) return

  isSubmitting.value = true

  try {
    const timeEntry: Omit<TimeEntry, 'id'> = {
      staffId: props.staff.id,
      jobPricingId: props.job.id,
      jobNumber: props.job.jobNumber || '',
      jobName: props.job.name || props.job.jobName || '',
      description: formData.value.description.trim(),
      hours: formData.value.hours,
      isBillable: formData.value.isBillable,
      notes: formData.value.notes.trim(),
      rateMultiplier: formData.value.rateMultiplier,
      timesheetDate: props.date.toISOString().split('T')[0],
      hoursSpent: formData.value.hours,
      estimatedHours: props.job.estimatedHours || 0,
      wageRate: props.staff.wageRate || 0,
      chargeOutRate: props.job.chargeOutRate || 0,
      date: props.date.toISOString().split('T')[0],
      billable: formData.value.isBillable,
      rateType: getRateTypeString(formData.value.rateMultiplier),
      wageAmount: wageCost.value,
      billAmount: billAmount.value
    }

    emit('entry-created', timeEntry)
    resetForm()
  } catch (error) {
    console.error('Error creating time entry:', error)
  } finally {
    isSubmitting.value = false
  }
}

const getRateTypeString = (multiplier: number): string => {
  switch (multiplier) {
    case 0.0: return 'Unpaid'
    case 1.0: return 'Ord'
    case 1.5: return '1.5'
    case 2.0: return '2.0'
    default: return 'Ord'
  }
}

const resetForm = () => {
  formData.value = {
    hours: 0,
    rateMultiplier: 1.0,
    description: '',
    isBillable: true,
    notes: ''
  }
  errors.value = {
    hours: '',
    rateMultiplier: '',
    description: ''
  }
}

// Watch for job changes to auto-set billable status
watch(() => props.job, (newJob) => {
  if (newJob) {
    formData.value.isBillable = newJob.isBillable ?? true
  }
})

// Reset form when modal closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    resetForm()
  }
})
</script>

<style scoped>
.border-red-300 {
  border-color: #fca5a5;
}
</style>

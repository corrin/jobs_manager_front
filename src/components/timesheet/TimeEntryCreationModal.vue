<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && $emit('close')">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle class="text-lg">Quick Time Entry</DialogTitle>
        <DialogDescription class="text-sm">
          {{ staff?.name }} • {{ formatDate(date) }}
        </DialogDescription>
      </DialogHeader>

      <form @submit="onSubmit" class="space-y-3">
        <!-- Job Information (Compact) -->
        <div class="bg-gray-50 rounded-md p-2">
          <div class="flex items-center gap-2">
            <Badge variant="outline" class="text-xs">{{ job?.jobNumber }}</Badge>
            <span class="text-xs font-medium truncate">{{ job?.name }}</span>
          </div>
        </div>

        <!-- Hours and Rate in Grid -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Hours <span class="text-red-500">*</span>
            </label>
            <Field
              name="hours"
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{ 'border-red-300': errors.hours }"
              placeholder="1.0"
            />
            <ErrorMessage name="hours" class="text-red-500 text-xs mt-1" />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Rate <span class="text-red-500">*</span>
            </label>
            <Field
              name="rateMultiplier"
              as="select"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{ 'border-red-300': errors.rateMultiplier }"
            >
              <option value="1.0">1.0x</option>
              <option value="1.5">1.5x</option>
              <option value="2.0">2.0x</option>
              <option value="0.0">Unpaid</option>
            </Field>
            <ErrorMessage name="rateMultiplier" class="text-red-500 text-xs mt-1" />
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Description <span class="text-red-500">*</span>
          </label>
          <Field
            name="description"
            as="textarea"
            class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-300': errors.description }"
            rows="2"
            placeholder="Work description..."
          />
          <ErrorMessage name="description" class="text-red-500 text-xs mt-1" />
        </div>

        <!-- Billable Toggle -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <Field
              name="isBillable"
              type="checkbox"
              class="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              :value="true"
            />
            <label class="text-xs font-medium text-gray-700">
              Billable
            </label>
          </div>

          <!-- Cost Summary (Compact) -->
          <div v-if="formData.hours > 0" class="text-right">
            <div class="text-xs text-gray-500">Cost: ${{ wageCost.toFixed(2) }}</div>
            <div class="text-xs font-medium text-green-600">Bill: ${{ billAmount.toFixed(2) }}</div>
          </div>
        </div>
      </form>

      <DialogFooter class="gap-2">
        <Button @click="$emit('close')" variant="outline" size="sm" type="button">
          Cancel
        </Button>
        <Button @click="onSubmit" :disabled="!meta.valid || isSubmitting" size="sm">
          <span v-if="isSubmitting" class="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></span>
          <Save v-if="!isSubmitting" class="h-3 w-3 mr-1" />
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, toRef } from 'vue'
import { useForm, Field, ErrorMessage } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { toast } from 'vue-sonner'
import { Save } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CompanyDefaultsService, type CompanyDefaults } from '@/services/companyDefaults.service'
import { useTimeEntryCalculations } from '@/composables/useTimeEntryCalculations'
import { 
  TimeEntryCreationSchema, 
  getRateTypeFromMultiplier,
  type TimeEntryCreationForm 
} from '@/schemas/timeEntrySchemas'
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

// Company defaults
const companyDefaults = ref<CompanyDefaults | null>(null)

// VeeValidate form setup with Zod schema
const { values: formData, errors, handleSubmit, resetForm, meta } = useForm<TimeEntryCreationForm>({
  validationSchema: toTypedSchema(TimeEntryCreationSchema),
  initialValues: {
    hours: 1.0, // Start with 1 hour (valid value)
    rateMultiplier: 1.0,
    description: '',
    isBillable: true,
    notes: ''
  }
})

const isSubmitting = ref(false)

// Convert refs for composable
const staffRef = toRef(props, 'staff')
const jobRef = toRef(props, 'job')
const formDataRef = computed(() => formData)

// Use calculations composable
const { wageCost, billAmount } = useTimeEntryCalculations(
  formDataRef,
  staffRef,
  jobRef,
  companyDefaults
)

// Methods
const formatDate = (date: Date | null | undefined) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date'
  }
  return date.toLocaleDateString('en-NZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Handle form submission with VeeValidate
 * Follows SRP by delegating validation to schema and calculation to composable
 */
const onSubmit = handleSubmit(async (validatedData: TimeEntryCreationForm) => {
  if (isSubmitting.value || !props.staff || !props.job) return

  isSubmitting.value = true

  try {
    const timeEntry: Omit<TimeEntry, 'id'> = {
      staffId: props.staff.id,
      jobPricingId: props.job.id, // Este já é o JobPricing ID, não o Job ID
      jobNumber: props.job.jobNumber || '',
      jobName: props.job.name || props.job.jobName || '',
      description: validatedData.description.trim(),
      hours: validatedData.hours,
      isBillable: validatedData.isBillable,
      notes: validatedData.notes?.trim() || '',
      rateMultiplier: validatedData.rateMultiplier,
      timesheetDate: props.date.toISOString().split('T')[0],
      hoursSpent: validatedData.hours,
      estimatedHours: props.job.estimatedHours || 0,
      wageRate: props.staff.wageRate || companyDefaults.value?.wage_rate || 32.0,
      chargeOutRate: props.job.chargeOutRate || companyDefaults.value?.charge_out_rate || 105.0,
      date: props.date.toISOString().split('T')[0],
      billable: validatedData.isBillable,
      rateType: getRateTypeFromMultiplier(validatedData.rateMultiplier),
      wageAmount: wageCost.value,
      billAmount: billAmount.value
    }

    emit('entry-created', timeEntry)
    resetForm()
    toast.success('Time entry created successfully!')
  } catch (error) {
    console.error('Error creating time entry:', error)
    toast.error('Failed to create time entry. Please try again.')
  } finally {
    isSubmitting.value = false
  }
})

// Load company defaults on mount
onMounted(async () => {
  try {
    companyDefaults.value = await CompanyDefaultsService.getDefaults()
  } catch (error) {
    console.error('Failed to load company defaults:', error)
  }
})

// Watch for job changes to auto-set billable status  
watch(() => props.job, (newJob) => {
  if (newJob) {
    // VeeValidate form already has the reactive values, no need to manually set
    // The initial billable status is handled in the schema default
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

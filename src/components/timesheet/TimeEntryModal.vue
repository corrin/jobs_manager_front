<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {{ entry ? 'Edit Entry' : 'New Time Entry' }}
        </DialogTitle>
        <DialogDescription>
          {{ staff?.name }} - {{ formatDate(date) }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Seleção de Job -->
        <div class="space-y-2">
          <Label for="job">Job *</Label>
          <Select v-model="formData.jobId" required>
            <SelectTrigger>
              <SelectValue placeholder="Select a job">
                <div v-if="selectedJob" class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :class="getJobColor(selectedJob.id)"
                  ></div>
                  {{ selectedJob.jobNumber }} - {{ selectedJob.jobName || selectedJob.name }}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="job in activeJobs"
                :key="job.id"
                :value="job.id"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :class="getJobColor(job.id)"
                  ></div>
                  <div class="flex flex-col">
                    <span class="font-medium">{{ job.jobNumber }} - {{ job.jobName || job.name }}</span>
                    <span class="text-xs text-gray-500">{{ job.clientName }}</span>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Método de entrada de tempo -->
        <div class="space-y-2">
          <Label>Entry Method</Label>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <input
                type="radio"
                id="duration"
                v-model="timeMethod"
                value="duration"
                class="w-4 h-4 text-blue-600"
              />
              <Label for="duration">Duration</Label>
            </div>
            <div class="flex items-center space-x-2">
              <input
                type="radio"
                id="time-range"
                v-model="timeMethod"
                value="time-range"
                class="w-4 h-4 text-blue-600"
              />
              <Label for="time-range">Start/End Time</Label>
            </div>
          </div>
        </div>

        <!-- Duration entry -->
        <div v-if="timeMethod === 'duration'" class="space-y-2">
          <Label for="hours">Hours *</Label>
          <div class="flex items-center gap-2">
            <Input
              id="hours"
              v-model.number="formData.hours"
              type="number"
              step="0.25"
              min="0"
              max="24"
              placeholder="8.0"
              required
              class="flex-1"
            />
            <span class="text-sm text-gray-500">hours</span>
          </div>
        </div>

        <!-- Time range entry -->
        <div v-if="timeMethod === 'time-range'" class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="start-time">Start *</Label>
            <Input
              id="start-time"
              v-model="formData.startTime"
              type="time"
              required
              @input="calculateHoursFromTime"
            />
          </div>
          <div class="space-y-2">
            <Label for="end-time">End *</Label>
            <Input
              id="end-time"
              v-model="formData.endTime"
              type="time"
              required
              @input="calculateHoursFromTime"
            />
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <Label for="description">Description *</Label>
          <Textarea
            id="description"
            v-model="formData.description"
            placeholder="Describe the work performed..."
            required
            rows="3"
          />
        </div>

        <!-- Additional settings -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="rate-type">Rate Type</Label>
            <Select v-model="formData.rateType">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ord">Regular</SelectItem>
                <SelectItem value="1.5">Overtime (1.5x)</SelectItem>
                <SelectItem value="2.0">Overtime (2.0x)</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex items-center space-x-2 pt-6">
            <Checkbox
              id="billable"
              v-model:checked="formData.billable"
            />
            <Label for="billable">Billable</Label>
          </div>
        </div>

        <!-- Notes -->
        <div class="space-y-2">
          <Label for="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            v-model="formData.notes"
            placeholder="Additional notes..."
            rows="2"
          />
        </div>

        <!-- Value summary -->
        <div v-if="formData.hours > 0" class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 class="font-medium mb-2">Summary</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Hours:</span>
              <span class="ml-2 font-medium">{{ formatHours(formData.hours) }}</span>
            </div>
            <div>
              <span class="text-gray-500">Hourly Rate:</span>
              <span class="ml-2 font-medium">${{ chargeOutRate.toFixed(2) }}/h</span>
            </div>
            <div>
              <span class="text-gray-500">Gross Amount:</span>
              <span class="ml-2 font-medium">${{ grossAmount.toFixed(2) }}</span>
            </div>
            <div>
              <span class="text-gray-500">Final Amount:</span>
              <span class="ml-2 font-semibold text-green-600">${{ finalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" @click="$emit('cancel')">
            Cancel
          </Button>
          <Button type="submit" :disabled="!isFormValid">
            {{ entry ? 'Update' : 'Create' }} Entry
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { Staff, TimeEntry, Job } from '@/types/timesheet'

interface Props {
  open: boolean
  entry?: TimeEntry | null
  staff?: Staff | null
  date: Date
  availableJobs?: Job[]
}

const props = withDefaults(defineProps<Props>(), {
  entry: null,
  staff: null,
  availableJobs: () => []
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  save: [entry: TimeEntry | Omit<TimeEntry, 'id'>]
  cancel: []
}>()

const timeMethod = ref<'duration' | 'time-range'>('duration')

const formData = ref({
  jobId: '',
  hours: 0,
  startTime: '',
  endTime: '',
  description: '',
  billable: true,
  rateType: 'Ord' as 'Ord' | '1.5' | '2.0' | 'Unpaid',
  notes: ''
})

const activeJobs = computed(() => {
  // Return all available jobs - filtering should be done at the data source level
  return props.availableJobs || []
})

const selectedJob = computed(() => {
  return props.availableJobs.find(job => job.id === formData.value.jobId)
})

const chargeOutRate = computed(() => {
  return selectedJob.value?.chargeOutRate || 0
})

const grossAmount = computed(() => {
  return formData.value.hours * chargeOutRate.value
})

const finalAmount = computed(() => {
  if (!formData.value.billable) return 0

  switch (formData.value.rateType) {
    case '1.5':
      return grossAmount.value * 1.5
    case '2.0':
      return grossAmount.value * 2.0
    case 'Unpaid':
      return 0
    default:
      return grossAmount.value
  }
})

const isFormValid = computed(() => {
  return formData.value.jobId &&
         formData.value.hours > 0 &&
         formData.value.description.trim()
})

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

const formatHours = (hours: number) => {
  if (hours % 1 === 0) {
    return hours.toString()
  }
  return hours.toFixed(1)
}

const getRateMultiplier = (rateType: string): number => {
  switch (rateType) {
    case '1.5': return 1.5
    case '2.0': return 2.0
    case 'Unpaid': return 0
    default: return 1.0
  }
}

const getJobColor = (jobId: string) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ]
  const index = parseInt(jobId) % colors.length
  return colors[index]
}

const calculateHoursFromTime = () => {
  if (formData.value.startTime && formData.value.endTime) {
    const [startHours, startMinutes] = formData.value.startTime.split(':').map(Number)
    const [endHours, endMinutes] = formData.value.endTime.split(':').map(Number)

    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes

    let diffMinutes = endTotalMinutes - startTotalMinutes
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60 // Handle next day
    }

    formData.value.hours = diffMinutes / 60
  }
}

const resetForm = () => {
  formData.value = {
    jobId: '',
    hours: 0,
    startTime: '',
    endTime: '',
    description: '',
    billable: true,
    rateType: 'Ord',
    notes: ''
  }
  timeMethod.value = 'duration'
}

const handleSubmit = () => {
  if (!isFormValid.value || !props.staff || !selectedJob.value) return

  const entryData = {
    jobId: formData.value.jobId,
    jobNumber: selectedJob.value.jobNumber || selectedJob.value.number || '',
    jobName: selectedJob.value.jobName || selectedJob.value.name || '',
    clientName: selectedJob.value.clientName,
    staffId: props.staff?.id || '',
    staffName: props.staff?.name || '',
    date: props.date.toISOString().split('T')[0],
    startTime: timeMethod.value === 'time-range' ? formData.value.startTime : undefined,
    endTime: timeMethod.value === 'time-range' ? formData.value.endTime : undefined,
    hours: formData.value.hours,
    description: formData.value.description,
    billable: formData.value.billable,
    rateType: formData.value.rateType,
    wageRate: props.staff?.wageRate || 0,
    chargeOutRate: chargeOutRate.value,
    wageAmount: formData.value.hours * (props.staff?.wageRate || 0),
    billAmount: finalAmount.value,
    notes: formData.value.notes || '',
    isShopJob: selectedJob.value.isShopJob,
    createdAt: props.entry?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Required fields for TimeEntry interface
    jobPricingId: selectedJob.value.id,
    isBillable: formData.value.billable,
    rateMultiplier: getRateMultiplier(formData.value.rateType),
    timesheetDate: props.date.toISOString().split('T')[0],
    hoursSpent: formData.value.hours,
    estimatedHours: selectedJob.value.estimatedHours || 0
  }

  if (props.entry) {
    emit('save', { ...entryData, id: props.entry.id })
  } else {
    emit('save', entryData)
  }
}

// Watch for entry prop changes to populate form
watch(() => props.entry, (entry) => {
  if (entry) {
    formData.value = {
      jobId: entry.jobId || '',
      hours: entry.hours,
      startTime: entry.startTime || '',
      endTime: entry.endTime || '',
      description: entry.description,
      billable: entry.billable ?? true,
      rateType: entry.rateType || 'Ord',
      notes: entry.notes || ''
    }
    timeMethod.value = entry.startTime && entry.endTime ? 'time-range' : 'duration'
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for dialog open state
watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    nextTick(() => resetForm())
  }
})
</script>

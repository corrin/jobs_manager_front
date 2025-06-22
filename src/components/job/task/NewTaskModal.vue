<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { AlertCircle, Save, PlusSquare } from 'lucide-vue-next'
import { useJobsStore } from '@/stores/jobs'
import { toast } from 'vue-sonner'
import { TimeEntryCreateSchema } from '@/schemas/job.schemas'
import { ZodError } from 'zod'

// Interfaces
interface CompanyDefaults {
  time_markup: number
  charge_out_rate: number
  wage_rate: number
}

interface NewTaskData {
  taskName: string
  estimatedHours: number
  chargeMultiplier: number
}

interface Props {
  open: boolean
  jobId?: string
  jobChargeOutRate: number // Ex: 105.00
  companyDefaults: CompanyDefaults | null | undefined
  latestEstimatePricingId?: string
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'save', taskData: NewTaskData, addAnother: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const jobsStore = useJobsStore()

const taskName = ref('')
const estimatedHours = ref<number>(0)
const chargeMultiplier = ref<string>('1.0') // Shadcn Select usa string para valor
const isSaving = ref(false)
const validationErrors = ref<Record<string, string>>({})

const internalOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '$0.00'
  return `$${value.toFixed(2)}`
}

const effectiveHourlyRate = computed(() => {
  const multiplier = parseFloat(chargeMultiplier.value)
  const baseRate = props.jobChargeOutRate || props.companyDefaults?.charge_out_rate || 0
  if (isNaN(baseRate) || isNaN(multiplier)) return 0
  return baseRate * multiplier
})

const estimatedValueBeforeMarkup = computed(() => {
  if (estimatedHours.value === 0 || isNaN(effectiveHourlyRate.value)) return 0
  return estimatedHours.value * effectiveHourlyRate.value
})

const totalEstimatedAmount = computed(() => {
  const markup = props.companyDefaults?.time_markup ?? 0
  if (isNaN(estimatedValueBeforeMarkup.value) || isNaN(markup)) return 0
  return estimatedValueBeforeMarkup.value * (1 + markup)
})

const validateForm = (): boolean => {
  validationErrors.value = {}

  if (!props.latestEstimatePricingId) {
    validationErrors.value.general = 'No pricing ID available'
    return false
  }

  const formData = {
    job_pricing_id: props.latestEstimatePricingId,
    description: taskName.value,
    items: 1,
    minutes_per_item: (estimatedHours.value || 0) * 60,
    wage_rate: props.companyDefaults?.wage_rate || 0,
    charge_out_rate: effectiveHourlyRate.value,
  }

  try {
    TimeEntryCreateSchema.parse(formData)
    return true
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        const field = err.path[err.path.length - 1]
        if (typeof field === 'string') {
          validationErrors.value[field] = err.message
        }
      })
    }
    return false
  }
}

const resetForm = () => {
  taskName.value = ''
  estimatedHours.value = 0
  chargeMultiplier.value = '1.0'
  validationErrors.value = {}
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Resetar o formulário quando o modal é aberto, se não for para 'Save & Add Another'
      // A lógica de 'Save & Add Another' pode precisar de um tratamento mais específico se o reset for indesejado.
      // Por ora, resetamos sempre que abre.
      resetForm()
    }
  },
)

const handleSave = async (addAnother: boolean) => {
  // Validate form with Zod schema
  if (!validateForm()) {
    const firstError = Object.values(validationErrors.value)[0]
    toast.error('Validation Error', {
      description: firstError || 'Please fix the form errors and try again.',
    })
    return
  }

  if (!props.jobId) {
    toast.error('Error', {
      description: 'Job ID is required to save time entry.',
    })
    return
  }

  isSaving.value = true

  try {
    const taskData = {
      taskName: taskName.value,
      estimatedHours: estimatedHours.value,
      chargeMultiplier: parseFloat(chargeMultiplier.value),
    }

    await jobsStore.addTimeEntry(props.jobId, taskData)

    toast.success('Success', {
      description: 'Time entry added successfully.',
    })

    emit('save', taskData, addAnother)

    if (addAnother) {
      resetForm()
    } else {
      emit('update:open', false)
    }
  } catch (error) {
    console.error('Error saving time entry:', error)
    toast.error('Error', {
      description: 'Failed to save time entry. Please try again.',
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Dialog :open="internalOpen" @update:open="internalOpen = $event">
    <DialogContent class="sm:max-w-[525px]">
      <DialogHeader>
        <DialogTitle>New Task Entry</DialogTitle>
        <DialogDescription>
          Add a new time entry for this job. Calculated amounts include company markups.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <div class="grid gap-2">
          <Label for="taskName">Task Name</Label>
          <Input
            id="taskName"
            v-model="taskName"
            placeholder="E.g., Design, Fabrication, Installation"
            :class="cn(validationErrors.description && 'border-red-500')"
          />
          <p v-if="validationErrors.description" class="text-sm text-red-500">
            {{ validationErrors.description }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="estimatedHours">Estimated Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              v-model.number="estimatedHours"
              placeholder="E.g., 4.5"
              :class="cn(validationErrors.minutes_per_item && 'border-red-500')"
            />
            <p v-if="validationErrors.minutes_per_item" class="text-sm text-red-500">
              {{ validationErrors.minutes_per_item }}
            </p>
          </div>
          <div class="grid gap-2">
            <Label for="chargeMultiplier">Charge Multiplier</Label>
            <Select v-model="chargeMultiplier">
              <SelectTrigger id="chargeMultiplier">
                <SelectValue placeholder="Select multiplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1.0">1.0x (Standard)</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2.0">2.0x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          v-if="effectiveHourlyRate > 0"
          class="text-sm text-muted-foreground px-1 py-2 border-t border-b"
        >
          Effective Hourly Rate: {{ formatCurrency(effectiveHourlyRate) }} (Base Rate:
          {{
            formatCurrency(props.jobChargeOutRate || props.companyDefaults?.charge_out_rate || 0)
          }}
          x {{ chargeMultiplier }})
        </div>

        <div class="p-4 my-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center shadow">
          <p class="text-xs text-muted-foreground uppercase tracking-wider">
            Estimated Total Value
          </p>
          <p class="text-3xl font-semibold text-slate-900 dark:text-slate-50">
            {{ formatCurrency(totalEstimatedAmount) }}
          </p>
          <p
            v-if="(props.companyDefaults?.time_markup ?? 0) > 0"
            class="text-xs text-muted-foreground"
          >
            (Includes {{ (props.companyDefaults?.time_markup ?? 0) * 100 }}% time markup)
          </p>
        </div>

        <div
          v-if="validationErrors.general"
          class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md"
        >
          <AlertCircle class="h-4 w-4 text-red-500" />
          <p class="text-sm text-red-600">{{ validationErrors.general }}</p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleSave(true)" :disabled="isSaving">
          <PlusSquare class="mr-2 h-4 w-4" /> Save & Add Another
        </Button>
        <Button @click="handleSave(false)" :disabled="isSaving">
          <Save class="mr-2 h-4 w-4" />
          {{ isSaving ? 'Saving...' : 'Save Task' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

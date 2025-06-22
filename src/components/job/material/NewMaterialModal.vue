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
import { Save, PlusSquare, AlertCircle } from 'lucide-vue-next'
import { useJobsStore } from '@/stores/jobs'
import { toast } from 'vue-sonner'
import { MaterialEntryCreateSchema } from '@/schemas/job.schemas'
import { cn } from '@/lib/utils'
import { ZodError } from 'zod'

// Interfaces
interface CompanyDefaults {
  materials_markup?: number // Optional, as charge is direct percentage
}

interface NewMaterialData {
  description: string
  quantity: number
  unitPrice: number
  chargePercentage: number // Markup percentage for this specific material entry
}

interface Props {
  open: boolean
  jobId?: string
  companyDefaults?: CompanyDefaults | null // For potential future use or reference
  latestEstimatePricingId?: string
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'save', materialData: NewMaterialData, addAnother: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const jobsStore = useJobsStore()

const materialDescription = ref('')
const quantity = ref<number>(1) // Default quantity to 1
const unitPrice = ref<number>(0)
const chargePercentage = ref<number>(
  props.companyDefaults?.materials_markup !== undefined
    ? props.companyDefaults.materials_markup * 100
    : 0,
)
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

// --- Cost to you ---
const totalCost = computed(() => {
  if (quantity.value === 0 || unitPrice.value === 0) return 0
  return quantity.value * unitPrice.value
})

// --- What you'll charge ---
const totalChargeAmount = computed(() => {
  const cost = totalCost.value
  if (chargePercentage.value === 0 || isNaN(cost)) return cost // If no markup, charge is same as cost
  const markupDecimal = chargePercentage.value / 100
  return cost * (1 + markupDecimal)
})

const validateForm = (): boolean => {
  validationErrors.value = {}

  if (!props.latestEstimatePricingId) {
    validationErrors.value.general = 'No pricing ID available'
    return false
  }

  const formData = {
    job_pricing_id: props.latestEstimatePricingId,
    description: materialDescription.value,
    quantity: quantity.value || 1,
    unit_cost: unitPrice.value || 0,
    unit_revenue: totalChargeAmount.value / (quantity.value || 1),
  }

  try {
    MaterialEntryCreateSchema.parse(formData)
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
  materialDescription.value = ''
  quantity.value = 1
  unitPrice.value = 0
  validationErrors.value = {}
  // Reset chargePercentage to default from companyDefaults if available, else 0
  chargePercentage.value =
    props.companyDefaults?.materials_markup !== undefined
      ? props.companyDefaults.materials_markup * 100
      : 0
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetForm()
    }
  },
)

watch(
  () => props.companyDefaults,
  (newDefaults) => {
    // If companyDefaults changes and chargePercentage was based on it or is 0, update it.
    if (chargePercentage.value === 0 || newDefaults?.materials_markup !== undefined) {
      chargePercentage.value =
        newDefaults?.materials_markup !== undefined ? newDefaults.materials_markup * 100 : 0
    }
  },
  { deep: true },
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
      description: 'Job ID is required to save material entry.',
    })
    return
  }

  isSaving.value = true

  try {
    const materialData = {
      description: materialDescription.value,
      quantity: quantity.value,
      unitPrice: unitPrice.value,
      chargePercentage: chargePercentage.value,
    }

    await jobsStore.addMaterialEntry(props.jobId, materialData)

    toast.success('Success', {
      description: 'Material entry added successfully.',
    })

    emit('save', materialData, addAnother)

    if (addAnother) {
      resetForm()
    } else {
      emit('update:open', false)
    }
  } catch (error) {
    console.error('Error saving material entry:', error)
    toast.error('Error', {
      description: 'Failed to save material entry. Please try again.',
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Dialog :open="internalOpen" @update:open="internalOpen = $event">
    <DialogContent class="sm:max-w-[580px]">
      <DialogHeader>
        <DialogTitle>New Material Entry</DialogTitle>
        <DialogDescription>
          Add a new material entry for this job. Input costs and the charge percentage.
        </DialogDescription>
      </DialogHeader>

      <!-- General error display -->
      <div
        v-if="validationErrors.general"
        class="bg-red-50 border border-red-200 rounded-md p-3 mb-4"
      >
        <div class="flex items-center">
          <AlertCircle class="h-4 w-4 text-red-500 mr-2" />
          <span class="text-sm text-red-700">{{ validationErrors.general }}</span>
        </div>
      </div>

      <div class="grid gap-6 py-4">
        <div class="grid gap-2">
          <Label for="materialDescription">Material Description</Label>
          <Input
            id="materialDescription"
            v-model="materialDescription"
            placeholder="E.g., Timber, Screws, Paint"
            :class="cn(validationErrors.description && 'border-red-500 focus:border-red-500')"
          />
          <span v-if="validationErrors.description" class="text-sm text-red-600">
            {{ validationErrors.description }}
          </span>
        </div>

        <div class="grid gap-2">
          <Label for="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            v-model.number="quantity"
            placeholder="E.g., 10"
            :class="cn(validationErrors.quantity && 'border-red-500 focus:border-red-500')"
          />
          <span v-if="validationErrors.quantity" class="text-sm text-red-600">
            {{ validationErrors.quantity }}
          </span>
        </div>

        <div class="space-y-4 py-3">
          <h3 class="text-md font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">
            Cost to You
          </h3>
          <div class="grid grid-cols-2 gap-4 items-end">
            <div class="grid gap-2">
              <Label for="unitPrice">Unit Price</Label>
              <Input
                id="unitPrice"
                type="number"
                v-model.number="unitPrice"
                placeholder="0.00"
                :class="cn(validationErrors.unit_cost && 'border-red-500 focus:border-red-500')"
              />
              <span v-if="validationErrors.unit_cost" class="text-sm text-red-600">
                {{ validationErrors.unit_cost }}
              </span>
            </div>
            <div class="grid gap-1 text-right">
              <Label class="text-sm text-muted-foreground">Total Cost</Label>
              <p class="text-xl font-semibold h-10 flex items-center justify-end">
                {{ formatCurrency(totalCost) }}
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-4 py-3">
          <h3 class="text-md font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">
            What You'll Charge
          </h3>
          <div class="grid grid-cols-2 gap-4 items-end">
            <div class="grid gap-2">
              <Label for="chargePercentage">Charge % (Markup)</Label>
              <Input
                id="chargePercentage"
                type="number"
                v-model.number="chargePercentage"
                placeholder="E.g., 20 for 20%"
                :class="cn(validationErrors.unit_revenue && 'border-red-500 focus:border-red-500')"
              />
              <span v-if="validationErrors.unit_revenue" class="text-sm text-red-600">
                {{ validationErrors.unit_revenue }}
              </span>
            </div>
            <div class="grid gap-1 text-right">
              <Label class="text-sm text-muted-foreground">Total Charge</Label>
              <p class="text-xl font-semibold h-10 flex items-center justify-end">
                {{ formatCurrency(totalChargeAmount) }}
              </p>
            </div>
          </div>
          <p
            v-if="chargePercentage !== null && chargePercentage !== undefined"
            class="text-xs text-muted-foreground text-center"
          >
            Based on a {{ chargePercentage }}% markup on the total cost.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleSave(true)" :disabled="isSaving">
          <PlusSquare class="mr-2 h-4 w-4" /> Save & Add Another
        </Button>
        <Button @click="handleSave(false)" :disabled="isSaving">
          <Save class="mr-2 h-4 w-4" />
          {{ isSaving ? 'Saving...' : 'Save Material' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

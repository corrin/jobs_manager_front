<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { History, Plus, Trash2, Zap, Package } from 'lucide-vue-next'
import JobSelect from '@/components/purchasing/JobSelect.vue'
import type { z } from 'zod'
import { schemas } from '@/api/generated/api'
import { debugLog } from '../../utils/debug'
import { api } from '../../api/client'

type PurchaseOrderLine = z.infer<typeof schemas.PurchaseOrderLine>
type JobForPurchasing = z.infer<typeof schemas.JobForPurchasing>
type AllocationItem = z.infer<typeof schemas.AllocationItem>

type AllocationDeleteRequest = z.infer<typeof schemas.AllocationDeleteRequest>

interface Props {
  line: PurchaseOrderLine
  poId: string
  jobs: JobForPurchasing[]
  existing: AllocationItem[]
  defaultRetailRate?: number
  stockHoldingJobId?: string
  disabled?: boolean
  poStatus?: string
}
const props = defineProps<Props>()

const emit = defineEmits<{
  save: [editorState: { rows: EditorRow[] }]
  close: []
  'allocation-deleted': [data: { allocationId: string; allocationType: string }]
}>()

interface EditorRow {
  job_id: string
  quantity: number
  retail_rate?: number
  stock_location?: string
  metal_type?: string
  alloy?: string
  specifics?: string
  dimensions?: string
}

// Separate state tracking to avoid race conditions
const open = ref(false)
const internalOpen = ref(false) // Track our own state independently
const rows = ref<EditorRow[]>([])

// Check if Receipt column should be visible based on PO status
const isReceiptVisible = computed(() => {
  const validStatuses = [
    'submitted',
    'submitted_to_supplier',
    'partially_received',
    'fully_received',
  ]
  return validStatuses.includes(props.poStatus || '')
})

// Derived calculations
const thisReceiptTotal = computed(() =>
  rows.value.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
)
const remaining = computed(() => {
  // Calculate remaining based on ordered quantity minus what's already been received
  const orderedQuantity = props.line.quantity || 0
  const alreadyReceived = props.line.received_quantity || 0
  const baseRemaining = Math.max(0, orderedQuantity - alreadyReceived)

  // Don't subtract current receipt total from remaining - this allows adding more allocations
  return baseRemaining
})

// Validation
const overReceipt = computed(() => thisReceiptTotal.value > remaining.value)
const hasNegative = computed(() => rows.value.some((r) => (r.quantity ?? 0) < 0))
const canAddRow = computed(() => remaining.value > 0 && !overReceipt.value)

// Enhanced jobs list with stock holding job highlighted
const enhancedJobs = computed(() => {
  return props.jobs.map((job) => ({
    ...job,
    isStockHolding: job.id === props.stockHoldingJobId,
    displayName:
      job.id === props.stockHoldingJobId
        ? `📦 ${job.name} (Stock)`
        : `${job.job_number || job.number} - ${job.name || job.description}`,
  }))
})

function openEditor() {
  if (props.disabled || !isReceiptVisible.value) return

  if (!rows.value.length) {
    // Default row - prefer selected job from PO line, fallback to stock
    const selectedJob = props.jobs.find((j) => j.id === props.line.job_id)
    const defaultJobId = selectedJob?.id || props.stockHoldingJobId || props.jobs[0]?.id

    if (defaultJobId) {
      rows.value.push({
        job_id: defaultJobId,
        quantity: Math.min(remaining.value, props.line.quantity || 1),
        retail_rate: props.defaultRetailRate ?? 0, // Always include retail rate
      })
    }
  }

  // Set both states
  internalOpen.value = true
  open.value = true

  debugLog('Opening popover', { internalOpen: internalOpen.value, open: open.value })

  nextTick(() => {
    // Focus first quantity input
    const firstInput = document.querySelector('.allocation-quantity-input') as HTMLInputElement
    firstInput?.focus()
  })
}

// Watch for external changes to open state (from Popover component)
watch(open, (newValue, oldValue) => {
  debugLog('Open state changed', { newValue, oldValue, internalOpen: internalOpen.value })

  // If popover was closed externally and we were tracking it as open
  if (!newValue && internalOpen.value) {
    debugLog('Popover closed externally, triggering save...')
    internalOpen.value = false
    saveOnClose()
    emit('close')
  }
  // If popover was opened externally
  else if (newValue && !internalOpen.value) {
    debugLog('Popover opened externally')
    internalOpen.value = true
  }
})

// Handle explicit close (ESC key, etc.)
function closePopover() {
  debugLog('Explicitly closing popover')
  internalOpen.value = false
  open.value = false
  saveOnClose()
  emit('close')
}

// Quick actions with keyboard shortcuts
function allocateRemaining() {
  if (!remaining.value) return
  if (!rows.value.length) {
    addRow()
  }
  if (rows.value.length > 0) {
    rows.value[0].quantity = remaining.value
  }
}

function allocateAll() {
  allocateRemaining()
}

// Keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  if (!internalOpen.value) return

  // Shift + A = Allocate All
  if (event.shiftKey && event.key.toLowerCase() === 'a') {
    event.preventDefault()
    allocateAll()
  }

  // Shift + R = Allocate Remaining
  if (event.shiftKey && event.key.toLowerCase() === 'r') {
    event.preventDefault()
    allocateRemaining()
  }

  // Shift + N = Add Row
  if (event.shiftKey && event.key.toLowerCase() === 'n') {
    event.preventDefault()
    if (canAddRow.value) addRow()
  }

  // Escape = Close
  if (event.key === 'Escape') {
    event.preventDefault()
    closePopover()
  }
}

// Save only when popover closes
let lastSavedState = ''

function saveOnClose() {
  debugLog('saveOnClose called', {
    rowsCount: rows.value.length,
    hasNegative: hasNegative.value,
    overReceipt: overReceipt.value,
    internalOpen: internalOpen.value,
  })

  // Clean zero rows and invalid rows
  const validRows = rows.value.filter((r) => {
    const quantity = Number(r.quantity) || 0
    return quantity > 0 && r.job_id
  })

  debugLog('Valid rows after filtering:', validRows)

  // Don't save if no valid rows or if validation fails
  if (!validRows.length) {
    debugLog('No valid rows to save')
    return
  }
  if (hasNegative.value || overReceipt.value) {
    debugLog('Validation failed - not saving', {
      hasNegative: hasNegative.value,
      overReceipt: overReceipt.value,
    })
    return
  }

  // Prevent duplicate saves by comparing state
  const currentState = JSON.stringify(validRows)
  if (currentState === lastSavedState) {
    debugLog('State unchanged - not saving')
    return
  }

  // Transform rows to include metadata for stock allocations
  const transformedRows = validRows.map((row) => {
    const isStock = row.job_id === props.stockHoldingJobId
    const baseRow: Record<string, unknown> = {
      job_id: row.job_id,
      quantity: row.quantity,
      retail_rate: row.retail_rate,
    }

    // Add metadata for stock allocations
    if (isStock) {
      baseRow.stock_location = row.stock_location || props.line.location || ''
      baseRow.metal_type = row.metal_type || props.line.metal_type || ''
      baseRow.alloy = row.alloy || props.line.alloy || ''
      baseRow.specifics = row.specifics || props.line.specifics || ''
      baseRow.dimensions = row.dimensions || props.line.dimensions || ''
    }

    return baseRow
  })

  debugLog('Emitting save event with transformed rows:', transformedRows)
  lastSavedState = currentState
  rows.value = validRows
  emit('save', { rows: transformedRows })
}

// Add new row
function addRow() {
  if (!canAddRow.value) return

  const defaultJobId = props.line.job_id || props.stockHoldingJobId || props.jobs[0]?.id
  if (!defaultJobId) return

  const isStockJob = defaultJobId === props.stockHoldingJobId
  const newRow: EditorRow = {
    job_id: defaultJobId,
    quantity: Math.min(1, remaining.value),
    retail_rate: props.defaultRetailRate ?? 0, // Always include retail rate
  }

  // Pre-populate stock fields if it's a stock job
  if (isStockJob) {
    newRow.stock_location = props.line.location || ''
    newRow.metal_type = props.line.metal_type || ''
    newRow.alloy = props.line.alloy || ''
    newRow.specifics = props.line.specifics || ''
    newRow.dimensions = props.line.dimensions || ''
  }

  rows.value.push(newRow)

  // Focus the new quantity input
  nextTick(() => {
    const inputs = document.querySelectorAll('.allocation-quantity-input')
    const lastInput = inputs[inputs.length - 1] as HTMLInputElement
    lastInput?.focus()
  })
}

// Remove row
function removeRow(index: number) {
  rows.value.splice(index, 1)
}

// Handle job selection
function handleJobSelected(rowIndex: number, job: JobForPurchasing | null) {
  if (!job) return

  const row = rows.value[rowIndex]
  if (!row) return

  row.job_id = job.id

  // Set retail rate and populate fields based on job type
  if (job.id === props.stockHoldingJobId) {
    // Stock jobs also get retail rate - it's always visible now
    row.retail_rate = row.retail_rate ?? props.defaultRetailRate ?? 0
    // Pre-populate stock fields from PO line
    row.stock_location = props.line.location || ''
    row.metal_type = props.line.metal_type || ''
    row.alloy = props.line.alloy || ''
    row.specifics = props.line.specifics || ''
    row.dimensions = props.line.dimensions || ''
  } else {
    row.retail_rate = row.retail_rate ?? props.defaultRetailRate ?? 0
    // Clear stock fields for non-stock jobs
    row.stock_location = undefined
    row.metal_type = undefined
    row.alloy = undefined
    row.specifics = undefined
    row.dimensions = undefined
  }
}

// Check if job is stock holding
function isStockHoldingJob(jobId: string): boolean {
  return jobId === props.stockHoldingJobId
}

// Page leave confirmation
let hasUnsavedChanges = false

function checkUnsavedChanges() {
  hasUnsavedChanges = internalOpen.value && rows.value.some((r) => r.quantity > 0)
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  checkUnsavedChanges()
  if (hasUnsavedChanges) {
    event.preventDefault()
    event.returnValue = 'You have unsaved receipt allocations. Are you sure you want to leave?'
    return event.returnValue
  }
}

// Delete existing allocation
async function deleteAllocation(allocationId: string, allocationType: 'job' | 'stock') {
  try {
    debugLog('Deleting allocation:', { allocationId, allocationType })

    const payload: AllocationDeleteRequest = {
      allocation_id: allocationId,
      allocation_type: allocationType,
    }

    const response = await api.deleteAllocation(payload, {
      params: { po_id: String(props.poId), line_id: String(props.line.id) },
    })
    if (!response.success) {
      throw new Error(`Failed to delete allocation: ${response.statusText}`)
    }

    const result = response
    debugLog('Delete result:', result)

    if (result.success) {
      // Emit event to refresh allocations
      emit('allocation-deleted', { allocationId, allocationType })
      return true
    } else {
      throw new Error(result.message || 'Failed to delete allocation')
    }
  } catch (error) {
    debugLog('Error deleting allocation:', error)
    throw error
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('beforeunload', handleBeforeUnload)
  debugLog('Props of AllocationCellEditor: ', props)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div class="w-full">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <div class="w-full">
          <Button
            size="sm"
            variant="outline"
            :disabled="disabled || !isReceiptVisible"
            :aria-label="`Edit receipt allocations for line ${line.id}`"
            @click.stop.prevent="openEditor"
            class="w-full text-xs min-h-[32px] hover:bg-blue-50 transition-colors"
          >
            <div class="flex items-center justify-center gap-2 p-1">
              <Package class="w-3 h-3 text-blue-600" />
              <span class="font-medium text-blue-700">
                {{ existing.length > 0 ? 'Check allocations' : 'Add allocation' }}
              </span>
              <span v-if="remaining > 0" class="text-xs text-muted-foreground"
                >({{ remaining }} left)</span
              >
            </div>
          </Button>
        </div>
      </PopoverTrigger>

      <PopoverContent
        class="p-6 w-full !max-h-[65vh] overflow-y-auto"
        role="dialog"
        :aria-label="`Receipt editor for line ${line.id}`"
        :side="existing.length > 0 ? 'top' : 'bottom'"
        :align="'center'"
        :sideOffset="4"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="text-sm font-medium flex items-center gap-2">
            <Package class="w-4 h-4 text-blue-600" />
            Receipt Allocation
          </div>
          <div class="flex gap-2 p-2">
            <Button
              class="p-2"
              size="xs"
              variant="ghost"
              :disabled="!remaining"
              @click="allocateRemaining"
              title="Shift+R"
            >
              <Zap class="w-3 h-3 mr-1" />
              Remaining
            </Button>
            <Button
              class="p-2"
              size="xs"
              variant="ghost"
              :disabled="!remaining"
              @click="allocateAll"
              title="Shift+A"
            >
              All
            </Button>
          </div>
        </div>

        <!-- Validation warnings -->
        <div
          v-if="overReceipt"
          class="p-2 mb-2 text-xs rounded border border-red-200 bg-red-50 text-red-700"
        >
          ⚠️ Exceeds remaining quantity
        </div>

        <!-- Previous Allocations (saved, with delete functionality) -->
        <div
          v-if="existing.length > 0"
          class="mb-3 p-2 border rounded-lg bg-blue-50 border-blue-200"
        >
          <div class="flex items-center gap-1 mb-2">
            <History class="w-3 h-3 text-blue-600 flex-shrink-0" />
            <span class="text-xs font-medium text-blue-800">Previous Allocations</span>
          </div>

          <div class="space-y-1">
            <div
              v-for="allocation in existing"
              :key="allocation.allocation_id"
              class="flex items-center justify-between text-xs bg-white rounded p-2 border"
            >
              <div class="flex-1">
                <div class="font-medium text-gray-800">
                  {{ allocation.job_name || 'Unknown Job' }}
                </div>
                <div class="text-gray-600">
                  Qty: {{ allocation.quantity }}
                  <span v-if="allocation.stock_location">({{ allocation.stock_location }})</span>
                </div>
              </div>
              <Button
                size="xs"
                variant="ghost"
                class="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                @click="
                  deleteAllocation(
                    allocation.allocation_id,
                    allocation.stock_location ? 'stock' : 'job',
                  )
                "
                title="Delete this allocation"
              >
                <Trash2 class="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Allocation Rows -->
        <div class="flex-1 overflow-auto pr-1 space-y-3 max-h-[200px]">
          <div
            v-for="(row, idx) in rows"
            :key="idx"
            class="p-3 border rounded-lg bg-gray-50 space-y-3"
          >
            <!-- Job Selection -->
            <div class="space-y-1">
              <label class="text-xs font-medium text-gray-700">Job</label>
              <JobSelect
                :model-value="row.job_id"
                :jobs="enhancedJobs"
                :placeholder="
                  isStockHoldingJob(row.job_id) ? '📦 Stock Holding Job' : 'Select job...'
                "
                @job-selected="(job) => handleJobSelected(idx, job)"
                class="w-full"
              />

              <!-- Special indicator for stock job -->
              <div
                v-if="isStockHoldingJob(row.job_id)"
                class="text-xs text-orange-600 flex items-center gap-1"
              >
                <Package class="w-3 h-3" />
                Stock Holding Job
              </div>
            </div>

            <!-- Quantity and Actions -->
            <div class="flex items-center gap-2">
              <div class="flex-1">
                <label class="text-xs font-medium text-gray-700">Quantity</label>
                <Input
                  type="number"
                  class="allocation-quantity-input text-right"
                  v-model.number="row.quantity"
                  :min="0"
                  :max="remaining + (row.quantity || 0)"
                  step="0.01"
                />
              </div>

              <Button
                size="xs"
                variant="outline"
                @click="removeRow(idx)"
                class="mt-5 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Remove this allocation"
              >
                <Trash2 class="w-3 h-3" />
              </Button>
            </div>

            <!-- Retail Rate (always visible) -->
            <div class="space-y-1">
              <label class="text-xs font-medium text-gray-700">Retail Rate (%)</label>
              <Input
                type="number"
                v-model.number="row.retail_rate"
                min="0"
                max="100"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <!-- Stock fields (for stock holding job) -->
            <div
              v-if="isStockHoldingJob(row.job_id)"
              class="space-y-2 mt-2 p-2 bg-orange-50 rounded border border-orange-200 hidden"
            >
              <div class="text-xs font-medium text-orange-800 flex items-center gap-1">
                <Package class="w-3 h-3" />
                Stock Details (auto-populated from PO line)
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs text-gray-700">Location</label>
                  <Input
                    type="text"
                    v-model="row.stock_location"
                    placeholder="Location"
                    class="text-xs"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-700">Metal Type</label>
                  <Input
                    type="text"
                    v-model="row.metal_type"
                    placeholder="Metal type"
                    class="text-xs"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-700">Alloy</label>
                  <Input type="text" v-model="row.alloy" placeholder="Alloy" class="text-xs" />
                </div>
                <div>
                  <label class="text-xs text-gray-700">Specifics</label>
                  <Input
                    type="text"
                    v-model="row.specifics"
                    placeholder="Specifics"
                    class="text-xs"
                  />
                </div>
              </div>

              <div>
                <label class="text-xs text-gray-700">Dimensions</label>
                <Input
                  type="text"
                  v-model="row.dimensions"
                  placeholder="Dimensions"
                  class="text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-between items-center mt-4 pt-3 border-t">
          <div class="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              @click="addRow"
              :disabled="!canAddRow"
              :title="
                !canAddRow
                  ? 'Cannot add more - exceeds remaining quantity'
                  : 'Add new allocation (Shift+N)'
              "
              class="flex items-center gap-1"
            >
              <Plus class="w-3 h-3" />
              Add
            </Button>

            <!-- Tooltip for disabled Add button -->
            <div v-if="!canAddRow" class="text-xs text-orange-600">
              Cannot exceed remaining quantity
            </div>
          </div>

          <div class="text-xs text-gray-600 space-y-1 ml-5">
            <div class="font-medium">This Receipt: {{ thisReceiptTotal }}</div>
            <div class="text-xs text-gray-500">
              Shortcuts: Shift+A (All), Shift+R (Remaining), Shift+N (Add), Esc (Close)
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>

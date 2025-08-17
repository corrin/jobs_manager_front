<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import DataTable from '@/components/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import { Trash2, Settings2 } from 'lucide-vue-next'
import { metalTypeOptions } from '@/utils/metalType'
import ItemSelect from '@/views/purchasing/ItemSelect.vue'
import JobSelect from './JobSelect.vue'
import AllocationCellEditor from '@/components/purchasing/AllocationCellEditor.vue'
import { schemas } from '@/api/generated/api'
import type { DataTableRowContext } from '@/utils/data-table-types'
import { z } from 'zod'
import { debugLog } from '../../utils/debug'
import { useStockStore } from '@/stores/stockStore'

type PurchaseOrderLine = z.infer<typeof schemas.PurchaseOrderLine>
type JobForPurchasing = z.infer<typeof schemas.JobForPurchasing>
type AllocationItem = z.infer<typeof schemas.AllocationItem>
type Props = {
  lines: PurchaseOrderLine[]
  jobs: JobForPurchasing[]
  readOnly?: boolean
  jobsReadOnly?: boolean
  // New props for receipt functionality
  existingAllocations?: Record<string, AllocationItem[]>
  defaultRetailRate?: number
  stockHoldingJobId?: string
  poStatus?: string
  poId: string
}

type Emits = {
  (e: 'update:lines', lines: PurchaseOrderLine[]): void
  (e: 'add-line'): void
  (e: 'delete-line', id: string | number): void
  (e: 'receipt:save', payload: { lineId: string; editorState: LineEditorState }): void
  (e: 'allocation-deleted', data: { allocationId: string; allocationType: string }): void
}

interface LineEditorState {
  rows: {
    target: 'job' | 'stock'
    job_id?: string
    quantity: number
    retail_rate?: number // UI-only today
    stock_location?: string // UI-only today
    po_id: string
  }[]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const stockStore = useStockStore()

const showAdditionalFieldsModal = ref(false)
const editingLineIndex = ref<number>(-1)
const additionalFields = ref({
  metal_type: '',
  alloy: '',
  specifics: '',
  location: '',
  dimensions: '',
})

const openAdditionalFieldsModal = (lineIndex: number) => {
  if (props.readOnly) return

  editingLineIndex.value = lineIndex
  const line = props.lines[lineIndex]

  additionalFields.value = {
    metal_type: line.metal_type || '',
    alloy: line.alloy || '',
    specifics: line.specifics || '',
    location: line.location || '',
    dimensions: line.dimensions || '',
  }

  showAdditionalFieldsModal.value = true
}

const saveAdditionalFields = () => {
  if (editingLineIndex.value === -1) return

  const updated = props.lines.map((line, idx) =>
    idx === editingLineIndex.value
      ? {
          ...line,
          metal_type: additionalFields.value.metal_type || undefined,
          alloy: additionalFields.value.alloy || undefined,
          specifics: additionalFields.value.specifics || undefined,
          location: additionalFields.value.location || undefined,
          dimensions: additionalFields.value.dimensions || undefined,
        }
      : line,
  )

  emit('update:lines', updated)
  closeAdditionalFieldsModal()
}

const closeAdditionalFieldsModal = () => {
  showAdditionalFieldsModal.value = false
  editingLineIndex.value = -1
  additionalFields.value = {
    metal_type: '',
    alloy: '',
    specifics: '',
    location: '',
    dimensions: '',
  }
}

const handleAddLine = () => {
  if (props.readOnly) {
    return
  }

  emit('add-line')
}

const isPoSubmitted = computed(() => props.poStatus === 'submitted_to_supplier')
const isColumnDisabled = computed(() => props.readOnly || isPoSubmitted.value)

// Check if Receipt column should be visible based on PO status
const isReceiptColumnVisible = computed(() => {
  const validStatuses = [
    'submitted',
    'submitted_to_supplier',
    'partially_received',
    'fully_received',
  ]
  return validStatuses.includes(props.poStatus || '')
})

const columns = computed(() =>
  [
    {
      id: 'item_code',
      header: 'Item',
      cell: ({ row }: DataTableRowContext) =>
        h(ItemSelect, {
          modelValue: row.original.item_code,
          disabled: isColumnDisabled.value,
          'onUpdate:modelValue': isColumnDisabled.value
            ? undefined
            : (val: string | null) => {
                console.log('🔄 PoLinesTable: Received modelValue update:', val)
                console.log('📦 PoLinesTable: Available stock items:', stockStore.items.length)

                const found = stockStore.items.find((i) => i.id === val)
                console.log('🎯 PoLinesTable: Found stock item:', found)

                const updated = props.lines.map((l, idx) =>
                  idx === row.index
                    ? {
                        ...l,
                        // Auto-populate all fields from stock item when selected
                        ...(found && {
                          description: found.description || l.description,
                          unit_cost: found.unit_cost || l.unit_cost,
                          metal_type: found.metal_type || l.metal_type,
                          alloy: found.alloy || l.alloy,
                          specifics: found.specifics || l.specifics,
                          location: found.location || l.location,
                          item_code: found.item_code || null,
                        }),
                      }
                    : l,
                )

                console.log('📝 PoLinesTable: Updated line:', updated[row.index])
                emit('update:lines', updated)
              },
        }),
      meta: { editable: !isColumnDisabled.value },
    },
    {
      id: 'description',
      header: 'Description',
      cell: ({ row }: DataTableRowContext) =>
        h(Input, {
          modelValue: row.original.description,
          disabled: isColumnDisabled.value,
          class: 'w-full',
          onClick: (e: Event) => e.stopPropagation(),
          'onUpdate:modelValue': isColumnDisabled.value
            ? undefined
            : (val: string) => {
                const updated = props.lines.map((l, idx) =>
                  idx === row.index ? { ...l, description: val } : l,
                )
                emit('update:lines', updated)
              },
        }),
    },
    {
      id: 'job_id',
      header: 'Job',
      cell: ({ row }: DataTableRowContext) =>
        h(JobSelect, {
          modelValue: row.original.job_id || '',
          required: false,
          placeholder: 'Select Job (Optional)',
          jobs: props.jobs,
          disabled: props.jobsReadOnly ?? isColumnDisabled.value,
          'onUpdate:modelValue':
            (props.jobsReadOnly ?? isColumnDisabled.value)
              ? undefined
              : (val: string | null) => {
                  const updated = props.lines.map((l, idx) =>
                    idx === row.index ? { ...l, job_id: val || undefined } : l,
                  )
                  emit('update:lines', updated)
                },
          onJobSelected:
            (props.jobsReadOnly ?? isColumnDisabled.value)
              ? undefined
              : (job: JobForPurchasing | null) => {
                  if (job) {
                    const updated = props.lines.map((l, idx) =>
                      idx === row.index
                        ? {
                            ...l,
                            job_id: job.id,
                            job_number: job.job_number?.toString(),
                            job_name: job.name,
                            client_name: job.client_name,
                          }
                        : l,
                    )
                    emit('update:lines', updated)
                  }
                },
        }),
      meta: { editable: !(props.jobsReadOnly ?? isColumnDisabled.value) },
    },
    {
      id: 'quantity',
      header: 'Qty',
      cell: ({ row }: DataTableRowContext) =>
        h(Input, {
          type: 'number',
          step: '1',
          min: '0',
          modelValue: row.original.quantity,
          disabled: isColumnDisabled.value,
          class: 'w-20 text-right',
          onClick: (e: Event) => e.stopPropagation(),
          'onUpdate:modelValue': isColumnDisabled.value
            ? undefined
            : (val: string | number) => {
                const num = Number(val)
                if (!Number.isNaN(num)) {
                  const updated = props.lines.map((l, idx) =>
                    idx === row.index ? { ...l, quantity: num } : l,
                  )
                  emit('update:lines', updated)
                }
              },
        }),
    },
    {
      id: 'unit_cost',
      header: 'Unit Cost',
      cell: ({ row }: DataTableRowContext) =>
        h(Input, {
          type: 'number',
          step: '0.01',
          min: '0',
          modelValue: row.original.unit_cost ?? '',
          disabled: !!row.original.item_code || row.original.price_tbc || isColumnDisabled.value,
          class: 'w-24 text-right',
          onClick: (e: Event) => e.stopPropagation(),
          'onUpdate:modelValue': isColumnDisabled.value
            ? undefined
            : (val: string | number) => {
                const cost = val === '' ? null : Number(val)
                const updated = props.lines.map((l, idx) =>
                  idx === row.index ? { ...l, unit_cost: cost } : l,
                )
                emit('update:lines', updated)
              },
        }),
    },
    {
      id: 'price_tbc',
      header: 'Price TBC',
      cell: ({ row }: DataTableRowContext) =>
        h(Checkbox, {
          modelValue: row.original.price_tbc,
          disabled:
            (row.original.unit_cost !== null && Number(row.original.unit_cost) > 0) ||
            isColumnDisabled.value,
          'onUpdate:modelValue': isColumnDisabled.value
            ? undefined
            : (checked: boolean) => {
                const updated = props.lines.map((l, idx) =>
                  idx === row.index ? { ...l, price_tbc: checked } : l,
                )
                emit('update:lines', updated)
              },
          class: 'mx-auto',
        }),
      meta: { editable: !isColumnDisabled.value },
    },
    {
      id: 'additional_fields',
      header: 'Additional Fields',
      cell: ({ row }: DataTableRowContext) => {
        const hasAdditionalData = !!(
          row.original.metal_type ||
          row.original.alloy ||
          row.original.specifics ||
          row.original.location ||
          row.original.dimensions
        )

        return h(
          Button,
          {
            variant: hasAdditionalData ? 'default' : 'outline',
            size: 'sm',
            disabled: isColumnDisabled.value,
            onClick: isColumnDisabled.value
              ? undefined
              : () => openAdditionalFieldsModal(row.index),
          },
          () => [h(Settings2, { class: 'w-4 h-4 mr-1' }), hasAdditionalData ? 'Edit' : 'Add'],
        )
      },
      meta: { editable: !isColumnDisabled.value },
    },
    {
      id: 'receipt',
      header: 'Receipt',
      cell: ({ row }: DataTableRowContext) => {
        const line = row.original
        const lineId = line.id as string

        // Only show receipt editor for lines that have been saved (have an ID)
        if (!lineId) {
          return h('div', { class: 'text-xs text-gray-500 text-center p-2' }, 'Save line first')
        }

        const existing = props.existingAllocations?.[lineId] || []
        return h(AllocationCellEditor, {
          line,
          jobs: props.jobs,
          existing,
          defaultRetailRate: props.defaultRetailRate,
          stockHoldingJobId: props.stockHoldingJobId,
          disabled: props.readOnly,
          poStatus: props.poStatus,
          poId: props.poId,
          onSave: (editorState: LineEditorState) => emit('receipt:save', { lineId, editorState }),
          'onAllocation-deleted': (data: { allocationId: string; allocationType: string }) =>
            emit('allocation-deleted', data),
        })
      },
      meta: { editable: !props.readOnly },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: DataTableRowContext) =>
        h(
          Button,
          {
            variant: 'destructive',
            size: 'icon',
            disabled: isColumnDisabled.value,
            onClick: isColumnDisabled.value
              ? undefined
              : () => {
                  if (row.original.id) {
                    emit('delete-line', row.original.id)
                  } else {
                    emit('delete-line', row.index)
                  }
                },
          },
          () => h(Trash2, { class: 'w-4 h-4' }),
        ),
      meta: { editable: !isColumnDisabled.value },
    },
  ].filter((column) => {
    // Hide Receipt column when PO status doesn't allow receipts
    if (column.id === 'receipt' && !isReceiptColumnVisible.value) {
      return false
    }
    return true
  }),
)

onMounted(() => {
  debugLog('Props ', props)
})
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto max-h-[60vh]">
      <DataTable
        :columns="columns"
        :data="props.lines"
        @rowClick="() => {}"
        :page-size="1000"
        :hide-footer="true"
      />
    </div>
    <div class="sticky bottom-0 bg-white z-10 p-2 border-t">
      <Button class="w-full" :disabled="isColumnDisabled" @click="handleAddLine">
        ＋ Add line
      </Button>
    </div>

    <!-- Additional Fields Modal using Dialog component -->
    <Dialog v-model:open="showAdditionalFieldsModal">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Additional Fields</DialogTitle>
          <DialogDescription>
            Fill in additional details for this purchase order line.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- Metal Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Metal Type </label>
            <select
              v-model="additionalFields.metal_type"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select metal type...</option>
              <option v-for="option in metalTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Alloy -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Alloy </label>
            <Input v-model="additionalFields.alloy" type="text" placeholder="e.g., 304, 6061" />
          </div>

          <!-- Specifics -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Specifics </label>
            <Input
              v-model="additionalFields.specifics"
              type="text"
              placeholder="e.g., m8 countersunk socket screw"
            />
          </div>

          <!-- Location -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Location </label>
            <Input
              v-model="additionalFields.location"
              type="text"
              placeholder="Where this item will be stored"
            />
          </div>

          <!-- Dimensions -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Dimensions </label>
            <Input
              v-model="additionalFields.dimensions"
              type="text"
              placeholder="Product dimensions"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <Button variant="outline" @click="closeAdditionalFieldsModal"> Cancel </Button>
          <Button @click="saveAdditionalFields"> Save </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import DataTable from '@/components/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Package, MapPin, DollarSign, Target, History } from 'lucide-vue-next'
import { useDeliveryReceiptStore } from '@/stores/deliveryReceiptStore'
import { formatMetalType } from '@/utils/metalType'
import type { PurchaseOrderLine, Job, DeliveryAllocation } from '@/types/purchasing'

interface ExistingAllocation {
  quantity: number
  type: string
  job_id: string
  job_name: string
  allocation_date?: string
  description?: string
  retail_rate?: number
  stock_location?: string
}

interface DataTableRowContext {
  row: {
    original: PurchaseOrderLine
    index: number
  }
}

type Props = {
  lines: PurchaseOrderLine[]
  jobs: Job[]
  allocations: Record<string, DeliveryAllocation[]>
  existingAllocations?: Record<string, ExistingAllocation[]>
}

type Emits = {
  (e: 'update:allocations', allocations: Record<string, DeliveryAllocation[]>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const deliveryReceiptStore = useDeliveryReceiptStore()

// Modal state
const isModalOpen = ref(false)
const editingLineId = ref<string | null>(null)
const editingAllocationIndex = ref<number | null>(null)
const modalData = ref<DeliveryAllocation>({
  job_id: null,
  stock_location: null,
  quantity: 0,
  retail_rate: 0,
})

const getLineAllocations = (lineId: string): DeliveryAllocation[] => {
  return props.allocations[lineId] || []
}

const getExistingAllocations = (lineId: string): ExistingAllocation[] => {
  return props.existingAllocations?.[lineId] || []
}

const getTotalReceived = (lineId: string): number => {
  return getLineAllocations(lineId).reduce((sum, allocation) => sum + allocation.quantity, 0)
}

const getRemaining = (line: PurchaseOrderLine): number => {
  // Calculate remaining based on ordered quantity minus received quantity
  // received_quantity should now be accurately accumulated by the backend
  const remaining = Math.max(0, line.quantity - (line.received_quantity || 0))

  // Also subtract any current allocations being made in this receipt
  const currentAllocations = getTotalReceived(line.id)

  return Math.max(0, remaining - currentAllocations)
}

const getJobName = (jobId: string | null): string => {
  if (!jobId) return 'Stock'
  const job = props.jobs.find((j) => j.id === jobId)
  // Show "Stock" for stock holding job, otherwise show the job name
  return job?.is_stock_holding ? 'Stock' : job?.name || 'Unknown Job'
}

const truncateText = (text: string, maxLength: number = 12): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const openModal = (lineId: string, allocationIndex?: number) => {
  editingLineId.value = lineId
  editingAllocationIndex.value = allocationIndex ?? null

  const line = props.lines.find((l) => l.id === lineId)
  const remaining = line ? getRemaining(line) : 0

  if (allocationIndex !== undefined) {
    // Editing existing allocation
    const allocation = getLineAllocations(lineId)[allocationIndex]
    modalData.value = { ...allocation }
  } else {
    // Creating new allocation - use default retail rate from company defaults
    modalData.value = {
      job_id: props.jobs[0]?.id || null,
      stock_location: null,
      quantity: Math.min(remaining, 1),
      retail_rate: deliveryReceiptStore.getDefaultRetailRate(),
    }
  }

  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingLineId.value = null
  editingAllocationIndex.value = null
  modalData.value = {
    job_id: null,
    stock_location: null,
    quantity: 0,
    retail_rate: deliveryReceiptStore.getDefaultRetailRate(),
  }
}

const saveAllocation = () => {
  if (!editingLineId.value) return

  const newAllocations = { ...props.allocations }
  if (!newAllocations[editingLineId.value]) {
    newAllocations[editingLineId.value] = []
  }

  const allocations = [...newAllocations[editingLineId.value]]

  // Create the allocation data
  const allocationData = { ...modalData.value }

  // If job_id is null (stock holding), use the actual stock holding job ID
  if (allocationData.job_id === null) {
    const stockHolding = props.jobs.find((job) => job.is_stock_holding)
    if (stockHolding) {
      allocationData.job_id = stockHolding.id
    }
  }

  if (editingAllocationIndex.value !== null) {
    // Update existing allocation
    allocations[editingAllocationIndex.value] = allocationData
  } else {
    // Add new allocation
    allocations.push(allocationData)
  }

  newAllocations[editingLineId.value] = allocations
  emit('update:allocations', newAllocations)
  closeModal()
}

const removeAllocation = (lineId: string, index: number) => {
  const newAllocations = { ...props.allocations }
  if (newAllocations[lineId]) {
    newAllocations[lineId] = newAllocations[lineId].filter((_, i) => i !== index)
  }
  emit('update:allocations', newAllocations)
}

const columns = computed(() => [
  {
    id: 'description',
    header: 'Description',
    headerClass: 'text-center',
    cell: ({ row }: DataTableRowContext) => {
      const line = row.original
      return h('div', { class: 'space-y-1' }, [
        h('div', { class: 'font-medium' }, line.description || '-'),
        line.part_no ? h('div', { class: 'text-sm text-gray-500' }, `Part: ${line.part_no}`) : null,
        line.metal_type || line.alloy
          ? h(
              'div',
              { class: 'text-sm text-gray-500' },
              [formatMetalType(line.metal_type), line.alloy].filter(Boolean).join(' - '),
            )
          : null,
      ])
    },
  },
  {
    id: 'quantities',
    header: 'Quantities',
    headerClass: 'text-center',
    cell: ({ row }: DataTableRowContext) => {
      const line = row.original
      const remaining = getRemaining(line)
      const totalReceived = getTotalReceived(line.id)

      return h('div', { class: 'space-y-2 text-center' }, [
        h('div', { class: 'flex items-center justify-center gap-2' }, [
          h(Package, { class: 'w-4 h-4 text-blue-500' }),
          h('span', { class: 'text-sm font-medium' }, 'Ordered:'),
          h('span', { class: 'font-bold' }, Number(line.quantity) || 0),
        ]),
        h('div', { class: 'flex items-center justify-center gap-2' }, [
          h(Package, { class: 'w-4 h-4 text-green-500' }),
          h('span', { class: 'text-sm font-medium' }, 'Previously:'),
          h('span', {}, Number(line.received_quantity) || 0),
        ]),
        h('div', { class: 'flex items-center justify-center gap-2' }, [
          h(Package, { class: 'w-4 h-4 text-orange-500' }),
          h('span', { class: 'text-sm font-medium' }, 'Remaining:'),
          h('span', { class: 'font-bold text-orange-600' }, remaining),
        ]),
        totalReceived > 0
          ? h('div', { class: 'flex items-center justify-center gap-2 mt-2 pt-2 border-t' }, [
              h(Package, { class: 'w-4 h-4 text-purple-500' }),
              h('span', { class: 'text-sm font-medium' }, 'This Receipt:'),
              h('span', { class: 'font-bold text-purple-600' }, totalReceived),
            ])
          : null,
      ])
    },
  },
  {
    id: 'allocations',
    header: 'Delivery Allocations',
    headerClass: 'text-center',
    cell: ({ row }: DataTableRowContext) => {
      const allocations = getLineAllocations(row.original.id)
      const existingAllocations = getExistingAllocations(row.original.id)
      const remaining = getRemaining(row.original)

      return h('div', { class: 'space-y-2 max-w-sm' }, [
        // Previous Allocations Summary (if any)
        existingAllocations.length > 0
          ? h('div', { class: 'p-2 border rounded-lg bg-blue-50 border-blue-200' }, [
              h('div', { class: 'flex items-center gap-1 mb-1' }, [
                h(History, { class: 'w-3 h-3 text-blue-600 flex-shrink-0' }),
                h('span', { class: 'text-xs font-medium text-blue-800' }, 'Previous Allocations'),
              ]),
              h('div', { class: 'text-xs text-blue-700' }, [
                `${existingAllocations.length} allocation${existingAllocations.length > 1 ? 's' : ''} • `,
                `Total: ${existingAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0)} units`,
              ]),
            ])
          : null,

        // Separator if there are both existing and current allocations
        existingAllocations.length > 0 && allocations.length > 0
          ? h('div', { class: 'border-t border-gray-200 my-2' })
          : null,

        // Current Receipt Allocations Header (if there are allocations)
        allocations.length > 0
          ? h('div', { class: 'text-xs font-medium text-gray-700 mb-1' }, 'This Receipt:')
          : null,

        // Current Receipt Allocations
        ...allocations.map((allocation, index) =>
          h('div', { key: index, class: 'p-2 border rounded-lg bg-gray-50 text-sm' }, [
            h('div', { class: 'flex items-center justify-between' }, [
              h('div', { class: 'flex-1 min-w-0' }, [
                h('div', { class: 'flex items-center gap-1 mb-1' }, [
                  h(Target, { class: 'w-3 h-3 text-blue-500 flex-shrink-0' }),
                  h(
                    'span',
                    { class: 'font-medium text-xs truncate' },
                    truncateText(getJobName(allocation.job_id), 10),
                  ),
                ]),
                h('div', { class: 'text-xs text-gray-600 truncate' }, [
                  `Qty: ${allocation.quantity}`,
                  allocation.job_id && allocation.retail_rate > 0
                    ? ` | ${allocation.retail_rate}%`
                    : '',
                  allocation.stock_location
                    ? ` | ${truncateText(allocation.stock_location, 8)}`
                    : '',
                ]),
              ]),
              h('div', { class: 'flex gap-1 ml-2 flex-shrink-0' }, [
                h(
                  Button,
                  {
                    variant: 'outline',
                    size: 'sm',
                    class: 'h-6 w-6 p-0',
                    onClick: () => openModal(row.original.id, index),
                  },
                  () => h(Edit, { class: 'w-3 h-3' }),
                ),
                h(
                  Button,
                  {
                    variant: 'outline',
                    size: 'sm',
                    class: 'h-6 w-6 p-0 text-red-600 hover:text-red-700',
                    onClick: () => removeAllocation(row.original.id, index),
                  },
                  () => h(Trash2, { class: 'w-3 h-3' }),
                ),
              ]),
            ]),
          ]),
        ),

        // Add Allocation Button
        remaining > 0
          ? h('div', { class: 'flex justify-center' }, [
              h(
                Button,
                {
                  variant: 'outline',
                  size: 'sm',
                  class: 'border-dashed border-2 hover:border-solid text-xs',
                  onClick: () => openModal(row.original.id),
                },
                () => [h(Plus, { class: 'w-3 h-3 mr-1' }), 'Add'],
              ),
            ])
          : null,

        // Validation warnings
        getTotalReceived(row.original.id) > remaining
          ? h(
              'div',
              { class: 'p-1 bg-red-50 border border-red-200 rounded text-xs text-red-700' },
              ['Warning: Exceeds remaining'],
            )
          : null,
      ])
    },
    meta: { editable: true },
  },
])
</script>

<template>
  <div class="flex flex-col h-full">
    <div
      class="flex-1 overflow-auto"
      :style="`max-height: ${Math.min(400, Math.max(200, props.lines.length * 120 + 100))}px`"
    >
      <DataTable
        :columns="columns"
        :data="props.lines"
        @rowClick="() => {}"
        :page-size="1000"
        :hide-footer="true"
        class="w-full"
      />
    </div>

    <!-- Allocation Modal using shadcn-vue Dialog -->
    <Dialog
      :open="isModalOpen"
      @update:open="
        (open) => {
          if (!open) closeModal()
        }
      "
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {{ editingAllocationIndex !== null ? 'Edit' : 'Add' }} Allocation
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- Allocation Target -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Allocation Target </label>
            <Select v-model="modalData.job_id">
              <SelectTrigger>
                <SelectValue placeholder="Select Job or Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="null">
                  <div class="flex items-center gap-2">
                    <MapPin class="w-4 h-4 text-gray-500" />
                    Stock Holding
                  </div>
                </SelectItem>
                <SelectItem
                  v-for="job in props.jobs.filter((j) => !j.is_stock_holding)"
                  :key="job.id"
                  :value="job.id"
                >
                  <div class="flex items-center gap-2">
                    <Package class="w-4 h-4 text-blue-500" />
                    {{ job.name }}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Quantity -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Quantity Received </label>
            <Input
              v-model.number="modalData.quantity"
              type="number"
              step="1"
              min="0"
              :max="
                editingLineId ? getRemaining(props.lines.find((l) => l.id === editingLineId)!) : 0
              "
              placeholder="Enter quantity"
            />
          </div>

          <!-- Conditional Fields -->
          <div v-if="modalData.job_id">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <div class="flex items-center gap-2">
                <DollarSign class="w-4 h-4" />
                Retail Rate (%)
              </div>
            </label>
            <Input
              v-model.number="modalData.retail_rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="e.g., 20.5"
            />
          </div>

          <div v-if="!modalData.job_id">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <div class="flex items-center gap-2">
                <MapPin class="w-4 h-4" />
                Stock Location
              </div>
            </label>
            <Input
              v-model="modalData.stock_location"
              placeholder="e.g., Pallet 12 - Rack D, Shelf 3 etc."
            />
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="closeModal"> Cancel </Button>
          <Button @click="saveAllocation">
            {{ editingAllocationIndex !== null ? 'Update' : 'Add' }} Allocation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

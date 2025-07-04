<script setup lang="ts">
import { computed, h } from 'vue'
import DataTable from '@/components/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowDown, ArrowDownToLine } from 'lucide-vue-next'

export interface PendingLine {
  id: string
  job_name?: string
  description: string
  quantity: number
  received_quantity: number
  unit_cost: number | null
  selected?: boolean
}

interface DataTableRowContext {
  row: {
    original: PendingLine
    index: number
  }
}

type Props = {
  lines: PendingLine[]
  selectedLines: string[]
}

type Emits = {
  (e: 'update:selected-lines', lineIds: string[]): void
  (e: 'move-selected-to-received'): void
  (e: 'move-all-to-received'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const allSelected = computed(
  () =>
    props.lines.length > 0 && props.lines.every((line) => props.selectedLines.includes(line.id)),
)

const columns = computed(() => [
  {
    id: 'select',
    header: () =>
      h(Checkbox, {
        modelValue: allSelected.value,
        'onUpdate:modelValue': (checked: boolean) => {
          if (checked) {
            emit(
              'update:selected-lines',
              props.lines.map((line) => line.id),
            )
          } else {
            emit('update:selected-lines', [])
          }
        },
        class: 'mx-auto',
      }),
    cell: ({ row }: DataTableRowContext) =>
      h(Checkbox, {
        modelValue: props.selectedLines.includes(row.original.id),
        'onUpdate:modelValue': (checked: boolean) => {
          const newSelection = checked
            ? [...props.selectedLines, row.original.id]
            : props.selectedLines.filter((id) => id !== row.original.id)
          emit('update:selected-lines', newSelection)
        },
        class: 'mx-auto',
      }),
    meta: { editable: true },
  },
  {
    id: 'job_name',
    header: 'Job',
    accessorKey: 'job_name',
    cell: ({ row }: DataTableRowContext) => row.original.job_name || 'N/A',
  },
  {
    id: 'description',
    header: 'Description',
    accessorKey: 'description',
  },
  {
    id: 'remaining_quantity',
    header: 'Remaining',
    cell: ({ row }: DataTableRowContext) => {
      const remaining = row.original.quantity - row.original.received_quantity
      return remaining.toFixed(2)
    },
  },
  {
    id: 'unit_cost',
    header: 'Unit Cost',
    cell: ({ row }: DataTableRowContext) =>
      row.original.unit_cost ? `$${row.original.unit_cost.toFixed(2)}` : 'N/A',
  },
])
</script>

<template>
  <div class="space-y-4">
    <!-- Action Buttons -->
    <div class="flex gap-2 justify-center">
      <Button
        @click="emit('move-selected-to-received')"
        :disabled="selectedLines.length === 0"
        class="flex items-center gap-2"
      >
        <ArrowDown class="w-4 h-4" />
        Move Selected to Received
      </Button>
      <Button
        @click="emit('move-all-to-received')"
        variant="secondary"
        :disabled="lines.length === 0"
        class="flex items-center gap-2"
      >
        <ArrowDownToLine class="w-4 h-4" />
        Move All to Received
      </Button>
    </div>

    <!-- Data Table -->
    <div class="border rounded-lg">
      <DataTable
        :columns="columns"
        :data="lines"
        @rowClick="() => {}"
        :page-size="1000"
        :hide-footer="true"
        class="min-h-[200px]"
      />

      <!-- Empty State -->
      <div v-if="lines.length === 0" class="p-8 text-center text-gray-500">
        <div class="text-lg font-medium">No pending items</div>
        <div class="text-sm">All items have been received</div>
      </div>
    </div>
  </div>
</template>

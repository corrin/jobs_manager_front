<script setup lang="ts">
import { computed, h } from 'vue'
import DataTable from '@/components/DataTable.vue'
import { Input } from '@/components/ui/input'
import type { PurchaseOrderLine } from '@/types/purchasing'

interface DeliveryReceiptLine extends PurchaseOrderLine {
  total_received: number
  job_allocation: number
  stock_allocation: number
  retail_rate: number
}

interface DataTableRowContext {
  row: {
    original: DeliveryReceiptLine
    index: number
  }
}

type Props = {
  lines: DeliveryReceiptLine[]
}

type Emits = {
  (e: 'update:lines', lines: DeliveryReceiptLine[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const columns = computed(() => [
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'quantity',
    header: 'Ordered',
  },
  {
    accessorKey: 'received_quantity',
    header: 'Prev. Received',
  },
  {
    id: 'total_received',
    header: 'Total Received',
    cell: ({ row }: DataTableRowContext) =>
      h(Input, {
        type: 'number',
        step: '1',
        min: '0',
        modelValue: row.original.total_received,
        class: 'w-24 text-right',
        'onUpdate:modelValue': (val: string | number) => {
          const num = Number(val)
          if (!Number.isNaN(num)) {
            const updated = props.lines.map((l, idx) =>
              idx === row.index ? { ...l, total_received: num } : l,
            )
            emit('update:lines', updated)
          }
        },
      }),
  },
  {
    id: 'job_allocation',
    header: 'Job Allocation',
    cell: ({ row }: DataTableRowContext) =>
      h(Input, {
        type: 'number',
        step: '1',
        min: '0',
        modelValue: row.original.job_allocation,
        class: 'w-24 text-right',
        'onUpdate:modelValue': (val: string | number) => {
          const num = Number(val)
          if (!Number.isNaN(num)) {
            const updated = props.lines.map((l, idx) =>
              idx === row.index ? { ...l, job_allocation: num } : l,
            )
            emit('update:lines', updated)
          }
        },
      }),
  },
  {
    id: 'retail_rate',
    header: 'Retail Rate',
    cell: ({ row }: DataTableRowContext) =>
      h(Input, {
        type: 'number',
        step: '0.01',
        min: '0',
        modelValue: row.original.retail_rate,
        class: 'w-24 text-right',
        'onUpdate:modelValue': (val: string | number) => {
          const num = Number(val)
          if (!Number.isNaN(num)) {
            const updated = props.lines.map((l, idx) =>
              idx === row.index ? { ...l, retail_rate: num } : l,
            )
            emit('update:lines', updated)
          }
        },
      }),
  },
])
</script>

<template>
  <DataTable
    :columns="columns"
    :data="props.lines"
    @rowClick="() => {}"
    :page-size="1000"
    :hide-footer="true"
  />
</template>

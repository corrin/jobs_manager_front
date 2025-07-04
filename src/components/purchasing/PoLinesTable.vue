<script setup lang="ts">
import { computed, h } from 'vue'
import DataTable from '@/components/DataTable.vue'
import ItemSelect from '@/views/purchasing/ItemSelect.vue'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-vue-next'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

interface Line {
  id?: string
  item_code: string
  description: string
  quantity: number
  unit_cost: number | null
  price_tbc: boolean
}

interface XeroItem {
  id: string
  code: string
  name: string
  unit_cost?: number | null
}

interface DataTableRowContext {
  row: {
    original: Line
    index: number
  }
}

type Props = {
  lines: Line[]
  items: XeroItem[]
}

type Emits = {
  (e: 'update:lines', lines: Line[]): void
  (e: 'add-line'): void
  (e: 'delete-line', id: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const columns = computed(() => [
  {
    id: 'item_code',
    header: 'Item',
    cell: ({ row }: DataTableRowContext) =>
      h(ItemSelect, {
        modelValue: row.original.item_code,
        items: props.items,
        clearable: true,
        'onUpdate:modelValue': (val: string) => {
          const found = props.items.find((i) => i.code === val)
          const updated = props.lines.map((l, idx) =>
            idx === row.index
              ? {
                  ...l,
                  item_code: val,
                  description: found ? found.name : '',
                  unit_cost: found && found.unit_cost != null ? found.unit_cost : null,
                }
              : l,
          )
          emit('update:lines', updated)
        },
      }),
    meta: { editable: true },
  },
  {
    id: 'description',
    header: 'Description',
    cell: ({ row }: DataTableRowContext) =>
      h(Input, {
        modelValue: row.original.description,
        disabled: !!row.original.item_code,
        class: 'w-full',
        onClick: (e: Event) => e.stopPropagation(),
        'onUpdate:modelValue': (val: string) => {
          const updated = props.lines.map((l, idx) =>
            idx === row.index ? { ...l, description: val } : l,
          )
          emit('update:lines', updated)
        },
      }),
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
        class: 'w-20 text-right',
        onClick: (e: Event) => e.stopPropagation(),
        'onUpdate:modelValue': (val: string | number) => {
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
        disabled: !!row.original.item_code,
        class: 'w-24 text-right',
        onClick: (e: Event) => e.stopPropagation(),
        'onUpdate:modelValue': (val: string | number) => {
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
        disabled: row.original.unit_cost !== null,
        'onUpdate:modelValue': (checked: boolean) => {
          const updated = props.lines.map((l, idx) =>
            idx === row.index ? { ...l, price_tbc: checked } : l,
          )
          emit('update:lines', updated)
        },
        class: 'mx-auto',
      }),
    meta: { editable: true },
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
          onClick: () => {
            if (row.original.id) {
              emit('delete-line', row.original.id)
            } else {
              emit('delete-line', row.index.toString())
            }
          },
        },
        () => h(Trash2, { class: 'w-4 h-4' }),
      ),
    meta: { editable: true },
  },
])
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto max-h-[70vh]">
      <DataTable
        :columns="columns"
        :data="props.lines"
        @rowClick="() => {}"
        :page-size="1000"
        :hide-footer="true"
      />
    </div>
    <div class="sticky bottom-0 bg-white z-10 p-2 border-t">
      <Button class="w-full" @click="() => emit('add-line')">＋ Add line</Button>
    </div>
  </div>
</template>

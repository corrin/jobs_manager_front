<template>
  <AppLayout>
    <div class="p-4 md:p-8 flex flex-col gap-4">
      <Card class="rounded-2xl shadow-lg">
        <CardHeader class="border-b">
          <div class="flex items-center gap-2">
            <FileText class="w-6 h-6 text-indigo-600" />
            <h1 class="text-xl font-bold">Purchase Order</h1>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input v-model="reference" placeholder="Reference" />
            <Input v-model="supplier" placeholder="Supplier" />
          </div>
          <DataTable :columns="columns" :data="lines" @add="addLine" />
        </CardContent>
        <CardFooter class="flex justify-end">
          <Button variant="secondary" @click="save">Save</Button>
        </CardFooter>
      </Card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText } from 'lucide-vue-next'
import { ref, h, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import { usePurchaseOrderStore } from '@/stores/purchaseOrderStore'
import { useXeroItemStore } from '@/stores/xeroItemStore'
import { toast } from 'vue-sonner'

interface Line {
  id?: string
  item_code: string
  description: string
  quantity: number
  unit_cost: number | null
  price_tbc: boolean
}

const route = useRoute()
const orderId = route.params.id as string

const store = usePurchaseOrderStore()
const itemStore = useXeroItemStore()

const reference = ref('')
const supplier = ref('')
const lines = ref<Line[]>([])

function itemSelectCell(row: { original: Line }) {
  return h(
    Select,
    {
      modelValue: row.original.item_code,
      'onUpdate:modelValue': (val: string) => {
        row.original.item_code = val
        const found = itemStore.items.find((i) => i.code === val)
        row.original.description = found ? found.name : ''
      },
      class: 'w-32',
    },
    {
      default: () => [
        h(SelectTrigger, null, {
          default: () => h(SelectValue, { placeholder: 'Select' }),
        }),
        h(SelectContent, null, {
          default: () => itemStore.items.map((i) => h(SelectItem, { value: i.code }, () => i.code)),
        }),
      ],
    },
  )
}

const columns: ColumnDef<Line>[] = [
  {
    accessorKey: 'item_code',
    header: 'Item',
    cell: itemSelectCell,
  },
  { accessorKey: 'description', header: 'Description', meta: { editable: false } },
  { accessorKey: 'quantity', header: 'Qty' },
  {
    accessorKey: 'unit_cost',
    header: 'Unit Cost',
    cell: ({ row }) =>
      h(Input, {
        type: 'number',
        class: 'w-24',
        disabled: row.original.price_tbc,
        modelValue: row.original.unit_cost,
        'onUpdate:modelValue': (v: number) => (row.original.unit_cost = Number(v)),
      }),
  },
  {
    accessorKey: 'price_tbc',
    header: 'Price TBC',
    cell: ({ row }) =>
      h(Checkbox, {
        modelValue: row.original.price_tbc,
        'onUpdate:modelValue': (v: boolean) => {
          row.original.price_tbc = v
          if (v) row.original.unit_cost = null
        },
      }),
  },
]

function addLine() {
  lines.value.push({ item_code: '', description: '', quantity: 1, unit_cost: 0, price_tbc: false })
}

async function load() {
  const data = await store.fetchOne(orderId)
  reference.value = data.reference || ''
  supplier.value = data.supplier || ''
  lines.value = (data.lines as Line[]) || []
}

async function save() {
  const payload = {
    reference: reference.value,
    supplier: supplier.value,
    lines: lines.value.map((l) => ({
      ...l,
      unit_cost: l.price_tbc ? null : l.unit_cost,
    })),
  }
  await store.patch(orderId, payload)
  toast.success('Purchase order saved')
  await load()
}

onMounted(async () => {
  await Promise.all([itemStore.fetchItems(), load()])
})
</script>

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
      </Card>
    </div>
  </AppLayout>
</template>
<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FileText } from 'lucide-vue-next'
import { ref } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'

interface Line {
  description: string
  quantity: number
  unit_cost: number
}
const lines = ref<Line[]>([])
const reference = ref('')
const supplier = ref('')

const columns: ColumnDef<Line>[] = [
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'quantity', header: 'Qty' },
  { accessorKey: 'unit_cost', header: 'Unit Cost' },
]

function addLine() {
  lines.value.push({ description: '', quantity: 1, unit_cost: 0 })
}
</script>

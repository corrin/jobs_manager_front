<template>
  <AppLayout>
    <div class="p-4 md:p-8 flex flex-col gap-4">
      <Card class="rounded-2xl shadow-lg">
        <CardHeader class="border-b">
          <div class="flex items-center gap-2">
            <Package class="w-6 h-6 text-indigo-600" />
            <h1 class="text-xl font-bold">Delivery Receipt</h1>
          </div>
        </CardHeader>
        <CardContent class="space-y-6">
          <div>
            <h2 class="font-semibold mb-2">Pending</h2>
            <DataTable :columns="columns" :data="pending" />
          </div>
          <div>
            <h2 class="font-semibold mb-2">Received</h2>
            <DataTable :columns="columns" :data="received" />
          </div>
        </CardContent>
      </Card>
    </div>
  </AppLayout>
</template>
<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Package } from 'lucide-vue-next'
import { ref } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'

interface Line {
  description: string
  quantity: number
}
const pending = ref<Line[]>([])
const received = ref<Line[]>([])

const columns: ColumnDef<Line>[] = [
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'quantity', header: 'Qty' },
]
</script>

<template>
  <AppLayout>
    <div class="p-4 md:p-8 flex flex-col gap-4">
      <Card class="rounded-2xl shadow-lg">
        <CardHeader class="border-b">
          <div class="flex items-center gap-2">
            <Package class="w-6 h-6 text-indigo-600" />
            <h1 class="text-xl font-bold">Delivery Receipts</h1>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable :columns="columns" :data="receipts" @row-click="openRow" />
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
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import api from '@/plugins/axios'

interface Receipt {
  id: string
  po_number: string
  received: string
}
const receipts = ref<Receipt[]>([])
const router = useRouter()

const columns: ColumnDef<Receipt>[] = [
  { accessorKey: 'po_number', header: 'PO #' },
  { accessorKey: 'supplier', header: 'Supplier' },
  { accessorKey: 'received', header: 'Date' },
  { accessorKey: 'status', header: 'Status' },
]

function openRow(row: Receipt) {
  router.push(`/purchasing/receipt/${row.id}`)
}

onMounted(async () => {
  const res = await api.get('/purchasing/rest/purchase-orders/', {
    params: { status: 'received' },
  })
  receipts.value = Array.isArray(res.data) ? res.data : []
})
</script>

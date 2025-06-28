<template>
  <AppLayout>
    <div class="p-4 md:p-8 flex flex-col gap-4">
      <Card class="rounded-2xl shadow-lg">
        <CardHeader class="border-b">
          <div class="flex items-center gap-2">
            <FileText class="w-6 h-6 text-indigo-600" />
            <h1 class="text-xl font-bold">Purchase Orders</h1>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable :columns="columns" :data="orders" @add="createNew" @row-click="openRow" />
        </CardContent>
      </Card>
    </div>
  </AppLayout>
</template>
<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FileText } from 'lucide-vue-next'
import { usePurchaseOrderStore } from '@/stores/purchaseOrderStore'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'

const router = useRouter()
const store = usePurchaseOrderStore()
const orders = store.orders

const columns: ColumnDef<(typeof orders.value)[0]>[] = [
  {
    accessorKey: 'po_number',
    header: 'PO #',
  },
  {
    accessorKey: 'supplier',
    header: 'Supplier',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
]

async function createNew() {
  const res = await store.createOrder({})
  if (res?.id) router.push(`/purchasing/po/${res.id}`)
}

function openRow(row: (typeof orders.value)[0]) {
  router.push(`/purchasing/po/${row.id}`)
}

onMounted(() => {
  store.fetchOrders()
})
</script>

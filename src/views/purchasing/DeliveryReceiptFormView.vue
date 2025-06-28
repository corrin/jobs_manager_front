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
            <DataTable :columns="columns" :data="pending" @row-click="moveOne" />
            <Button size="sm" class="mt-2" @click="moveAll">Move all</Button>
          </div>
          <div>
            <h2 class="font-semibold mb-2">Received</h2>
            <DataTable :columns="columns" :data="received" />
            <div class="flex justify-end mt-4">
              <Button variant="secondary" @click="save">Save</Button>
            </div>
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
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ColumnDef } from '@tanstack/vue-table'
import api from '@/plugins/axios'
import { toast } from 'vue-sonner'

interface Line {
  id: string
  description: string
  quantity: number
}
const pending = ref<Line[]>([])
const received = ref<Line[]>([])
const route = useRoute()
const router = useRouter()
const poId = route.params.poId as string

const columns: ColumnDef<Line>[] = [
  { accessorKey: 'description', header: 'Description', meta: { editable: false } },
  { accessorKey: 'quantity', header: 'Qty' },
]

function moveOne(row: Line) {
  pending.value = pending.value.filter((l) => l.id !== row.id)
  received.value.push({ ...row })
}

function moveAll() {
  received.value.push(...pending.value)
  pending.value = []
}

async function save() {
  const allocations: Record<string, number> = {}
  received.value.forEach((l) => {
    allocations[l.id] = l.quantity
  })
  await api.post('/purchasing/rest/delivery-receipts/', {
    purchase_order_id: poId,
    allocations,
  })
  toast.success('Receipt saved')
  router.push('/purchasing/receipts')
}

onMounted(async () => {
  const res = await api.get(`/purchasing/rest/purchase-orders/${poId}/`)
  pending.value = Array.isArray(res.data.lines) ? res.data.lines : []
})
</script>

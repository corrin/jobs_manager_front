<template>
  <AppLayout>
    <div class="p-4 md:p-8 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold flex items-center gap-2">
          <FileText class="w-6 h-6 text-indigo-600" /> Purchase Orders
        </h1>
        <div class="flex gap-2">
          <Button @click="goToCreate"> <PlusCircle class="w-4 h-4 mr-2" /> New PO </Button>
          <Button @click="createFromQuote" variant="secondary" class="px-5 py-2 text-base"
            >From Quote</Button
          >
        </div>
      </div>

      <div class="overflow-y-auto max-h-[67vh] rounded-2xl shadow-lg border">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 border-b">
            <tr>
              <th class="p-3 text-left font-semibold">PO #</th>
              <th class="p-3 text-left font-semibold">Supplier</th>
              <th class="p-3 text-left font-semibold">Date</th>
              <th class="p-3 text-left font-semibold">Status</th>
              <th class="p-3 w-24 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="po in pagedOrders" :key="po.id" class="border-b hover:bg-slate-50">
              <td class="p-3">{{ po.po_number }}</td>
              <td class="p-3">{{ po.supplier }}</td>
              <td class="p-3">{{ formatDate(po.order_date) }}</td>
              <td class="p-3">{{ formatStatus(po.status) }}</td>
              <td class="p-3 flex justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  @click="openRow(po.id)"
                  class="w-8 h-8 p-0"
                  aria-label="Edit Purchase Order"
                >
                  <Pencil class="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  @click="deletePo(po.id)"
                  class="w-8 h-8 p-0"
                  aria-label="Delete Purchase Order"
                >
                  <Trash2 class="w-4 h-4 text-red-500" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex justify-center mt-2">
        <Pagination
          :page="page"
          :total="totalPages"
          @update:page="page = $event"
          class="space-x-2"
          btn-class="px-3 py-1 rounded-lg border bg-white hover:bg-slate-100 text-sm font-medium"
          active-btn-class="bg-indigo-600 text-white border-indigo-600"
        />
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import { FileText, Pencil, Trash2, PlusCircle } from 'lucide-vue-next'
import { usePurchaseOrderStore } from '@/stores/purchaseOrderStore'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Pagination from '@/components/ui/pagination/Pagination.vue'

const router = useRouter()
const store = usePurchaseOrderStore()
const orders = computed(() => store.orders)

const page = ref(1)
const pageSize = 10

const totalPages = computed(() => Math.max(1, Math.ceil(orders.value.length / pageSize)))

const pagedOrders = computed(() => {
  const start = (page.value - 1) * pageSize
  return orders.value.slice(start, start + pageSize)
})

// Reset to first page if orders change and current page is out of range
watch(
  () => orders.value.length,
  () => {
    if (page.value > totalPages.value) page.value = 1
  },
)

const formatStatus = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'submitted':
      return 'Submitted to Supplier'
    case 'partially_received':
      return 'Partially Received'
    case 'fully_received':
      return 'Fully Received'
    case 'deleted':
      return 'Deleted'
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const openRow = (id: string) => router.push(`/purchasing/po/${id}`)
const goToCreate = () => router.push('/purchasing/po/create')
const createFromQuote = () => router.push('/purchasing/po/create-from-quote')
const deletePo = (id: string) => store.deleteOrder(id)

onMounted(() => {
  store.fetchOrders()
})
</script>

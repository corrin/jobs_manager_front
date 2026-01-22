<template>
  <AppLayout>
    <div class="p-4 md:p-8 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold flex items-center gap-2">
          <FileText class="w-6 h-6 text-indigo-600" /> Purchase Orders
        </h1>
        <div class="flex gap-2">
          <Button @click="goToCreate" data-automation-id="PurchaseOrderView-new-po">
            <PlusCircle class="w-4 h-4 mr-2" /> New PO
          </Button>
          <Button
            @click="createFromQuote"
            variant="secondary"
            class="px-5 py-2 text-base"
            data-automation-id="PurchaseOrderView-from-quote"
          >
            <FileSpreadsheet class="w-4 h-4 mr-2" />
            From Quote
          </Button>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <div class="relative flex-1 max-w-md">
          <Search
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
          />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Search by PO #, Job, Supplier, or Status..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div
        v-if="drafts.length"
        class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-800">Local drafts</h2>
          <span class="text-xs text-slate-500">{{ drafts.length }} saved locally</span>
        </div>
        <div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="draft in drafts"
            :key="draft.draftId"
            class="rounded-lg border border-slate-200 bg-white p-3 flex flex-col gap-2 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div class="text-sm font-semibold text-slate-900">
                {{ draft.reference || draft.label || 'Untitled PO' }}
              </div>
              <span class="text-[11px] text-slate-500">
                {{ new Date(draft.updatedAt).toLocaleString() }}
              </span>
            </div>
            <div class="text-xs text-slate-600">
              Supplier:
              <span class="font-medium">{{ draft.supplier_id ? 'Selected' : 'Not set' }}</span>
            </div>
            <div class="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                class="flex-1"
                @click="openDraft(draft.draftId)"
              >
                Resume
              </Button>
              <Button size="sm" variant="outline" @click="deleteDraft(draft.draftId)">
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="overflow-y-auto max-h-[70.3vh] lg:max-h-[80vh] xl:max-h-[85vh] rounded-2xl shadow-lg border"
      >
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 border-b">
            <tr>
              <th class="p-3 text-left font-semibold">PO #</th>
              <th class="p-3 text-left font-semibold">Jobs</th>
              <th class="p-3 text-left font-semibold">Supplier</th>
              <th class="p-3 text-left font-semibold">Date</th>
              <th class="p-3 text-left font-semibold">Created By</th>
              <th class="p-3 text-left font-semibold">Status</th>
              <th class="p-3 w-24 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="po in pagedOrders"
              :key="po.id"
              class="border-b hover:bg-slate-50"
              :class="{ 'opacity-60 bg-red-50': isPoDeleted(normalizeStatus(po.status)) }"
            >
              <td class="p-3">
                <a
                  @click="openRow(po.id)"
                  class="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  {{ po.po_number }}
                </a>
              </td>
              <td class="p-3">{{ formatJobs(po.jobs) }}</td>
              <td class="p-3">{{ po.supplier }}</td>
              <td class="p-3">{{ formatDate(po.order_date) }}</td>
              <td class="p-3" :data-automation-id="`PurchaseOrderView-created-by-${po.id}`">
                {{ po.created_by_name || '—' }}
              </td>
              <td class="p-3">
                <span :class="getStatusClass(normalizeStatus(po.status))">
                  {{ formatStatus(normalizeStatus(po.status)) }}
                </span>
              </td>
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
                  :disabled="isPoDeleted(normalizeStatus(po.status))"
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
import { debugLog } from '@/utils/debug'

import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import { FileText, Pencil, Trash2, PlusCircle, FileSpreadsheet, Search } from 'lucide-vue-next'
import { usePurchaseOrderStore } from '@/stores/purchaseOrderStore'
import { computed, onMounted, ref, watch, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import Pagination from '@/components/ui/pagination/Pagination.vue'
import { toast } from 'vue-sonner'
import { schemas } from '@/api/generated/api'
import { listPoDrafts, deletePoDraft } from '@/composables/usePoDrafts'

const statusOptions = schemas.PurchaseOrderDetailStatusEnum.options
type PurchaseOrderStatus = (typeof statusOptions)[number]

const router = useRouter()
const store = usePurchaseOrderStore()
const orders = computed(() => store.orders)
const drafts = ref(listPoDrafts())
const combinedOrders = computed(() => {
  const mappedDrafts = drafts.value.map((draft) => ({
    id: `draft-${draft.draftId}`,
    po_number: draft.po_number || draft.reference || draft.label || 'Local Draft',
    status: 'local_draft' as PurchaseOrderStatus,
    order_date: draft.order_date || new Date().toISOString(),
    supplier: draft.supplier || 'Local draft',
    supplier_id: draft.supplier_id,
    created_by_id: null,
    created_by_name: 'Local Draft',
    jobs: [],
  }))
  return [...mappedDrafts, ...orders.value]
})

const page = ref(1)
const pageSize = 11
const searchTerm = ref('')

const normalizeStatus = (status?: string): PurchaseOrderStatus => {
  if (status && statusOptions.includes(status as PurchaseOrderStatus)) {
    return status as PurchaseOrderStatus
  }
  return 'draft'
}

const filteredOrders = computed(() => {
  if (!searchTerm.value.trim()) {
    return combinedOrders.value
  }

  const term = searchTerm.value.toLowerCase()
  return combinedOrders.value.filter((po) => {
    const statusValue = normalizeStatus(po.status)
    const jobsMatch = po.jobs?.some((job) => job.job_number.toLowerCase().includes(term))
    return (
      po.po_number.toLowerCase().includes(term) ||
      po.supplier.toLowerCase().includes(term) ||
      formatStatus(statusValue).toLowerCase().includes(term) ||
      jobsMatch
    )
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredOrders.value.length / pageSize)))

const pagedOrders = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredOrders.value.slice(start, start + pageSize)
})

watch(
  () => orders.value.length,
  () => {
    if (page.value > totalPages.value) page.value = 1
  },
)

watch(searchTerm, () => {
  page.value = 1
})

const statusLabels: Record<PurchaseOrderStatus, string> = {
  draft: 'Draft',
  local_draft: 'Local Draft',
  submitted: 'Submitted to Supplier',
  partially_received: 'Partially Received',
  fully_received: 'Fully Received',
  deleted: 'Deleted',
}

const statusClasses: Record<PurchaseOrderStatus, string> = {
  draft: 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
  local_draft: 'px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800',
  submitted: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
  partially_received: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
  fully_received: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
  deleted: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
}

const formatStatus = (status: PurchaseOrderStatus) => statusLabels[status] ?? status

const getStatusClass = (status: PurchaseOrderStatus) => statusClasses[status] ?? statusClasses.draft

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

type PurchaseOrderJob = { job_number: string; name: string; client: string }

const formatJobs = (jobs: PurchaseOrderJob[]) => {
  if (!jobs || jobs.length === 0) return '—'
  if (jobs.length === 1) return jobs[0].job_number
  if (jobs.length === 2) return `${jobs[0].job_number}, ${jobs[1].job_number}`
  return `${jobs[0].job_number} +${jobs.length - 1} others`
}

const openRow = (id: string) => router.push(`/purchasing/po/${id}`)
const goToCreate = () => router.push('/purchasing/po/new')
const createFromQuote = () => router.push('/purchasing/po/create-from-quote')
const openDraft = (id: string) => router.push({ path: '/purchasing/po/new', query: { draft: id } })

const deleteDraft = (id: string) => {
  deletePoDraft(id)
  drafts.value = listPoDrafts()
  toast.success('Draft removed')
}

const deletePo = async (id: string) => {
  if (id.startsWith('draft-')) {
    deleteDraft(id.replace('draft-', ''))
    return
  }

  const purchaseOrder = orders.value.find((p) => p.id === id)
  const statusValue = normalizeStatus(purchaseOrder?.status)

  if (!purchaseOrder || isPoDeleted(statusValue)) {
    toast.warning('This purchase order is already deleted')
    return
  }

  const confirmed = confirm(
    `Are you sure you want to delete Purchase Order ${purchaseOrder.po_number}? This action will mark it as deleted but preserve the record.`,
  )
  if (!confirmed) return

  try {
    await store.fetchOne(id) // Fetch detail to capture ETag
    await store.patch(id, { status: 'deleted' })

    await store.fetchOrders()

    toast.success('Purchase order deleted successfully')
  } catch (error) {
    debugLog('Error deleting purchase order:', error)
    toast.error('Failed to delete the purchase order. Please try again.')
  }
}

const isPoDeleted = (status: PurchaseOrderStatus) => status === 'deleted'

onMounted(() => {
  store.fetchOrders()
  drafts.value = listPoDrafts()
})

onActivated(() => {
  drafts.value = listPoDrafts()
})
</script>
